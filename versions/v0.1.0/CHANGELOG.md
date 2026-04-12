# v0.1.0

## 目标

- 建立 LangChain/LangGraph 多智能体人格化数据生成项目。
- 增加可读格式的数据样例，不再使用单行 JSONL 作为人工阅读入口。
- 搭建 Q 版 3D 动画控制台，显示生成、质检、验收、监督四个智能体的运行状态。
- 使用 DeepSeek 环境变量作为默认大模型配置。
- 使用 Apache License 2.0，并在代码文件加入版权头。

## 本版变更

- 新增后端 FastAPI + LangGraph 编排骨架。
- 新增四类智能体节点：generator、quality_monitor、acceptance、supervisor。
- 新增前端 Vite + React + Three.js 控制台。
- 新增版本记录、过程日志和许可证。
- 将样例数据改为缩进 JSON，避免人工评审时每条数据全部挤在一行。
- 新增 3D 控制台架构说明，记录四个智能体的 Q 版造型任务和动画行为。

## 验证记录

- 已通过：`npm install`，无漏洞报告。
- 已通过：`python -m pip install -e .`。
- 已通过：`python -m compileall backend`。
- 已通过：后端 LangGraph mock 烟测，返回 `accept` 和 5 个事件。
- 已通过：`npm run build`。
- 已通过：Playwright 访问本地页面并截图，canvas 采样 `14400/14400` 非空。
- 已通过：后端 `/api/run` HTTP 烟测，返回 `accept` 和 5 个事件。
- 待执行：GitHub 仓库创建与推送。
