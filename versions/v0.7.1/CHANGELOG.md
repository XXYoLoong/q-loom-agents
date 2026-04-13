# v0.7.1

## 目标

- 在当前 Python 环境未安装 `langchain_anthropic` 时，Claude 仍可通过 Anthropic HTTP Messages API 调用。

## 变更记录

- 新增 `_HttpClaudeClient`，直接调用 Anthropic `/v1/messages`。
- `langchain_anthropic` 变为可选增强；缺包时不阻断 Claude 调用。
- `/api/llm/status` 的 Claude 状态新增 `http_fallback`。
- Python 与前端项目版本更新为 `0.7.1`。

## 验证记录

- `python -m compileall backend` 通过。
- `npm run build` 通过，前端版本 `0.7.1` 可生产构建。
- `git diff --check` 通过。
- 服务重启通过，后端健康检查通过。
- `/api/llm/status` 显示 Claude `configured=true`、`key_configured=true`、`package_installed=false`、`http_fallback=true`。
- Claude 模型列表接口仍返回 HTTPError，因此模型列表安全回退到 `claude-sonnet-4-6`。
- 待执行：GitHub 推送。
