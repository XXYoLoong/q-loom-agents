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

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Runtime settings read from environment variables."""

    app_name: str = "Q-Loom Agents"
    llm_provider: str = os.getenv("LLM_PROVIDER", "deepseek").lower()
    deepseek_api_key: str | None = os.getenv("DEEPSEEK_API_KEY")
    deepseek_model: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    deepseek_base_url: str = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    qwen_api_key: str | None = os.getenv("QWEN_API_KEY") or os.getenv("DASHSCOPE_API_KEY")
    qwen_model: str = os.getenv("QWEN_MODEL", "qwen-plus")
    qwen_base_url: str = os.getenv(
        "QWEN_BASE_URL",
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
    )
    anthropic_api_key: str | None = os.getenv("ANTHROPIC_API_KEY")
    anthropic_model: str = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
    anthropic_base_url: str | None = os.getenv("ANTHROPIC_BASE_URL")
    allow_mock_llm: bool = os.getenv("ALLOW_MOCK_LLM", "false").lower() == "true"


settings = Settings()
