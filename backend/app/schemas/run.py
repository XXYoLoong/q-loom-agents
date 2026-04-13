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

from pydantic import BaseModel, Field, field_validator, model_validator


class AgentEvent(BaseModel):
    agent: str
    status: Literal["idle", "searching", "running", "reviewing", "accepted", "rejected", "blocked"]
    message: str
    progress: int = Field(ge=0, le=100)


class AgentRunRequest(BaseModel):
    user_message: str = ""
    dataset_split: Literal["train", "test"] = "train"
    length_type: str = "中"
    human_metric_A: str = ""
    human_metric_B: str = ""
    use_llm: bool = True
    provider: Literal["deepseek", "qwen", "claude"] = "deepseek"

    @field_validator("length_type")
    @classmethod
    def normalize_length_type(cls, value: str) -> str:
        aliases = {
            "short": "短",
            "medium": "中",
            "long": "长",
            "s": "短",
            "m": "中",
            "l": "长",
            "短": "短",
            "中": "中",
            "长": "长",
        }
        return aliases.get(value, "中")


class AgentRunResponse(BaseModel):
    run_id: str
    sample: dict[str, Any]
    quality_report: dict[str, Any]
    acceptance: dict[str, Any]
    audit: dict[str, Any]
    events: list[AgentEvent]
    review_action: Literal["added", "skipped_duplicate"] = "added"


class BatchRunRequest(BaseModel):
    user_message: str = ""
    dataset_split: Literal["train", "test"] = "train"
    short_count: int = Field(default=0, ge=0, le=200)
    medium_count: int = Field(default=1, ge=0, le=200)
    long_count: int = Field(default=0, ge=0, le=200)
    human_metric_A: str = ""
    human_metric_B: str = ""
    use_llm: bool = True
    provider: Literal["deepseek", "qwen", "claude"] = "deepseek"

    @model_validator(mode="after")
    def require_at_least_one_sample(self) -> "BatchRunRequest":
        if self.short_count + self.medium_count + self.long_count <= 0:
            raise ValueError("At least one sample count must be greater than 0.")
        return self


class BatchRunResponse(BaseModel):
    batch_id: str
    requested: dict[str, int]
    generated: int
    added_to_review: int
    skipped_duplicates: int
    responses: list[AgentRunResponse]
    events: list[AgentEvent]
