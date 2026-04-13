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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.agents.llm import provider_models, provider_status, read_call_log_tail
from backend.app.core.config import settings
from backend.app.graph import run_batch_pipeline, run_pipeline
from backend.app.schemas.review import (
    ReviewJumpRequest,
    ReviewNavigateRequest,
    ReviewSaveRequest,
    ReviewState,
)
from backend.app.schemas.run import (
    AgentEvent,
    AgentRunRequest,
    AgentRunResponse,
    BatchRunRequest,
    BatchRunResponse,
)
from backend.app.services.review_store import review_store


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str | bool]:
    status_info = provider_status()
    selected = status_info["selected_provider"]
    model = status_info["providers"][selected]["model"]
    return {
        "status": "ok",
        "provider": selected,
        "model": model,
        "mock_allowed": status_info["allow_mock_llm"],
    }


@app.get("/api/status")
def status() -> list[AgentEvent]:
    return [
        AgentEvent(agent="生成 Agent", status="idle", message="等待生成样本", progress=0),
        AgentEvent(agent="质量监测 Agent", status="idle", message="等待质量检查", progress=0),
        AgentEvent(agent="验收 Agent", status="idle", message="等待验收决策", progress=0),
        AgentEvent(agent="监督 Agent", status="idle", message="等待闭环审计", progress=0),
    ]


@app.post("/api/run", response_model=AgentRunResponse)
def run(request: AgentRunRequest) -> AgentRunResponse:
    return run_pipeline(request)


@app.post("/api/run-batch", response_model=BatchRunResponse)
def run_batch(request: BatchRunRequest) -> BatchRunResponse:
    return run_batch_pipeline(request)


@app.get("/api/llm/status")
def llm_status() -> dict:
    return provider_status()


@app.get("/api/llm/models/{provider}")
def llm_models(provider: str, refresh: bool = False) -> dict:
    return provider_models(provider, force_refresh=refresh)


@app.get("/api/llm/calls")
def llm_calls(limit: int = 50) -> list[dict]:
    return read_call_log_tail(limit=max(1, min(limit, 200)))


@app.get("/api/review", response_model=ReviewState)
def get_review_state() -> ReviewState:
    return review_store.load()


@app.post("/api/review/save", response_model=ReviewState)
def save_review_sample(request: ReviewSaveRequest) -> ReviewState:
    return review_store.save_sample(request)


@app.post("/api/review/navigate", response_model=ReviewState)
def navigate_review(request: ReviewNavigateRequest) -> ReviewState:
    return review_store.navigate(request)


@app.post("/api/review/jump", response_model=ReviewState)
def jump_review(request: ReviewJumpRequest) -> ReviewState:
    return review_store.jump(request)
