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

export type AgentStatus =
  | "idle"
  | "searching"
  | "running"
  | "reviewing"
  | "accepted"
  | "rejected"
  | "blocked";

export interface AgentEvent {
  agent: string;
  status: AgentStatus;
  message: string;
  progress: number;
}

export interface AgentRunResponse {
  run_id: string;
  sample: Record<string, unknown>;
  quality_report: Record<string, unknown>;
  acceptance: Record<string, unknown>;
  audit: Record<string, unknown>;
  events: AgentEvent[];
}

export type ReviewDecision = "pending" | "accepted" | "rejected" | "needs_revision";

export interface ReviewHistoryEntry {
  timestamp: string;
  action: string;
  note: string;
}

export interface ReviewSample {
  sample_id: string;
  payload: Record<string, unknown>;
  human_metric_A: string;
  human_metric_B: string;
  reviewer_note: string;
  decision: ReviewDecision;
  updated_at: string;
  history: ReviewHistoryEntry[];
}

export interface ReviewStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  needs_revision: number;
}

export interface ReviewState {
  current_index: number;
  samples: ReviewSample[];
  stats: ReviewStats;
  storage_path: string;
}

export interface ReviewSavePayload {
  sample_id: string;
  human_metric_A: string;
  human_metric_B: string;
  reviewer_note: string;
  decision: ReviewDecision;
  payload?: Record<string, unknown>;
  action?: string;
}
