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
import { fetchReviewState, fetchStatus, runAgents } from "./lib/api";
import type { AgentEvent, AgentRunResponse, ReviewState } from "./lib/types";

const fallbackEvents: AgentEvent[] = [
  { agent: "生成 Agent", status: "idle", message: "等待生成样本", progress: 0 },
  { agent: "质量监测 Agent", status: "idle", message: "等待质量检查", progress: 0 },
  { agent: "验收 Agent", status: "idle", message: "等待验收决策", progress: 0 },
  { agent: "监督 Agent", status: "idle", message: "等待闭环审计", progress: 0 },
];

export function App() {
  const [events, setEvents] = useState<AgentEvent[]>(fallbackEvents);
  const [result, setResult] = useState<AgentRunResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [screenOpen, setScreenOpen] = useState(false);
  const [reviewState, setReviewState] = useState<ReviewState | null>(null);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    fetchStatus()
      .then(setEvents)
      .catch(() => setEvents(fallbackEvents));
    fetchReviewState()
      .then(setReviewState)
      .catch(() => undefined);
  }, []);

  async function handleRun() {
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
      const response = await runAgents();
      setResult(response);
      window.setTimeout(() => {
        setStageIndex(5);
        setEvents(response.events.filter((event) => event.agent !== "控制台"));
      }, stagedEvents.length * 900);
      setReviewState(await fetchReviewState());
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "运行失败。");
    } finally {
      window.setTimeout(() => setBusy(false), stagedEvents.length * 900 + 250);
    }
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
            <pre>{result ? JSON.stringify(result, null, 2) : "尚未运行。点击小人或启动闭环开始。"}</pre>
          </section>
        </div>
      ) : null}
    </main>
  );
}
