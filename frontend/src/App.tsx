// Copyright 2026 Jiacheng Ni
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useEffect, useState } from "react";
import { ReviewDesk } from "./components/ReviewDesk";
import { WorkshopConsole } from "./components/WorkshopConsole";
import { fetchLlmCalls, fetchLlmStatus, fetchReviewState, fetchStatus, runBatch } from "./lib/api";
import type {
  AgentEvent,
  AgentRunResponse,
  BatchRunResponse,
  LlmCallRecord,
  LlmStatus,
  ReviewState,
  RunSettings,
} from "./lib/types";

const fallbackEvents: AgentEvent[] = [
  { agent: "生成 Agent", status: "idle", message: "等待生成样本", progress: 0 },
  { agent: "质量监测 Agent", status: "idle", message: "等待质量检查", progress: 0 },
  { agent: "验收 Agent", status: "idle", message: "等待验收决策", progress: 0 },
  { agent: "监督 Agent", status: "idle", message: "等待闭环审计", progress: 0 },
];

const defaultSettings: RunSettings = {
  user_message: "",
  dataset_split: "train",
  short_count: 0,
  medium_count: 1,
  long_count: 0,
  human_metric_A: "",
  human_metric_B: "",
  use_llm: true,
  provider: "deepseek",
  model: "deepseek-chat",
};

export function App() {
  const [events, setEvents] = useState<AgentEvent[]>(fallbackEvents);
  const [result, setResult] = useState<AgentRunResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [screenOpen, setScreenOpen] = useState(false);
  const [reviewState, setReviewState] = useState<ReviewState | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [settings, setSettings] = useState<RunSettings>(defaultSettings);
  const [batchResult, setBatchResult] = useState<BatchRunResponse | null>(null);
  const [llmStatus, setLlmStatus] = useState<LlmStatus | null>(null);
  const [llmCalls, setLlmCalls] = useState<LlmCallRecord[]>([]);

  useEffect(() => {
    fetchStatus()
      .then(setEvents)
      .catch(() => setEvents(fallbackEvents));
    fetchReviewState()
      .then(setReviewState)
      .catch(() => undefined);
    fetchLlmStatus()
      .then((status) => {
        setLlmStatus(status);
        const provider = status.selected_provider;
        const model = status.providers[provider].models[0] ?? status.providers[provider].model;
        setSettings((previous) => ({ ...previous, provider, model }));
      })
      .catch(() => undefined);
    fetchLlmCalls()
      .then(setLlmCalls)
      .catch(() => undefined);
  }, []);

  async function handleRun() {
    const total = settings.short_count + settings.medium_count + settings.long_count;
    if (total <= 0) {
      setError("请至少设置 1 条短/中/长样本数量。");
      return;
    }
    setBusy(true);
    setError("");
    setStageIndex(0);
    const stagedEvents: AgentEvent[] = [
      { agent: "生成 Agent", status: "running", message: "正在生成候选样本与上下文记忆", progress: 25 },
      { agent: "质量监测 Agent", status: "reviewing", message: "正在检查长度、字段、情绪和上下文一致性", progress: 45 },
      { agent: "验收 Agent", status: "reviewing", message: "正在整合质检报告并给出 accept/reject", progress: 68 },
      { agent: "监督 Agent", status: "reviewing", message: "正在审计前三个智能体并生成纠偏指令", progress: 88 },
    ];
    stagedEvents.forEach((event, index) => {
      window.setTimeout(() => {
        setStageIndex(index + 1);
        setEvents((previous) =>
          previous.map((item) => (item.agent === event.agent ? event : item)),
        );
      }, index * 900);
    });
    try {
      const response = await runBatch(settings);
      setBatchResult(response);
      setResult(response.responses.at(-1) ?? null);
      window.setTimeout(() => {
        setStageIndex(5);
        setEvents(response.events.filter((event) => event.agent !== "控制台"));
      }, stagedEvents.length * 900);
      setReviewState(await fetchReviewState());
      setLlmCalls(await fetchLlmCalls());
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "运行失败。");
    } finally {
      window.setTimeout(() => setBusy(false), stagedEvents.length * 900 + 250);
    }
  }

  function updateSetting<Key extends keyof RunSettings>(key: Key, value: RunSettings[Key]) {
    setSettings((previous) => ({ ...previous, [key]: value }));
  }

  function updateProvider(provider: RunSettings["provider"]) {
    const model = llmStatus?.providers[provider].models[0] ?? llmStatus?.providers[provider].model ?? "";
    setSettings((previous) => ({ ...previous, provider, model }));
  }

  return (
    <main className="workshopShell">
      <WorkshopConsole
        busy={busy}
        events={events}
        result={result}
        stageIndex={stageIndex}
        onRun={handleRun}
        onScreenOpen={() => setScreenOpen(true)}
      />
      <section className="operatorPanel" aria-label="生成设置">
        <strong>生成设置</strong>
        <label>
          模型
          <select
            value={settings.provider}
            onChange={(event) => updateProvider(event.target.value as RunSettings["provider"])}
            disabled={busy}
          >
            <option value="deepseek">
              DeepSeek{llmStatus?.providers.deepseek.configured ? "" : "（未配置）"}
            </option>
            <option value="qwen">Qwen{llmStatus?.providers.qwen.configured ? "" : "（未配置）"}</option>
            <option value="claude">
              Claude{llmStatus?.providers.claude.configured ? "" : "（未配置）"}
            </option>
          </select>
        </label>
        <label>
          模型
          <select
            value={settings.model}
            onChange={(event) => updateSetting("model", event.target.value)}
            disabled={busy}
          >
            {(llmStatus?.providers[settings.provider].models.length
              ? llmStatus.providers[settings.provider].models
              : [llmStatus?.providers[settings.provider].model ?? settings.model]
            ).map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>
        <label>
          场景
          <span>由生成 Agent 自动模拟用户输入和上下文</span>
        </label>
        <div className="countGrid">
          <label>
            短
            <input
              type="number"
              min={0}
              max={200}
              value={settings.short_count}
              onChange={(event) => updateSetting("short_count", Number(event.target.value))}
              disabled={busy}
            />
          </label>
          <label>
            中
            <input
              type="number"
              min={0}
              max={200}
              value={settings.medium_count}
              onChange={(event) => updateSetting("medium_count", Number(event.target.value))}
              disabled={busy}
            />
          </label>
          <label>
            长
            <input
              type="number"
              min={0}
              max={200}
              value={settings.long_count}
              onChange={(event) => updateSetting("long_count", Number(event.target.value))}
              disabled={busy}
            />
          </label>
        </div>
        <label>
          数据集
          <select
            value={settings.dataset_split}
            onChange={(event) => updateSetting("dataset_split", event.target.value as RunSettings["dataset_split"])}
            disabled={busy}
          >
            <option value="train">train</option>
            <option value="test">test</option>
          </select>
        </label>
        <span>
          {llmStatus
            ? `${settings.model} · mock=${llmStatus.allow_mock_llm ? "on" : "off"}${
                llmStatus.providers[settings.provider].models_error
                  ? ` · ${llmStatus.providers[settings.provider].models_error}`
                  : ""
              }`
            : "读取模型状态中"}
        </span>
      </section>
      {error ? <div className="errorDock">{error}</div> : null}
      {screenOpen ? (
        <div className="screenOverlay" role="dialog" aria-modal="true">
          <button className="closeButton" onClick={() => setScreenOpen(false)}>
            关闭
          </button>
          <section>
            <h1>系统大屏</h1>
            <p>四个智能体的运行状态、本轮输出与长期人工审查队列。</p>
            <div className="screenGrid">
              {events.map((event) => (
                <article key={event.agent}>
                  <strong>{event.agent}</strong>
                  <span>{event.status}</span>
                  <p>{event.message}</p>
                  <meter min={0} max={100} value={event.progress} />
                </article>
              ))}
            </div>
            <ReviewDesk state={reviewState} onStateChange={setReviewState} />
            <section className="llmAudit">
              <h2>模型调用记录</h2>
              {llmCalls.length ? (
                llmCalls.map((call) => (
                  <p key={`${call.timestamp}-${call.purpose}-${call.duration_ms}`}>
                    {call.timestamp} · {call.provider}/{call.model} · {call.purpose} · {call.status} ·{" "}
                    {call.duration_ms}ms
                  </p>
                ))
              ) : (
                <p>暂无调用记录。真实调用后会写入 output/llm_calls。</p>
              )}
            </section>
            <pre>
              {batchResult
                ? JSON.stringify(batchResult, null, 2)
                : result
                  ? JSON.stringify(result, null, 2)
                  : "尚未运行。点击小人或启动闭环开始。"}
            </pre>
          </section>
        </div>
      ) : null}
    </main>
  );
}
