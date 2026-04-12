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

- 氛围：浅青灰工作台、柔和灯光、Q 版几何小人。
- 场地：圆形数据工坊，四个智能体围绕中心环形平台工作。
- 动画：运行中的智能体会上下浮动、任务道具旋转、光环脉冲。

四个智能体任务：

- 生成 Agent：寻找 Q 版小人灵感与样本语气，手持笔形道具。
- 质量监测 Agent：扫描字段和风格，手持镜片道具。
- 验收 Agent：执行 accept/reject，手持印章道具。
- 监督 Agent：环绕审计闭环，手持光球道具。

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

