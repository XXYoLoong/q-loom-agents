# v0.7.3 - NewAPI Claude 中转支持

日期：2026-04-13

## 修改内容

- 根据 NewAPI Apifox 文档修正 Claude 中转调用路径：中转模式使用 `/v1/models` 和 `/v1/messages`，鉴权使用 `Authorization: Bearer`。
- 新增 `NEWAPI_BASE_URL` 和 `NEWAPI_API_KEY` 配置；如果没有单独设置 `NEWAPI_API_KEY`，会复用 `ANTHROPIC_API_KEY` 作为中转 token。
- Claude provider 现在会自动区分官方 Anthropic 直连与 NewAPI 中转：
  - 官方 Anthropic：`x-api-key`。
  - NewAPI 中转：`Authorization: Bearer`。
- `/api/llm/status` 增加 Claude 的 `newapi_configured`、`relay_configured` 和 `auth_mode` 状态，便于判断当前是否真的走中转。
- 更新 README 的模型供应商配置说明，补充 NewAPI 中转配置示例。

## 验证计划

- `python -m compileall backend`：通过。
- `npm run build`：通过。
- `git diff --check`：通过。
- 一键启动脚本重启后端和前端：通过。
- 后端健康检查：`/api/health` 返回 `status=ok`、`provider=deepseek`、`mock_allowed=false`。
- 前端检查：`http://127.0.0.1:5173` 返回 HTTP 200。
- Claude 当前运行态：本机尚未配置 `NEWAPI_BASE_URL` / `ANTHROPIC_BASE_URL`，因此仍显示 `auth_mode=x-api-key`、`newapi_configured=false`。
- NewAPI 路由探针：使用 dummy 环境变量验证 `NEWAPI_BASE_URL` 会切换到 `/v1/models`、`/v1/messages` 和 `Authorization` 鉴权。

## 说明

如果只设置了 `ANTHROPIC_API_KEY`，但没有设置 `NEWAPI_BASE_URL` 或 `ANTHROPIC_BASE_URL` 指向 NewAPI 中转服务，系统会按官方 Anthropic 接口调用，这会继续出现 `invalid x-api-key`。走 NewAPI 时必须给出实际中转服务 base URL，不能使用文档站 `https://apifox.newapi.ai/` 作为 API 地址。
