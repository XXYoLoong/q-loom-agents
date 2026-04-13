# v0.7.4 - 模型状态稳定性修复（仅 Claude 走 NewAPI）

日期：2026-04-13

## 修改内容

- 保持约束不变：`DeepSeek` 与 `Qwen` 继续走各自原生接口，不走 NewAPI 中转；NewAPI 仅用于 `Claude`。
- 后端 `/api/llm/status` 新增 `refresh` 参数，支持前端强制刷新模型列表缓存。
- Claude 状态新增 `setup_hint`：当检测到非 Anthropic 官方 key 且未配置中转基址时，直接给出 `NEWAPI_BASE_URL` 配置提示。
- 前端模型状态读取增加重试机制（最多 4 次，渐进等待），避免后端晚启动导致首次失败后一直卡死。
- 前端新增“刷新模型状态”按钮，可在不重启页面的情况下手动重拉 provider/model 状态。

## 验证结果

- `python -m compileall backend`：通过。
- `npm run build`：通过。
- `git diff --check`：通过。
- 重启一键脚本后，`/api/health` 返回 `status=ok`。
- `/api/llm/status?refresh=true` 返回 `claude.setup_hint` 与明确错误原因（`invalid x-api-key`），用于指向中转基址配置缺失。
