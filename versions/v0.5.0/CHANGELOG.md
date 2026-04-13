# v0.5.0

## 目标

- 修复人工审查导航语义：上一条/下一条不再把未修改样本误判为待修改。
- 清理本地 v0.4.0 验证阶段留下的 `????` 和测试审查值。
- 增加短/中/长样本数量手动输入，支持一次批量生成。
- 保持用户输入由生成 Agent 自动模拟，不要求人工手动填写场景。
- 增加 DeepSeek/Qwen 模型选择，并记录真实 LLM 调用审计日志。
- 增强质量监测 Agent：检查近重复样本，重复样本不进入人工审查队列。

## 变更记录

- 后端默认关闭 mock LLM；只有显式设置 `ALLOW_MOCK_LLM=true` 才允许 fallback。
- 新增 Qwen 兼容调用，默认读取 `QWEN_API_KEY` 或 `DASHSCOPE_API_KEY`。
- 新增 `/api/llm/status` 和 `/api/llm/calls`，调用记录写入 `output/llm_calls/*.jsonl`。
- 新增 `/api/run-batch`，按短/中/长数量逐条调用 LangGraph 闭环。
- 质量监测阶段新增 deterministic 近重复检测，检测到重复时最高分限制为 68，并跳过写入审查队列。
- 人工审查切换上一条/下一条时只在内容真的变更后 autosave；未修改时只切换，不改变决策状态。
- `返回修改` 仍然是显式动作，只有点击该按钮才会写入 `needs_revision`。
- 前端新增生成设置面板：模型、用户输入、短/中/长数量、数据集划分。
- 前端不提供手动用户输入字段；只设置模型、短/中/长数量和数据集划分。
- 大屏新增模型调用记录区，便于确认 DeepSeek/Qwen 是否真实调用。

## 验证记录

- `python -m compileall backend` 通过。
- `npm run build` 通过，前端版本 `0.5.0` 可生产构建。
- `git diff --check` 通过。
- 后端健康检查通过：`provider=deepseek`，`model=deepseek-chat`，`mock_allowed=false`。
- `/api/llm/status` 显示 DeepSeek 和 Qwen 均已配置。
- DeepSeek 真实调用验证通过：`/api/run-batch` 生成 1 条短样本，`output/llm_calls/20260413.jsonl` 记录 `generator`、`quality_monitor`、`acceptance`、`supervisor` 四条 `success`。
- Qwen 真实调用验证通过：`qwen_probe` 返回合法 JSON，并记录 `qwen/qwen-plus` 的 `success`。
- 本地审查状态修复通过：`????`、`manual-A-v040-final`、`standard-B-v040-final`、`note-v040-final` 等测试污染值已从当前 review state 清除。
- 重复检测验证通过：控制重复请求返回 `review_action=skipped_duplicate`、重复数 `2`、验收决策 `reject`。
- Playwright 验证通过：生成设置面板无手动用户输入文本框，只有 3 个数量输入和 2 个选择框；未修改审查项时上一条/下一条不改变决策、不追加历史。
- 待执行：GitHub 推送。
