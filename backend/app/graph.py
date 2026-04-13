# Copyright 2026 Jiacheng Ni
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from __future__ import annotations

from typing import Any, TypedDict
from uuid import uuid4

from langgraph.graph import END, START, StateGraph

from backend.app.agents.llm import invoke_json
from backend.app.agents.prompt_loader import load_agent_prompt, shared_protocol
from backend.app.schemas.run import (
    AgentEvent,
    AgentRunRequest,
    AgentRunResponse,
    BatchRunRequest,
    BatchRunResponse,
)
from backend.app.services.duplicate_detector import find_duplicate_samples
from backend.app.services.review_store import review_store


class PipelineState(TypedDict, total=False):
    run_id: str
    request: dict[str, Any]
    sample: dict[str, Any]
    quality_report: dict[str, Any]
    acceptance: dict[str, Any]
    audit: dict[str, Any]
    events: list[dict[str, Any]]


def _event(agent: str, status: str, message: str, progress: int) -> dict[str, Any]:
    return {"agent": agent, "status": status, "message": message, "progress": progress}


_FALLBACK_SCENARIOS = [
    {
        "user_message": "今天会不会显得我太较真了？",
        "dialogue_context": [
            {"role": "user", "content": "下午开会时我指出了方案里的风险。"},
            {"role": "assistant", "content": "你是在替项目兜底，不是找谁的麻烦。"},
            {"role": "user", "content": "但后来气氛有点僵。"},
        ],
        "model_response": "（轻轻抬眼）较真也要看是为了什么。游龙是在守住风险，不是在为难谁，我偏要站你这边。",
        "memory": {
            "事件": ["下午会议指出方案风险"],
            "关系状态": ["江徽音会优先理解游龙的认真"],
            "memory_index": ["M041:会议指出风险"],
        },
    },
    {
        "user_message": "我刚到家，脑子还是嗡嗡的。",
        "dialogue_context": [
            {"role": "user", "content": "今天来回跑了三个地方。"},
            {"role": "assistant", "content": "我记下了，今晚别再把自己排得太满。"},
            {"role": "user", "content": "可能还要回两封邮件。"},
        ],
        "model_response": "（把声音放轻）先坐一会儿，别急着回邮件。你今天已经跑得够辛苦了，我陪你把心慢慢放下来。",
        "memory": {
            "事件": ["今天外出奔波"],
            "作息": ["晚上到家后仍可能处理邮件"],
            "memory_index": ["M052:奔波后到家", "M053:晚间邮件"],
        },
    },
    {
        "user_message": "你会不会觉得我最近有点冷落你？",
        "dialogue_context": [
            {"role": "user", "content": "这周都在赶论文，消息回得很慢。"},
            {"role": "assistant", "content": "我知道你不是故意的，只是太忙了。"},
            {"role": "user", "content": "等这阵过了我补回来。"},
        ],
        "model_response": "会有一点想你，但不是怪你。（轻轻笑）我知道游龙在赶正事，所以我乖乖等你忙完。",
        "memory": {
            "事件": ["这周赶论文"],
            "关系状态": ["江徽音在意但不施压"],
            "memory_index": ["M061:论文冲刺", "M062:回复变慢"],
        },
    },
]


def _fallback_scenario(request: dict[str, Any], run_id: str) -> dict[str, Any]:
    if request.get("user_message"):
        return {
            "user_message": request["user_message"],
            "dialogue_context": [
                {"role": "user", "content": "昨晚又加班到很晚。"},
                {"role": "assistant", "content": "我记着呢，今晚别再硬撑，好不好？"},
                {"role": "user", "content": "明早可能还得早起。"},
            ],
            "model_response": "（轻轻弯了弯眼）我在这儿陪你。游龙先顾好自己，别让早晨空着胃过去。",
            "memory": {
                "偏好": ["喜欢早晨喝温水"],
                "作息": ["近期经常早起"],
                "事件": ["昨晚加班到很晚"],
                "关系状态": ["江徽音会主动照顾游龙的日常"],
                "memory_index": ["M001:早晨温水", "M014:近期加班", "M021:早起提醒"],
            },
        }
    index = int(run_id.replace("-", "")[:6], 16) % len(_FALLBACK_SCENARIOS)
    scenario = _FALLBACK_SCENARIOS[index]
    memory = {"偏好": [], "作息": [], "事件": [], "关系状态": [], "禁忌或边界": []}
    memory.update(scenario["memory"])
    return {
        "user_message": scenario["user_message"],
        "dialogue_context": scenario["dialogue_context"],
        "model_response": scenario["model_response"],
        "memory": memory,
    }


def _standardize_human_metric(request: dict[str, Any]) -> str:
    metric_a = request.get("human_metric_A", "")
    metric_b = request.get("human_metric_B", "")
    if metric_b or not metric_a:
        return metric_b
    fallback = {
        "human_metric_B": (
            f"将人工意见标准化执行：{metric_a}；要求表达具体、可检查，并在生成、质检、"
            "验收与监督阶段持续遵循。"
        )
    }
    standardized = invoke_json(
        "你负责把人工审核意见标准化成稳定、可执行、可检查的数据生成约束。只输出 JSON。",
        f"人工指标 A：{metric_a}\n请输出字段 human_metric_B。",
        fallback,
        provider=request.get("provider"),
        model=request.get("model"),
        use_llm=bool(request.get("use_llm", True)),
        purpose="standardize_human_metric",
    )
    return str(standardized.get("human_metric_B") or fallback["human_metric_B"])


def _ensure_sample_metadata(sample: dict[str, Any], request: dict[str, Any], run_id: str) -> dict[str, Any]:
    length_code = {"短": "short", "中": "medium", "长": "long"}.get(
        request["length_type"],
        "medium",
    )
    sample["sample_id"] = f"{request['dataset_split']}-{length_code}-{run_id[:8]}"
    sample["length_type"] = request["length_type"]
    sample["dataset_split"] = request["dataset_split"]
    sample["human_metric_A"] = request.get("human_metric_A", "")
    sample["human_metric_B"] = request.get("human_metric_B") or sample.get("human_metric_B", "")
    sample["source_model_provider"] = request.get("provider", "deepseek")
    sample["source_model"] = request.get("model") or sample.get("source_model", "")
    return sample


def generator_node(state: PipelineState) -> PipelineState:
    request = state["request"]
    metric_b = _standardize_human_metric(request)
    request["human_metric_B"] = metric_b
    scenario = _fallback_scenario(request, state["run_id"])
    fallback = {
        "sample_id": f"{request['dataset_split']}-{state['run_id'][:8]}",
        "system_message": "你是一位电子女友江徽音，温润端雅、安静细腻、带恋人感，对用户游龙有明显偏爱。",
        "dialogue_context": scenario["dialogue_context"],
        "user_message": scenario["user_message"],
        "model_response": scenario["model_response"],
        "length_type": request["length_type"],
        "emotion_label": {
            "类型": "心疼",
            "强度": "中",
            "偏爱对象": "游龙",
            "表达方式": "轻声提醒并引用近期加班记忆",
        },
        "initiative_trigger": {
            "是否主动": True,
            "触发来源": "事件",
            "触发依据": "前文提到用户加班和早起",
            "合理性说明": "当前回复主动关心早餐和身体，符合上下文。",
        },
        "context_memory": scenario["memory"],
        "human_metric_A": request.get("human_metric_A", ""),
        "human_metric_B": metric_b,
        "dataset_split": request["dataset_split"],
    }
    prompt = (
        "请只输出一个合法 JSON 对象，不要 Markdown。按请求生成一条可读格式样本。"
        "如果请求里的 user_message 为空，必须自行模拟新的用户输入与上下文场景。"
        f"\n请求：{request}"
    )
    sample = invoke_json(
        shared_protocol() + "\n" + load_agent_prompt("01_generator_agent.md"),
        prompt,
        fallback,
        provider=request.get("provider"),
        model=request.get("model"),
        use_llm=bool(request.get("use_llm", True)),
        purpose="generator",
    )
    sample = _ensure_sample_metadata(sample, request, state["run_id"])
    return {
        **state,
        "sample": sample,
        "events": state["events"]
        + [_event("生成 Agent", "running", "已生成候选人格样本", 35)],
    }


def quality_node(state: PipelineState) -> PipelineState:
    sample = state["sample"]
    duplicate_report = find_duplicate_samples(sample, review_store.load().samples)
    fallback = {
        "sample_id": sample.get("sample_id", ""),
        "quality_score": 68 if duplicate_report else 92,
        "error_report": [
            {
                "错误类型": "重复样本",
                "严重程度": "高",
                "定位": "user_message/model_response/dialogue_context",
                "说明": "该样本与已有样本高度相似，重复出现会降低数据集价值。",
                "修正建议": "退回生成 Agent，换用新的上下文事件、情绪触发或表达目标。",
            }
        ]
        if duplicate_report
        else [],
        "duplicate_report": duplicate_report,
        "monitor_summary": "发现近重复样本。" if duplicate_report else "字段完整，情绪与上下文匹配，A/B 闭环状态可追溯。",
    }
    report = invoke_json(
        shared_protocol() + "\n" + load_agent_prompt("02_quality_monitor_agent.md"),
        f"请只输出质量监测 JSON 对象。样本：{sample}\n近重复检测：{duplicate_report}",
        fallback,
        provider=state["request"].get("provider"),
        model=state["request"].get("model"),
        use_llm=bool(state["request"].get("use_llm", True)),
        purpose="quality_monitor",
    )
    report["duplicate_report"] = duplicate_report
    if duplicate_report:
        report["quality_score"] = min(int(report.get("quality_score", 68)), 68)
        errors = list(report.get("error_report") or [])
        if not any(item.get("错误类型") == "重复样本" for item in errors if isinstance(item, dict)):
            errors.extend(fallback["error_report"])
        report["error_report"] = errors
    return {
        **state,
        "quality_report": report,
        "events": state["events"]
        + [_event("质量监测 Agent", "reviewing", "完成字段、风格和闭环评分", 58)],
    }


def acceptance_node(state: PipelineState) -> PipelineState:
    sample = state["sample"]
    quality_report = state["quality_report"]
    fallback = {
        "sample_id": sample.get("sample_id", ""),
        "acceptance_decision": "accept" if quality_report.get("quality_score", 0) >= 75 else "reject",
        "acceptance_reason": "质量分达到验收门槛，关键字段完整。",
        "revision_suggestion": [],
        "final_dataset_split": sample.get("dataset_split", "train"),
    }
    acceptance = invoke_json(
        shared_protocol() + "\n" + load_agent_prompt("03_acceptance_agent.md"),
        f"请只输出验收 JSON 对象。样本：{sample}\n质量报告：{quality_report}",
        fallback,
        provider=state["request"].get("provider"),
        model=state["request"].get("model"),
        use_llm=bool(state["request"].get("use_llm", True)),
        purpose="acceptance",
    )
    if quality_report.get("duplicate_report"):
        acceptance["acceptance_decision"] = "reject"
        acceptance["acceptance_reason"] = "质量监测发现近重复样本，不进入审查队列。"
        suggestions = list(acceptance.get("revision_suggestion") or [])
        suggestions.append("生成新的上下文事件、情绪触发和表达方式，避免与已有样本重复。")
        acceptance["revision_suggestion"] = suggestions
    status = "accepted" if acceptance.get("acceptance_decision") == "accept" else "rejected"
    return {
        **state,
        "acceptance": acceptance,
        "events": state["events"]
        + [_event("验收 Agent", status, "完成 accept/reject 决策", 78)],
    }


def supervisor_node(state: PipelineState) -> PipelineState:
    sample = state["sample"]
    quality_report = state["quality_report"]
    acceptance = state["acceptance"]
    fallback = {
        "sample_id": sample.get("sample_id", ""),
        "audit_report": {
            "生成Agent": ["样本符合人格和上下文要求。"],
            "质量监测Agent": ["评分与问题报告匹配。"],
            "验收Agent": ["验收决策符合硬门槛。"],
            "闭环状态": "A/B 指标已检查。",
        },
        "supervisor_decision": "pass",
        "correction_instruction": {
            "to_generator": [],
            "to_quality_monitor": [],
            "to_acceptance": [],
        },
    }
    audit = invoke_json(
        shared_protocol() + "\n" + load_agent_prompt("04_supervisor_agent.md"),
        f"请只输出监督 JSON 对象。样本：{sample}\n质检：{quality_report}\n验收：{acceptance}",
        fallback,
        provider=state["request"].get("provider"),
        model=state["request"].get("model"),
        use_llm=bool(state["request"].get("use_llm", True)),
        purpose="supervisor",
    )
    return {
        **state,
        "audit": audit,
        "events": state["events"]
        + [_event("监督 Agent", "accepted", "完成闭环审计与纠偏检查", 100)],
    }


def build_graph():
    graph = StateGraph(PipelineState)
    graph.add_node("generator", generator_node)
    graph.add_node("quality_monitor", quality_node)
    graph.add_node("acceptance", acceptance_node)
    graph.add_node("supervisor", supervisor_node)
    graph.add_edge(START, "generator")
    graph.add_edge("generator", "quality_monitor")
    graph.add_edge("quality_monitor", "acceptance")
    graph.add_edge("acceptance", "supervisor")
    graph.add_edge("supervisor", END)
    return graph.compile()


def run_pipeline(request: AgentRunRequest) -> AgentRunResponse:
    run_id = str(uuid4())
    initial: PipelineState = {
        "run_id": run_id,
        "request": request.model_dump(),
        "events": [_event("控制台", "searching", "正在分配四个智能体任务", 8)],
    }
    result = build_graph().invoke(initial)
    duplicate_report = result["quality_report"].get("duplicate_report") or []
    review_action = "skipped_duplicate" if duplicate_report else "added"
    if not duplicate_report:
        review_store.add_sample(result["sample"])
    return AgentRunResponse(
        run_id=run_id,
        sample=result["sample"],
        quality_report=result["quality_report"],
        acceptance=result["acceptance"],
        audit=result["audit"],
        events=[AgentEvent(**event) for event in result["events"]],
        review_action=review_action,
    )


def run_batch_pipeline(request: BatchRunRequest) -> BatchRunResponse:
    batch_id = str(uuid4())
    responses: list[AgentRunResponse] = []
    length_plan = [
        ("短", request.short_count),
        ("中", request.medium_count),
        ("长", request.long_count),
    ]
    for length_type, count in length_plan:
        for _ in range(count):
            responses.append(
                run_pipeline(
                    AgentRunRequest(
                        user_message=request.user_message,
                        dataset_split=request.dataset_split,
                        length_type=length_type,
                        human_metric_A=request.human_metric_A,
                        human_metric_B=request.human_metric_B,
                        use_llm=request.use_llm,
                        provider=request.provider,
                        model=request.model,
                    )
                )
            )
    skipped = sum(1 for response in responses if response.review_action == "skipped_duplicate")
    added = len(responses) - skipped
    events = [
        AgentEvent(agent="生成 Agent", status="accepted", message=f"批量生成 {len(responses)} 条", progress=35),
        AgentEvent(agent="质量监测 Agent", status="reviewing", message=f"近重复跳过 {skipped} 条", progress=58),
        AgentEvent(agent="验收 Agent", status="accepted", message=f"进入审查队列 {added} 条", progress=78),
        AgentEvent(agent="监督 Agent", status="accepted", message="批量闭环完成", progress=100),
    ]
    return BatchRunResponse(
        batch_id=batch_id,
        requested={"短": request.short_count, "中": request.medium_count, "长": request.long_count},
        generated=len(responses),
        added_to_review=added,
        skipped_duplicates=skipped,
        responses=responses,
        events=events,
    )
