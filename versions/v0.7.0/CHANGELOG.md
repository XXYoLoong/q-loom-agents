# v0.7.0

## 目标

- 根据每类公司 API key 拉取当前可调用模型列表。
- 前端支持 provider 与 model 两级选择。
- 每次生成把用户选择的具体模型传给后端，并写入 LLM 调用审计。
- Windows 下支持读取系统/用户环境变量里的 API key，避免只读当前进程环境导致误判未配置。

## 变更记录

- 后端新增 Windows 环境变量解析：优先 Process，其次 User/Machine registry。
- DeepSeek/Qwen 通过 OpenAI-compatible `/models` 拉取模型。
- Claude 通过 Anthropic `/v1/models` 拉取模型。
- `/api/llm/status` 返回每个 provider 的 `models` 与 `models_error`。
- 新增 `/api/llm/models/{provider}?refresh=true` 用于强制刷新模型列表。
- `AgentRunRequest` 与 `BatchRunRequest` 新增 `model` 字段。
- LangGraph 四个 Agent 调用统一使用所选 provider + model。
- 前端生成设置新增模型下拉，切换 provider 时自动选择该 provider 模型列表第一项。
- README 补充各 provider 模型列表来源。

## 验证记录

- `python -m compileall backend` 通过。
- `npm run build` 通过，前端版本 `0.7.0` 可生产构建。
- `git diff --check` 通过。
- 服务重启通过：`scripts/stop-all.ps1` 与 `scripts/start-all.ps1 -NoOpen` 正常运行。
- 后端健康检查通过：`provider=deepseek`，`model=deepseek-chat`，`mock_allowed=false`。
- `/api/llm/status` 验证通过：DeepSeek 返回 2 个模型，Qwen 返回 222 个模型，Claude 识别到 `key_configured=true`。
- Claude 当前 `package_installed=false`，模型列表请求返回 HTTPError，后端安全回退到默认 `claude-sonnet-4-6`，服务未崩溃。
- Playwright 验证通过：provider 下拉包含 DeepSeek/Qwen/Claude，Qwen 模型下拉超过 10 项，Claude 模型下拉包含 `claude-sonnet-4-6`。
- 待执行：GitHub 推送。
