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

import re
from difflib import SequenceMatcher
from typing import Any

from backend.app.schemas.review import ReviewSample


_PUNCTUATION = re.compile(r"[\s，。！？、,.!?~～…（）()\[\]【】《》“”\"'：:；;·\-_/\\]+")
_SOFT_WORDS = (
    "你",
    "我",
    "呀",
    "吗",
    "嘛",
    "呢",
    "吧",
    "啦",
    "了",
    "有没有",
    "有没",
    "是不是",
    "今天",
    "一下",
    "一点",
)


def normalize_text(value: str) -> str:
    text = _PUNCTUATION.sub("", value.lower())
    for word in _SOFT_WORDS:
        text = text.replace(word, "")
    text = text.replace("早饭", "早餐").replace("吃过饭", "吃饭").replace("吃东西", "吃饭")
    return text


def _ngrams(text: str, size: int = 2) -> set[str]:
    if len(text) <= size:
        return {text} if text else set()
    return {text[index : index + size] for index in range(len(text) - size + 1)}


def text_similarity(left: str, right: str) -> float:
    normalized_left = normalize_text(left)
    normalized_right = normalize_text(right)
    if not normalized_left or not normalized_right:
        return 0.0
    if normalized_left in normalized_right or normalized_right in normalized_left:
        return 1.0
    sequence_ratio = SequenceMatcher(None, normalized_left, normalized_right).ratio()
    left_grams = _ngrams(normalized_left)
    right_grams = _ngrams(normalized_right)
    overlap = len(left_grams & right_grams) / max(len(left_grams | right_grams), 1)
    return max(sequence_ratio, overlap)


def sample_signature(payload: dict[str, Any]) -> str:
    context = payload.get("dialogue_context", [])
    context_text = ""
    if isinstance(context, list):
        context_text = " ".join(
            str(item.get("content", "")) for item in context if isinstance(item, dict)
        )
    return " ".join(
        [
            str(payload.get("user_message", "")),
            str(payload.get("model_response", "")),
            context_text,
        ]
    )


def find_duplicate_samples(
    sample: dict[str, Any],
    candidates: list[ReviewSample],
    *,
    threshold: float = 0.66,
) -> list[dict[str, Any]]:
    source = sample_signature(sample)
    matches: list[dict[str, Any]] = []
    for candidate in candidates:
        if candidate.sample_id == sample.get("sample_id"):
            continue
        score = text_similarity(source, sample_signature(candidate.payload))
        if score >= threshold:
            matches.append(
                {
                    "sample_id": candidate.sample_id,
                    "similarity": round(score, 3),
                    "reason": "user/context/response near-duplicate",
                }
            )
    return sorted(matches, key=lambda item: item["similarity"], reverse=True)
