# Q-Loom Agents 架构说明

## 后端

后端使用 FastAPI 暴露接口，用 LangGraph 编排四个智能体节点：

```text
generator -> quality_monitor -> acceptance -> supervisor
```

模型调用：

- 默认读取环境变量 `DEEPSEEK_API_KEY`。
- 默认模型为 `deepseek-chat`。
- 默认 DeepSeek OpenAI-compatible base URL 为 `https://api.deepseek.com`。
- 若本地开发暂时没有密钥，`ALLOW_MOCK_LLM=true` 时使用内置回退样本，保证控制台可演示。

接口：

- `GET /api/health`
- `GET /api/status`
- `POST /api/run`

## 前端

前端使用 Vite、React 和 Three.js。

视觉设定：

- 氛围：精致 Q 版数据工作坊，带浅青灰墙面、地板、灯具、桌椅和电脑。
- 场地：全屏 3D 房间，四个智能体分别坐在工作台前。
- 动画：敲键盘、放大镜巡查、文件翻阅比对、监督鞭挥舞、状态大屏刷新。

四个智能体任务：

- 生成 Agent：坐在电脑前敲代码，生成江徽音人格样本。
- 质量监测 Agent：拿着放大镜巡查字段、长度、情绪与上下文。
- 验收 Agent：拿着一份份文件阅读比对，执行 accept/reject。
- 监督 Agent：拿着监督鞭，时不时挥舞并检查前三个智能体的闭环逻辑。

交互：

- 鼠标悬浮在小人上会显示该智能体正在做什么。
- 点击任意小人可启动一次多智能体闭环。
- 背景墙上有一块巨大的 3D 大屏，实时显示系统状态。
- 点击大屏会打开全屏状态面板，查看事件、进度和本轮输出。

说明：

- 当前版本不直接下载网上 3D 小人资产，避免版权不明资源进入仓库。
- 采用原创 Three.js 几何建模，模仿常见 Q 版比例：大头、短身体、圆润轮廓、小道具。

## 本地运行

安装前端依赖：

```powershell
npm install
```

运行后端：

```powershell
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

运行前端：

```powershell
npm run dev
```

访问：

```text
http://127.0.0.1:5173
```
