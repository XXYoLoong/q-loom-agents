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

import { useEffect, useMemo, useState } from "react";
import { AgentConsole } from "./components/AgentConsole";
import { fetchStatus, runAgents } from "./lib/api";
import type { AgentEvent, AgentRunResponse } from "./lib/types";

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

  useEffect(() => {
    fetchStatus()
      .then(setEvents)
      .catch(() => setEvents(fallbackEvents));
  }, []);

  const accepted = useMemo(() => {
    return result?.acceptance.acceptance_decision === "accept";
  }, [result]);

  async function handleRun() {
    setBusy(true);
    setError("");
    setEvents([
      { agent: "生成 Agent", status: "searching", message: "寻找 Q 版小人灵感与样本语气", progress: 10 },
      { agent: "质量监测 Agent", status: "idle", message: "等待候选样本", progress: 0 },
      { agent: "验收 Agent", status: "idle", message: "等待质检结果", progress: 0 },
      { agent: "监督 Agent", status: "idle", message: "等待闭环材料", progress: 0 },
    ]);
    try {
      const response = await runAgents();
      setResult(response);
      setEvents(response.events.filter((event) => event.agent !== "控制台"));
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "运行失败。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="workspace">
        <div className="copy">
          <p className="eyebrow">Q-Loom Agents</p>
          <h1>人格样本闭环控制台</h1>
          <p className="lede">四个 Q 版智能体正在生成、质检、验收和监督江徽音人格数据。</p>
          <div className="actions">
            <button onClick={handleRun} disabled={busy}>
              {busy ? "运行中" : "启动闭环"}
            </button>
            <span>{accepted ? "本轮已通过" : "等待本轮结论"}</span>
          </div>
        </div>
        <AgentConsole events={events} />
      </section>

      <section className="statusGrid">
        {events.map((event) => (
          <article key={event.agent} className="statusItem">
            <div>
              <strong>{event.agent}</strong>
              <p>{event.message}</p>
            </div>
            <meter min={0} max={100} value={event.progress} />
          </article>
        ))}
      </section>

      <section className="resultPanel">
        <div>
          <h2>本轮输出</h2>
          <p>{error || "样本、评分、验收与监督结果会在这里同步。"}</p>
        </div>
        <pre>{result ? JSON.stringify(result, null, 2) : "尚未运行"}</pre>
      </section>
    </main>
  );
}

