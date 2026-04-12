# 多 Agent 闭环流程

## 1. 总流程

```text
生成 Agent
  -> 质量监测 Agent
  -> 验收 Agent
  -> 监督 Agent
  -> 闭环反馈
  -> 下一轮生成或修正
```

## 2. 批量生成阶段

生成 Agent 读取：

- `agents/00_shared_protocol.md`
- `agents/01_generator_agent.md`
- 当前批次目标，例如训练集数量、测试集数量、长度比例、情绪比例。
- 历史监督纠偏指令。
- 人工指标 A/B。

输出：

- 可读 JSON 样本。
- 每条数据使用缩进格式，方便人工审核。
- 不输出额外说明。

## 3. 质量监测阶段

质量监测 Agent 读取：

- 原始样本。
- 共用协议。
- 质量监测提示词。

输出：

- `quality_score`
- `error_report`
- `monitor_summary`

若发现格式错误，必须先报告格式错误，不要尝试凭空补字段。

## 4. 验收阶段

验收 Agent 读取：

- 原始样本。
- 质量监测结果。
- 共用协议。
- 验收提示词。

输出：

- `acceptance_decision`
- `acceptance_reason`
- `revision_suggestion`
- `final_dataset_split`

验收原则：

- 宁可拒绝含硬伤样本，也不要让不可控样本进入训练集。
- 轻微风格问题可接受，但必须记录建议。

## 5. 监督阶段

监督 Agent 读取：

- 生成结果。
- 质量监测结果。
- 验收结果。
- 历史纠偏指令。
- 人工 A/B。

输出：

- `audit_report`
- `supervisor_decision`
- `correction_instruction`

监督 Agent 不只审样本，也审其他 Agent 的判断是否可靠。

## 6. 人工指标 A/B 流程

人工评测步骤保留两个空指标：

```json
"human_metric_A": "",
"human_metric_B": ""
```

### A 为空

若：

```json
"human_metric_A": "",
"human_metric_B": ""
```

则：

- 正常生成。
- 正常质检。
- 正常验收。
- 正常监督。

### A 不为空，B 为空

若：

```json
"human_metric_A": "少一点撒娇，多一点安静陪伴",
"human_metric_B": ""
```

则下一轮必须先执行“人工意见标准化”：

```json
"human_metric_B": "降低撒娇表达频率；优先使用安静陪伴、轻声提醒、记忆细节回应；避免连续语气词和索取式亲昵。"
```

随后：

- 生成 Agent 按 B 生成或修正。
- 质量监测 Agent 检查 B 是否执行。
- 验收 Agent 把 B 作为硬门槛之一。
- 监督 Agent 检查 B 是否忠实表达 A。

### A 和 B 都不为空

若 A 与 B 一致：

- 后续直接按 B 执行。

若 A 与 B 冲突：

- 监督 Agent 输出 `revise` 或 `block`。
- 重新标准化 B。
- 暂停该样本进入训练集。

## 7. 人工意见标准化模板

输入：

```json
{
  "human_metric_A": "这里太像客服了，想更像女朋友",
  "human_metric_B": ""
}
```

输出：

```json
{
  "human_metric_A": "这里太像客服了，想更像女朋友",
  "human_metric_B": "减少服务式、解释式和建议清单式表达；增加恋人式关注、具体记忆引用和轻柔情绪回应；避免使用客服口吻。"
}
```

## 8. 批量分布建议

600 条总样本建议：

- train：500 条。
- test：100 条。
- 短：约 210 条。
- 中：约 270 条。
- 长：约 120 条。
- 主动性触发：至少 180 条。
- 每种主要情绪至少 30 条。

测试集要求：

- 覆盖所有长度类型。
- 覆盖主动和非主动场景。
- 覆盖至少 8 种情绪。
- 包含部分带 `human_metric_B` 的修正样本。
