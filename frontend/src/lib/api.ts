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

import type {
  AgentEvent,
  AgentRunResponse,
  BatchRunResponse,
  LlmCallRecord,
  LlmStatus,
  ReviewSavePayload,
  ReviewState,
  RunSettings,
} from "./types";

export async function fetchStatus(): Promise<AgentEvent[]> {
  const response = await fetch("/api/status");
  if (!response.ok) {
    throw new Error("无法读取智能体状态。");
  }
  return response.json();
}

export async function runAgents(settings?: Partial<RunSettings>): Promise<AgentRunResponse> {
  const response = await fetch("/api/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_message: settings?.user_message ?? "",
      dataset_split: settings?.dataset_split ?? "train",
      length_type:
        (settings?.short_count ?? 0) > 0 ? "短" : (settings?.long_count ?? 0) > 0 ? "长" : "中",
      human_metric_A: settings?.human_metric_A ?? "",
      human_metric_B: settings?.human_metric_B ?? "",
      use_llm: settings?.use_llm ?? true,
      provider: settings?.provider ?? "deepseek",
      model: settings?.model || undefined,
    }),
  });
  if (!response.ok) {
    throw new Error("多智能体运行失败。");
  }
  return response.json();
}

export async function runBatch(settings: RunSettings): Promise<BatchRunResponse> {
  const response = await fetch("/api/run-batch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    throw new Error("批量生成失败。");
  }
  return response.json();
}

export async function fetchLlmStatus(refresh = false): Promise<LlmStatus> {
  const query = refresh ? "?refresh=true" : "";
  const response = await fetch(`/api/llm/status${query}`);
  if (!response.ok) {
    throw new Error("无法读取模型设置。");
  }
  return response.json();
}

export async function fetchLlmCalls(): Promise<LlmCallRecord[]> {
  const response = await fetch("/api/llm/calls?limit=12");
  if (!response.ok) {
    throw new Error("无法读取模型调用记录。");
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
