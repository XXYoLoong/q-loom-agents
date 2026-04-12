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

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.app.agents.prompt_loader import ROOT
from backend.app.schemas.review import (
    ReviewHistoryEntry,
    ReviewJumpRequest,
    ReviewNavigateRequest,
    ReviewSample,
    ReviewSaveRequest,
    ReviewState,
    ReviewStats,
)


REVIEW_DIR = ROOT / "output" / "review"
REVIEW_FILE = REVIEW_DIR / "review_state.json"
EXAMPLE_FILE = ROOT / "examples" / "sample_record.readable.json"


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def _stats(samples: list[ReviewSample]) -> ReviewStats:
    return ReviewStats(
        total=len(samples),
        pending=sum(1 for sample in samples if sample.decision == "pending"),
        accepted=sum(1 for sample in samples if sample.decision == "accepted"),
        rejected=sum(1 for sample in samples if sample.decision == "rejected"),
        needs_revision=sum(1 for sample in samples if sample.decision == "needs_revision"),
    )


def _seed_samples() -> list[ReviewSample]:
    if not EXAMPLE_FILE.exists():
        return []
    raw = json.loads(EXAMPLE_FILE.read_text(encoding="utf-8"))
    samples: list[ReviewSample] = []
    for index, payload in enumerate(raw):
        sample_id = str(payload.get("sample_id") or f"seed-{index + 1:06d}")
        samples.append(
            ReviewSample(
                sample_id=sample_id,
                payload=payload,
                human_metric_A=str(payload.get("human_metric_A", "")),
                human_metric_B=str(payload.get("human_metric_B", "")),
                updated_at=now_iso(),
                history=[
                    ReviewHistoryEntry(
                        timestamp=now_iso(),
                        action="seed",
                        note="Loaded from readable example data.",
                    )
                ],
            )
        )
    return samples


class ReviewStore:
    def __init__(self, path: Path = REVIEW_FILE) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def load(self) -> ReviewState:
        if not self.path.exists():
            state = ReviewState(
                current_index=0,
                samples=_seed_samples(),
                stats=ReviewStats(total=0, pending=0, accepted=0, rejected=0, needs_revision=0),
                storage_path=str(self.path),
            )
            state.stats = _stats(state.samples)
            self.save_state(state)
            return state

        data = json.loads(self.path.read_text(encoding="utf-8"))
        samples = [ReviewSample.model_validate(item) for item in data.get("samples", [])]
        current_index = int(data.get("current_index", 0))
        if samples:
            current_index = min(max(current_index, 0), len(samples) - 1)
        else:
            current_index = 0
        return ReviewState(
            current_index=current_index,
            samples=samples,
            stats=_stats(samples),
            storage_path=str(self.path),
        )

    def save_state(self, state: ReviewState) -> ReviewState:
        state.stats = _stats(state.samples)
        self.path.write_text(
            json.dumps(state.model_dump(), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return state

    def add_sample(self, payload: dict[str, Any], action: str = "generated") -> ReviewState:
        state = self.load()
        sample_id = str(payload.get("sample_id") or f"sample-{len(state.samples) + 1:06d}")
        existing = next((sample for sample in state.samples if sample.sample_id == sample_id), None)
        if existing:
            existing.payload = payload
            existing.updated_at = now_iso()
            existing.history.append(
                ReviewHistoryEntry(timestamp=now_iso(), action="refresh", note="Sample payload updated.")
            )
            state.current_index = state.samples.index(existing)
        else:
            state.samples.append(
                ReviewSample(
                    sample_id=sample_id,
                    payload=payload,
                    human_metric_A=str(payload.get("human_metric_A", "")),
                    human_metric_B=str(payload.get("human_metric_B", "")),
                    updated_at=now_iso(),
                    history=[
                        ReviewHistoryEntry(
                            timestamp=now_iso(),
                            action=action,
                            note="Sample added to human review queue.",
                        )
                    ],
                )
            )
            state.current_index = len(state.samples) - 1
        return self.save_state(state)

    def save_sample(self, request: ReviewSaveRequest) -> ReviewState:
        state = self.load()
        sample = next((item for item in state.samples if item.sample_id == request.sample_id), None)
        if sample is None:
            payload = request.payload or {"sample_id": request.sample_id}
            state.samples.append(
                ReviewSample(
                    sample_id=request.sample_id,
                    payload=payload,
                    updated_at=now_iso(),
                )
            )
            sample = state.samples[-1]

        if request.payload is not None:
            sample.payload = request.payload
        sample.human_metric_A = request.human_metric_A
        sample.human_metric_B = request.human_metric_B
        sample.reviewer_note = request.reviewer_note
        sample.decision = request.decision
        sample.updated_at = now_iso()
        sample.payload["human_metric_A"] = request.human_metric_A
        sample.payload["human_metric_B"] = request.human_metric_B
        sample.history.append(
            ReviewHistoryEntry(
                timestamp=now_iso(),
                action=request.action,
                note=request.reviewer_note,
            )
        )
        state.current_index = state.samples.index(sample)
        return self.save_state(state)

    def navigate(self, request: ReviewNavigateRequest) -> ReviewState:
        state = self.load()
        if request.autosave:
            state = self.save_sample(request.autosave)
        if not state.samples:
            return state
        delta = -1 if request.direction == "previous" else 1
        state.current_index = min(max(state.current_index + delta, 0), len(state.samples) - 1)
        return self.save_state(state)

    def jump(self, request: ReviewJumpRequest) -> ReviewState:
        state = self.load()
        if state.samples:
            state.current_index = min(request.index, len(state.samples) - 1)
        return self.save_state(state)


review_store = ReviewStore()

