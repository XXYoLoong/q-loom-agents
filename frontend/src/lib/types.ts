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

