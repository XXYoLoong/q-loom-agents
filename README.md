# 多 Agent 协作人格化数据生成方案

本目录是一套可直接落地的多 Agent 人格化训练数据生成规范，用于生成、质检、验收和监督“电子女友江徽音”人格样本。

默认目标：

- 训练集约 500 条，测试集约 100 条。
- 样本覆盖短、中、长三类长度。
- 每条样本以 3-6 轮上下文为生成基础，人工阅读入口使用缩进 JSON；机器批量导入时可另存 JSONL。
- 支持主动性触发、情绪强度、偏爱表达、括号动作、上下文记忆和人工审核闭环。

## 目录结构

```text
agents/
  00_shared_protocol.md          # 所有 Agent 共用协议
  01_generator_agent.md          # 生成 Agent 固化提示词
  02_quality_monitor_agent.md    # 质量监测 Agent 固化提示词
  03_acceptance_agent.md         # 验收 Agent 固化提示词
  04_supervisor_agent.md         # 监督 Agent 固化提示词
schemas/
  sample_schema.json             # 单条样本 JSON Schema
workflow/
  closed_loop.md                 # 闭环流程与人工指标 A/B 规则
examples/
  sample_record.readable.json     # 可读格式示例数据
```

## 推荐执行顺序

1. 读取 `agents/00_shared_protocol.md`，加载全局字段、人格边界、A/B 人工闭环规则。
2. 生成 Agent 读取 `agents/01_generator_agent.md`，批量生成可读 JSON 样本；需要训练导入时再转换为 JSONL。
3. 质量监测 Agent 读取 `agents/02_quality_monitor_agent.md`，为每条样本输出 `quality_score` 和 `error_report`。
4. 验收 Agent 读取 `agents/03_acceptance_agent.md`，整合生成结果与质检结果，输出 `accept` 或 `reject`。
5. 监督 Agent 读取 `agents/04_supervisor_agent.md`，审核前三个 Agent 的行为、结论和偏差，输出 `audit_report` 与纠偏指令。
6. 若人工在 `human_metric_A` 填入指导意见，下一轮先把它标准化为 `human_metric_B`，再让四类 Agent 自适应调整。
7. 批量生成时可在 3D 工作坊左下角设置短/中/长数量；用户输入和上下文场景由生成 Agent 自动模拟，不需要人工手动填写。
8. 质量监测 Agent 会对已有样本做近重复检查，语义高度相同的样本不会重复进入人工审查队列。

## 一键启动

Windows 下可双击：

```text
start-all.bat
```

或在 PowerShell 中运行：

```powershell
.\scripts\start-all.ps1
```

脚本会启动：

- 后端：`http://127.0.0.1:8000`
- 前端 3D 工作坊：`http://127.0.0.1:5173`

默认模型供应商为 DeepSeek，可通过环境变量切换：

```powershell
$env:LLM_PROVIDER="deepseek" # 或 qwen
$env:DEEPSEEK_API_KEY="..."
$env:DASHSCOPE_API_KEY="..." # Qwen 兼容模式，也可用 QWEN_API_KEY
$env:ANTHROPIC_API_KEY="..." # Claude
$env:ANTHROPIC_MODEL="claude-sonnet-4-20250514"
```

真实模型调用会记录到 `output/llm_calls/*.jsonl`。默认不启用 mock；只有显式设置
`ALLOW_MOCK_LLM=true` 时才允许无 key fallback。

停止：

```powershell
.\scripts\stop-all.ps1
```

## 样本核心字段

每条样本至少包含：

- `system_message`
- `dialogue_context`
- `user_message`
- `model_response`
- `length_type`
- `emotion_label`
- `initiative_trigger`
- `context_memory`
- `human_metric_A`
- `human_metric_B`
- `dataset_split`

质量、验收、监督阶段会追加：

- `quality_score`
- `error_report`
- `acceptance_decision`
- `revision_suggestion`
- `audit_report`
- `correction_instruction`

## 人工指标 A/B 闭环

`human_metric_A` 是人工评测者的原始意见入口，默认为空字符串。

`human_metric_B` 是模型将 `human_metric_A` 标准化后的约束描述，默认为空字符串。

规则：

- 当 `human_metric_A == ""` 时，生成 Agent 按既有规则正常生成。
- 当 `human_metric_A != ""` 且 `human_metric_B == ""` 时，必须先调用大模型理解人工意见，并把意见改写为稳定、可执行、可检查的标准化要求，写入 `human_metric_B`。
- 当 `human_metric_B != ""` 时，后续生成、质检、验收、监督都必须把它作为当前样本或当前批次的附加约束。
