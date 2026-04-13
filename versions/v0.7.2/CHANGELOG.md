# v0.7.2

## 目标

- 修复 Claude 模型列表接口失败时前端只显示 1 个 fallback 模型的问题。
- 暴露 Anthropic `/v1/models` 的 HTTP 错误详情，便于判断是权限、请求头、账号还是接口限制。

## 变更记录

- Claude fallback 模型列表扩展为当前/常用 Claude 模型候选，不再只有 `claude-sonnet-4-6`。
- Anthropic 模型列表 HTTPError 现在记录 `HTTP status + body` 摘要。
- Python 与前端项目版本更新为 `0.7.2`。

## 验证记录

- `python -m compileall backend` 通过。
- `npm run build` 通过，前端版本 `0.7.2` 可生产构建。
- `git diff --check` 通过。
- 服务重启通过，后端健康检查通过。
- `/api/llm/status` 显示 Claude fallback 模型数量为 13。
- Anthropic `/v1/models` 返回 `HTTP 401 invalid x-api-key`，错误详情已透出到 `models_error`。
- Playwright 验证通过：Claude 模型下拉显示 13 项，包含 `claude-opus-4-6` 与 `claude-sonnet-4-6`。
- GitHub 推送完成：`6a024b6`，仓库 `https://github.com/XXYoLoong/q-loom-agents`。
