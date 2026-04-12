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

from backend.app.core.config import settings
from backend.app.graph import run_pipeline
from backend.app.schemas.run import AgentEvent, AgentRunRequest, AgentRunResponse


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model": settings.deepseek_model}


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

