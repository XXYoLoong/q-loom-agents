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
import { navigateReview, saveReview } from "../lib/api";
import type { ReviewDecision, ReviewSample, ReviewSavePayload, ReviewState } from "../lib/types";

interface ReviewDeskProps {
  state: ReviewState | null;
  onStateChange: (state: ReviewState) => void;
}

function currentSample(state: ReviewState | null): ReviewSample | null {
  if (!state || state.samples.length === 0) {
    return null;
  }
  return state.samples[state.current_index] ?? null;
}

export function ReviewDesk({ state, onStateChange }: ReviewDeskProps) {
  const sample = currentSample(state);
  const [humanMetricA, setHumanMetricA] = useState("");
  const [humanMetricB, setHumanMetricB] = useState("");
  const [reviewerNote, setReviewerNote] = useState("");
  const [decision, setDecision] = useState<ReviewDecision>("pending");
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    setHumanMetricA(sample?.human_metric_A ?? "");
    setHumanMetricB(sample?.human_metric_B ?? "");
    setReviewerNote(sample?.reviewer_note ?? "");
    setDecision(sample?.decision ?? "pending");
  }, [sample?.sample_id]);

  const savePayload = useMemo<ReviewSavePayload | null>(() => {
    if (!sample) {
      return null;
    }
    return {
      sample_id: sample.sample_id,
      human_metric_A: humanMetricA,
      human_metric_B: humanMetricB,
      reviewer_note: reviewerNote,
      decision,
      payload: sample.payload,
      action: "human_review_save",
    };
  }, [decision, humanMetricA, humanMetricB, reviewerNote, sample]);

  const hasUnsavedChanges = Boolean(
    sample &&
      (humanMetricA !== sample.human_metric_A ||
        humanMetricB !== sample.human_metric_B ||
        reviewerNote !== sample.reviewer_note ||
        decision !== sample.decision),
  );

  async function handleSave(action = "human_review_save") {
    if (!savePayload) {
      return;
    }
    const nextDecision = action === "return_to_revision" ? "needs_revision" : decision;
    const nextState = await saveReview({ ...savePayload, action, decision: nextDecision });
    setDecision(nextDecision);
    setSavedAt(new Date().toLocaleTimeString());
    onStateChange(nextState);
  }

  async function handleNavigate(direction: "previous" | "next") {
    if (!sample) {
      return;
    }
    const nextState = await navigateReview(
      direction,
      hasUnsavedChanges && savePayload
        ? {
            ...savePayload,
            action: direction === "next" ? "autosave_next" : "autosave_previous",
          }
        : undefined,
    );
    setSavedAt(hasUnsavedChanges ? new Date().toLocaleTimeString() : "未修改，仅切换");
    onStateChange(nextState);
  }

  if (!state || !sample) {
    return (
      <section className="reviewDesk">
        <h2>人工审查</h2>
        <p>审查队列为空。点击 3D 小人运行一次闭环后，样本会自动进入这里。</p>
      </section>
    );
  }

  return (
    <section className="reviewDesk">
      <div className="reviewHeader">
        <div>
          <h2>人工审查</h2>
          <p>
            第 {state.current_index + 1} / {state.samples.length} 条 · 记录：
            {state.stats.pending} 待审，{state.stats.accepted} 通过，
            {state.stats.needs_revision} 待修改，{state.stats.rejected} 拒绝
          </p>
        </div>
        <span>{savedAt ? `已处理 ${savedAt}` : "只有修改后才会在上一条/下一条前保存"}</span>
      </div>

      <div className="sampleColumns">
        <article>
          <strong>{sample.sample_id}</strong>
          <pre>{JSON.stringify(sample.payload, null, 2)}</pre>
        </article>
        <form>
          <label>
            人工指标 A
            <textarea
              value={humanMetricA}
              onChange={(event) => setHumanMetricA(event.target.value)}
              placeholder="填入原始人工指导意见；为空则按当前规则正常生成。"
            />
          </label>
          <label>
            标准化指标 B
            <textarea
              value={humanMetricB}
              onChange={(event) => setHumanMetricB(event.target.value)}
              placeholder="把 A 改写成可执行、可检查、可复用的标准化要求。"
            />
          </label>
          <label>
            审查备注
            <textarea
              value={reviewerNote}
              onChange={(event) => setReviewerNote(event.target.value)}
              placeholder="记录为什么通过、退回或需要修改。"
            />
          </label>
          <label>
            审查决策
            <select value={decision} onChange={(event) => setDecision(event.target.value as ReviewDecision)}>
              <option value="pending">待审</option>
              <option value="accepted">通过</option>
              <option value="needs_revision">返回修改</option>
              <option value="rejected">拒绝</option>
            </select>
          </label>
        </form>
      </div>

      <div className="reviewActions">
        <button type="button" onClick={() => handleNavigate("previous")} disabled={state.current_index === 0}>
          上一条
        </button>
        <button type="button" onClick={() => handleSave("manual_save")}>
          保存
        </button>
        <button type="button" onClick={() => handleSave("return_to_revision")}>
          返回修改
        </button>
        <button
          type="button"
          onClick={() => handleNavigate("next")}
          disabled={state.current_index >= state.samples.length - 1}
        >
          保存并下一条
        </button>
      </div>

      <div className="reviewHistory">
        <strong>修改记录</strong>
        {sample.history.slice(-6).map((entry) => (
          <p key={`${entry.timestamp}-${entry.action}`}>
            {entry.timestamp} · {entry.action} · {entry.note || "无备注"}
          </p>
        ))}
      </div>
    </section>
  );
}
