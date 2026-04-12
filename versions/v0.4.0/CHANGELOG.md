# v0.4.0

## 目标

- 修复“点击后一步到验收”的问题，前端必须逐步展示生成、质检、验收、监督四个阶段。
- 增加人工审查工作台：逐条输出样本、填写人工意见、保存、下一条、上一条、返回修改。
- 审查记录必须持久化到磁盘，关闭电脑或重启服务后可以继续审查。
- `/api/run` 生成的新样本自动进入审查队列，供人工继续校对。

## 变更记录

- 后端新增持久化审查队列，状态保存到 `output/review/review_state.json`。
- `/api/run` 生成的新样本会自动进入人工审查队列。
- 新增 `/api/review`、`/api/review/save`、`/api/review/navigate`、`/api/review/jump`。
- 前端运行闭环时按生成、质检、验收、监督逐步播放状态，不再一步跳到验收。
- 3D 房间新增流程灯带和阶段节点，运行时对应节点与 Agent 会高亮。
- 背景墙大屏全屏面板新增人工审查台：当前样本、A/B 指标、备注、决策、保存、上一条、返回修改、保存并下一条、历史记录。
- 人工审查状态从后端持久化文件恢复，支持关闭电脑后继续审查。

## 验证记录

- `npm run build` 通过，前端生产构建成功。
- `python -m compileall backend` 通过，后端模块可编译。
- `git diff --check` 通过，无空白差异问题。
- 后端健康检查通过：`{"status":"ok","model":"deepseek-chat"}`。
- 前端健康检查通过：`http://127.0.0.1:5173` 返回 HTTP 200。
- HTTP 持久化冒烟测试通过：人工指标、备注、决策写入 `output/review/review_state.json` 后可重新读取。
- Playwright 浏览器验证通过：运行中可见 `running/reviewing` 中间阶段，人工审查台可填写 A/B/备注，点击返回修改会保存为 `needs_revision`，刷新后仍可恢复。
- 截图留档：`output/playwright/q-loom-v0.4.0-before.png`、`output/playwright/q-loom-v0.4.0-review-flow.png`。
- 待执行：GitHub 推送。
