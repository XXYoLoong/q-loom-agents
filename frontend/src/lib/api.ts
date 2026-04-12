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

import type { AgentEvent, AgentRunResponse, ReviewSavePayload, ReviewState } from "./types";

export async function fetchStatus(): Promise<AgentEvent[]> {
  const response = await fetch("/api/status");
  if (!response.ok) {
    throw new Error("无法读取智能体状态。");
  }
  return response.json();
}

export async function runAgents(): Promise<AgentRunResponse> {
  const response = await fetch("/api/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_message: "你今天有没有吃早饭呀？",
      dataset_split: "train",
      length_type: "中",
      human_metric_A: "",
      human_metric_B: "",
      use_llm: true,
    }),
  });
  if (!response.ok) {
    throw new Error("多智能体运行失败。");
  }
  return response.json();
}

export async function fetchReviewState(): Promise<ReviewState> {
  const response = await fetch("/api/review");
  if (!response.ok) {
    throw new Error("无法读取人工审查记录。");
  }
  return response.json();
}

export async function saveReview(payload: ReviewSavePayload): Promise<ReviewState> {
  const response = await fetch("/api/review/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("保存人工审查失败。");
  }
  return response.json();
}

export async function navigateReview(
  direction: "previous" | "next",
  autosave?: ReviewSavePayload,
): Promise<ReviewState> {
  const response = await fetch("/api/review/navigate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ direction, autosave }),
  });
  if (!response.ok) {
    throw new Error("切换审查样本失败。");
  }
  return response.json();
}
