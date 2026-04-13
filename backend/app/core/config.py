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
import sys
from dataclasses import dataclass


def _windows_registry_env(name: str) -> str | None:
    if sys.platform != "win32":
        return None
    try:
        import winreg
    except ImportError:
        return None

    locations = [
        (winreg.HKEY_CURRENT_USER, "Environment"),
        (
            winreg.HKEY_LOCAL_MACHINE,
            r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment",
        ),
    ]
    for root, path in locations:
        try:
            with winreg.OpenKey(root, path) as key:
                value, _ = winreg.QueryValueEx(key, name)
                if value:
                    return str(value)
        except OSError:
            continue
    return None


def env_value(name: str, default: str | None = None) -> str | None:
    return os.getenv(name) or _windows_registry_env(name) or default


@dataclass(frozen=True)
class Settings:
    """Runtime settings read from environment variables."""

    app_name: str = "Q-Loom Agents"
    llm_provider: str = str(env_value("LLM_PROVIDER", "deepseek")).lower()
    deepseek_api_key: str | None = env_value("DEEPSEEK_API_KEY")
    deepseek_model: str = str(env_value("DEEPSEEK_MODEL", "deepseek-chat"))
    deepseek_base_url: str = str(env_value("DEEPSEEK_BASE_URL", "https://api.deepseek.com"))
    qwen_api_key: str | None = env_value("QWEN_API_KEY") or env_value("DASHSCOPE_API_KEY")
    qwen_model: str = str(env_value("QWEN_MODEL", "qwen-plus"))
    qwen_base_url: str = str(
        env_value(
            "QWEN_BASE_URL",
            "https://dashscope.aliyuncs.com/compatible-mode/v1",
        )
    )
    newapi_api_key: str | None = env_value("NEWAPI_API_KEY")
    newapi_base_url: str | None = env_value("NEWAPI_BASE_URL")
    anthropic_api_key: str | None = env_value("ANTHROPIC_API_KEY")
    anthropic_model: str = str(env_value("ANTHROPIC_MODEL", "claude-sonnet-4-6"))
    anthropic_base_url: str | None = env_value("ANTHROPIC_BASE_URL") or newapi_base_url
    allow_mock_llm: bool = str(env_value("ALLOW_MOCK_LLM", "false")).lower() == "true"


settings = Settings()
