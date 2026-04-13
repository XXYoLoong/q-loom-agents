# v0.6.0

## 目标

- 增加 `ANTHROPIC_API_KEY` 支持。
- 在前端模型选择中加入 Claude。
- Claude 调用沿用现有 LLM 审计链路，写入 `output/llm_calls/*.jsonl`。
- 当当前 Python 环境尚未安装 `langchain_anthropic` 或未设置 Anthropic key 时，服务不能崩溃。

## 变更记录

- 后端新增 Claude provider，provider 值为 `claude`，同时兼容 `anthropic` 别名。
- 默认 Claude 模型为 `claude-sonnet-4-20250514`，可通过 `ANTHROPIC_MODEL` 覆盖。
- 新增 `ANTHROPIC_BASE_URL` 可选覆盖项。
- `/api/llm/status` 新增 `claude` provider 状态，包含 `key_configured` 与 `package_installed`。
- 前端模型下拉新增 Claude，未配置时显示“未配置”。
- 项目依赖新增 `langchain-anthropic`。
- README 新增 Claude 环境变量说明。

## 验证记录

- `python -m compileall backend` 通过。
- `npm run build` 通过，前端版本 `0.6.0` 可生产构建。
- `git diff --check` 通过。
- 服务重启通过：`scripts/stop-all.ps1` 与 `scripts/start-all.ps1 -NoOpen` 正常运行。
- 后端健康检查通过：`provider=deepseek`，`model=deepseek-chat`，`mock_allowed=false`。
- `/api/llm/status` 显示 DeepSeek/Qwen 已配置，Claude 当前 `configured=false`、`key_configured=false`、`package_installed=false`，且服务未崩溃。
- Playwright 验证通过：模型下拉包含 DeepSeek、Qwen、`Claude（未配置）`。
- 待执行：GitHub 推送。
