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
from backend.app.schemas.run import AgentEvent, AgentRunRequest, AgentRunResponse


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


def _standardize_human_metric(request: dict[str, Any]) -> str:
    metric_a = request.get("human_metric_A", "")
    metric_b = request.get("human_metric_B", "")
    if metric_b or not metric_a:
        return metric_b
    return (
        f"将人工意见标准化执行：{metric_a}；要求表达具体、可检查，并在生成、质检、"
        "验收与监督阶段持续遵循。"
    )


def generator_node(state: PipelineState) -> PipelineState:
    request = state["request"]
    metric_b = _standardize_human_metric(request)
    fallback = {
        "sample_id": f"{request['dataset_split']}-{state['run_id'][:8]}",
        "system_message": "你是一位电子女友江徽音，温润端雅、安静细腻、带恋人感，对用户游龙有明显偏爱。",
        "dialogue_context": [
            {"role": "user", "content": "昨晚又加班到很晚。"},
            {"role": "assistant", "content": "我记着呢，今晚别再硬撑，好不好？"},
            {"role": "user", "content": "明早可能还得早起。"},
        ],
        "user_message": request["user_message"],
        "model_response": "（轻轻弯了弯眼）我在这儿陪你。游龙先顾好自己，别让早晨空着胃过去。",
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
        "context_memory": {
            "偏好": ["喜欢早晨喝温水"],
            "作息": ["近期经常早起"],
            "事件": ["昨晚加班到很晚"],
            "关系状态": ["江徽音会主动照顾游龙的日常"],
            "禁忌或边界": [],
            "memory_index": ["M001:早晨温水", "M014:近期加班", "M021:早起提醒"],
        },
        "human_metric_A": request.get("human_metric_A", ""),
        "human_metric_B": metric_b,
        "dataset_split": request["dataset_split"],
    }
    prompt = (
        "请只输出一个合法 JSON 对象，不要 Markdown。按请求生成一条可读格式样本。"
        f"\n请求：{request}"
    )
    sample = invoke_json(
        shared_protocol() + "\n" + load_agent_prompt("01_generator_agent.md"),
        prompt,
        fallback,
    )
    return {
        **state,
        "sample": sample,
        "events": state["events"]
        + [_event("生成 Agent", "running", "已生成候选人格样本", 35)],
    }


def quality_node(state: PipelineState) -> PipelineState:
    sample = state["sample"]
    fallback = {
        "sample_id": sample.get("sample_id", ""),
        "quality_score": 92,
        "error_report": [],
        "monitor_summary": "字段完整，情绪与上下文匹配，A/B 闭环状态可追溯。",
    }
    report = invoke_json(
        shared_protocol() + "\n" + load_agent_prompt("02_quality_monitor_agent.md"),
        f"请只输出质量监测 JSON 对象。样本：{sample}",
        fallback,
    )
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
    )
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
    return AgentRunResponse(
        run_id=run_id,
        sample=result["sample"],
        quality_report=result["quality_report"],
        acceptance=result["acceptance"],
        audit=result["audit"],
        events=[AgentEvent(**event) for event in result["events"]],
    )

