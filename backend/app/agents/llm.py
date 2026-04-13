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
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import error, request

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_deepseek import ChatDeepSeek
from langchain_openai import ChatOpenAI
try:
    from langchain_anthropic import ChatAnthropic
except ModuleNotFoundError:  # pragma: no cover - optional provider dependency
    ChatAnthropic = None  # type: ignore[assignment]

from backend.app.core.config import settings
from backend.app.agents.prompt_loader import ROOT


LLM_LOG_DIR = ROOT / "output" / "llm_calls"
MODEL_CACHE_TTL_SECONDS = 300
MODEL_CACHE: dict[str, tuple[float, list[str], str | None]] = {}
FALLBACK_MODELS = {
    "deepseek": ["deepseek-chat", "deepseek-reasoner"],
    "qwen": ["qwen-plus", "qwen-max", "qwen-turbo", "qwen-long"],
    "claude": ["claude-sonnet-4-6"],
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def _normal_provider(provider: str | None = None) -> str:
    value = (provider or settings.llm_provider or "deepseek").lower()
    aliases = {"anthropic": "claude"}
    value = aliases.get(value, value)
    if value not in {"deepseek", "qwen", "claude"}:
        return "deepseek"
    return value


def build_deepseek_llm(model: str | None = None) -> ChatDeepSeek | None:
    if not settings.deepseek_api_key:
        return None
    return ChatDeepSeek(
        model=model or settings.deepseek_model,
        api_key=settings.deepseek_api_key,
        api_base=settings.deepseek_base_url,
        temperature=0.7,
    )


def build_qwen_llm(model: str | None = None) -> ChatOpenAI | None:
    if not settings.qwen_api_key:
        return None
    return ChatOpenAI(
        model=model or settings.qwen_model,
        api_key=settings.qwen_api_key,
        base_url=settings.qwen_base_url,
        temperature=0.7,
    )


def build_claude_llm(model: str | None = None) -> Any | None:
    if ChatAnthropic is None or not settings.anthropic_api_key:
        return None
    kwargs: dict[str, Any] = {
        "model": model or settings.anthropic_model,
        "anthropic_api_key": settings.anthropic_api_key,
        "temperature": 0.7,
    }
    if settings.anthropic_base_url:
        kwargs["anthropic_api_url"] = settings.anthropic_base_url
    return ChatAnthropic(**kwargs)


def build_llm(provider: str | None = None, model: str | None = None) -> tuple[Any | None, str, str]:
    selected = _normal_provider(provider)
    if selected == "qwen":
        selected_model = model or settings.qwen_model
        return build_qwen_llm(selected_model), "qwen", selected_model
    if selected == "claude":
        selected_model = model or settings.anthropic_model
        return build_claude_llm(selected_model), "claude", selected_model
    selected_model = model or settings.deepseek_model
    return build_deepseek_llm(selected_model), "deepseek", selected_model


def _json_get(url: str, headers: dict[str, str], timeout: int = 12) -> dict[str, Any]:
    req = request.Request(url, headers=headers, method="GET")
    with request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _openai_compatible_model_url(base_url: str) -> str:
    clean = base_url.rstrip("/")
    return f"{clean}/models"


def _anthropic_model_url(base_url: str | None) -> str:
    clean = (base_url or "https://api.anthropic.com").rstrip("/")
    if clean.endswith("/v1"):
        return f"{clean}/models"
    return f"{clean}/v1/models"


def _extract_model_ids(payload: dict[str, Any]) -> list[str]:
    data = payload.get("data", [])
    if not isinstance(data, list):
        return []
    ids = []
    for item in data:
        if isinstance(item, dict) and item.get("id"):
            ids.append(str(item["id"]))
    return sorted(dict.fromkeys(ids))


def _fetch_provider_models(provider: str) -> tuple[list[str], str | None]:
    try:
        if provider == "deepseek":
            if not settings.deepseek_api_key:
                return FALLBACK_MODELS[provider], "DEEPSEEK_API_KEY is not configured."
            payload = _json_get(
                _openai_compatible_model_url(settings.deepseek_base_url),
                {"Authorization": f"Bearer {settings.deepseek_api_key}"},
            )
        elif provider == "qwen":
            if not settings.qwen_api_key:
                return FALLBACK_MODELS[provider], "QWEN_API_KEY/DASHSCOPE_API_KEY is not configured."
            payload = _json_get(
                _openai_compatible_model_url(settings.qwen_base_url),
                {"Authorization": f"Bearer {settings.qwen_api_key}"},
            )
        else:
            if not settings.anthropic_api_key:
                return FALLBACK_MODELS[provider], "ANTHROPIC_API_KEY is not configured."
            payload = _json_get(
                _anthropic_model_url(settings.anthropic_base_url),
                {
                    "x-api-key": settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                },
            )
        models = _extract_model_ids(payload)
        if not models:
            return FALLBACK_MODELS[provider], "Provider returned no model IDs."
        return models, None
    except (OSError, TimeoutError, error.URLError, error.HTTPError, json.JSONDecodeError) as exc:
        return FALLBACK_MODELS[provider], f"{type(exc).__name__}: model list fallback used."


def provider_models(provider: str, *, force_refresh: bool = False) -> dict[str, Any]:
    selected = _normal_provider(provider)
    now = time.time()
    cached = MODEL_CACHE.get(selected)
    if cached and not force_refresh and now - cached[0] < MODEL_CACHE_TTL_SECONDS:
        models, error_message = cached[1], cached[2]
    else:
        models, error_message = _fetch_provider_models(selected)
        MODEL_CACHE[selected] = (now, models, error_message)
    return {"models": models, "models_error": error_message}


def provider_status() -> dict[str, Any]:
    selected = _normal_provider()
    deepseek_models = provider_models("deepseek")
    qwen_models = provider_models("qwen")
    claude_models = provider_models("claude")
    return {
        "selected_provider": selected,
        "allow_mock_llm": settings.allow_mock_llm,
        "providers": {
            "deepseek": {
                "configured": bool(settings.deepseek_api_key),
                "model": settings.deepseek_model,
                "base_url": settings.deepseek_base_url,
                **deepseek_models,
            },
            "qwen": {
                "configured": bool(settings.qwen_api_key),
                "model": settings.qwen_model,
                "base_url": settings.qwen_base_url,
                **qwen_models,
            },
            "claude": {
                "configured": bool(settings.anthropic_api_key) and ChatAnthropic is not None,
                "key_configured": bool(settings.anthropic_api_key),
                "package_installed": ChatAnthropic is not None,
                "model": settings.anthropic_model,
                "base_url": settings.anthropic_base_url or "https://api.anthropic.com",
                **claude_models,
            },
        },
    }


def _write_call_log(record: dict[str, Any]) -> None:
    LLM_LOG_DIR.mkdir(parents=True, exist_ok=True)
    path = LLM_LOG_DIR / f"{datetime.now().strftime('%Y%m%d')}.jsonl"
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")


def read_call_log_tail(limit: int = 50) -> list[dict[str, Any]]:
    if not LLM_LOG_DIR.exists():
        return []
    records: list[dict[str, Any]] = []
    for path in sorted(LLM_LOG_DIR.glob("*.jsonl"), reverse=True):
        lines = path.read_text(encoding="utf-8").splitlines()
        for line in reversed(lines):
            if not line.strip():
                continue
            records.append(json.loads(line))
            if len(records) >= limit:
                return records
    return records


def extract_json_object(text: str) -> dict[str, Any]:
    try:
        value = json.loads(text)
        if isinstance(value, dict):
            return value
    except json.JSONDecodeError:
        pass

    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.DOTALL)
    if fenced:
        return json.loads(fenced.group(1))

    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        return json.loads(text[start : end + 1])
    raise ValueError("No JSON object found in model response.")


def invoke_json(
    system_prompt: str,
    user_prompt: str,
    fallback: dict[str, Any],
    *,
    provider: str | None = None,
    model: str | None = None,
    use_llm: bool = True,
    purpose: str = "agent_json",
) -> dict[str, Any]:
    llm, selected_provider, selected_model = build_llm(provider, model)
    started = time.perf_counter()
    base_record = {
        "timestamp": _now_iso(),
        "provider": selected_provider,
        "model": selected_model,
        "purpose": purpose,
        "system_chars": len(system_prompt),
        "user_chars": len(user_prompt),
    }
    if not use_llm:
        _write_call_log(
            {
                **base_record,
                "status": "mock_fallback",
                "reason": "request_use_llm_false",
                "duration_ms": int((time.perf_counter() - started) * 1000),
            }
        )
        return fallback
    if llm is None:
        if settings.allow_mock_llm:
            _write_call_log(
                {
                    **base_record,
                    "status": "mock_fallback",
                    "reason": "provider_key_missing",
                    "duration_ms": int((time.perf_counter() - started) * 1000),
                }
            )
            return fallback
        raise RuntimeError(
            f"{selected_provider} API key is not configured and ALLOW_MOCK_LLM is false."
        )

    try:
        response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
        content = response.content if isinstance(response.content, str) else json.dumps(response.content)
        parsed = extract_json_object(content)
        _write_call_log(
            {
                **base_record,
                "status": "success",
                "response_chars": len(content),
                "duration_ms": int((time.perf_counter() - started) * 1000),
            }
        )
        return parsed
    except Exception as exc:
        _write_call_log(
            {
                **base_record,
                "status": "error",
                "error_type": type(exc).__name__,
                "duration_ms": int((time.perf_counter() - started) * 1000),
            }
        )
        raise
