# PUA Skill F 盘安装记录

外部说明来源：

```text
https://raw.githubusercontent.com/tanweai/pua/main/.codex/INSTALL.md
```

原说明默认安装到：

```text
$env:USERPROFILE\.codex
```

本机要求：

- 不在 C 盘落任何 PUA 安装文件。
- 所有 Codex skill、prompt 和仓库文件都放在 F 盘。

实际安装位置：

```text
F:\.codex\pua
F:\.codex\skills\pua
F:\.codex\prompts\pua.md
```

执行逻辑：

```powershell
$CodexHome = 'F:\.codex'
$PuaRepo = Join-Path $CodexHome 'pua'
$SkillsDir = Join-Path $CodexHome 'skills'
$PromptsDir = Join-Path $CodexHome 'prompts'

New-Item -ItemType Directory -Force -Path $CodexHome, $SkillsDir, $PromptsDir
git clone https://github.com/tanweai/pua.git $PuaRepo
New-Item -ItemType Junction -Path "$SkillsDir\pua" -Target "$PuaRepo\codex\pua"
New-Item -ItemType HardLink -Path "$PromptsDir\pua.md" -Target "$PuaRepo\commands\pua.md"
```

验证结果：

```json
{
  "codex_home": "F:\\.codex",
  "repo": true,
  "skill": true,
  "prompt": true
}
```

