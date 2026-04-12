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

from typing import Any, Literal

from pydantic import BaseModel, Field


ReviewDecision = Literal["pending", "accepted", "rejected", "needs_revision"]


class ReviewHistoryEntry(BaseModel):
    timestamp: str
    action: str
    note: str = ""


class ReviewSample(BaseModel):
    sample_id: str
    payload: dict[str, Any]
    human_metric_A: str = ""
    human_metric_B: str = ""
    reviewer_note: str = ""
    decision: ReviewDecision = "pending"
    updated_at: str
    history: list[ReviewHistoryEntry] = Field(default_factory=list)


class ReviewStats(BaseModel):
    total: int
    pending: int
    accepted: int
    rejected: int
    needs_revision: int


class ReviewState(BaseModel):
    current_index: int = 0
    samples: list[ReviewSample] = Field(default_factory=list)
    stats: ReviewStats
    storage_path: str


class ReviewSaveRequest(BaseModel):
    sample_id: str
    human_metric_A: str = ""
    human_metric_B: str = ""
    reviewer_note: str = ""
    decision: ReviewDecision = "pending"
    payload: dict[str, Any] | None = None
    action: str = "save"


class ReviewNavigateRequest(BaseModel):
    direction: Literal["previous", "next"]
    autosave: ReviewSaveRequest | None = None


class ReviewJumpRequest(BaseModel):
    index: int = Field(ge=0)

