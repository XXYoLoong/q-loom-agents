# v0.6.1

## 目标

- 将 Claude 默认模型更新为 Anthropic 当前文档中的 Sonnet API ID。

## 变更记录

- 默认 `ANTHROPIC_MODEL` 从 `claude-sonnet-4-20250514` 更新为 `claude-sonnet-4-6`。
- README 同步新的 Claude 默认模型。
- Python 与前端项目版本更新为 `0.6.1`。

## 验证记录

- `python -m compileall backend` 通过。
- `npm run build` 通过，前端版本 `0.6.1` 可生产构建。
- `git diff --check` 通过。
- 服务重启通过：`scripts/stop-all.ps1` 与 `scripts/start-all.ps1 -NoOpen` 正常运行。
- `/api/llm/status` 显示 Claude 默认模型为 `claude-sonnet-4-6`。
- 后端健康检查通过：`provider=deepseek`，`model=deepseek-chat`，`mock_allowed=false`。
- 前端健康检查通过：HTTP 200。
- GitHub 推送完成：`bdb182c`，仓库 `https://github.com/XXYoLoong/q-loom-agents`。
