# Copyright 2026 Jiacheng Ni
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

param(
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$OutputDir = Join-Path $Root "output"
$LogDir = Join-Path $OutputDir "logs"
$RuntimeDir = Join-Path $OutputDir "runtime"
$PidFile = Join-Path $RuntimeDir "pids.json"
$FrontendUrl = "http://127.0.0.1:5173"
$BackendUrl = "http://127.0.0.1:8000/api/health"

New-Item -ItemType Directory -Force -Path $LogDir, $RuntimeDir | Out-Null

$env:CODEX_HOME = "F:\.codex"
if (-not $env:ALLOW_MOCK_LLM) {
  $env:ALLOW_MOCK_LLM = "true"
}

if (-not (Test-Path -LiteralPath (Join-Path $Root "node_modules"))) {
  throw "node_modules is missing. Run npm install in the project directory first."
}

function Start-QProcess {
  param(
    [string]$Name,
    [string]$FilePath,
    [string[]]$ArgumentList,
    [string]$OutLog,
    [string]$ErrLog
  )

  $process = Start-Process `
    -FilePath $FilePath `
    -ArgumentList $ArgumentList `
    -WorkingDirectory $Root `
    -RedirectStandardOutput $OutLog `
    -RedirectStandardError $ErrLog `
    -PassThru

  [pscustomobject]@{
    name = $Name
    pid = $process.Id
    started_at = (Get-Date).ToString("s")
  }
}

$backend = Start-QProcess `
  -Name "backend" `
  -FilePath "python" `
  -ArgumentList @("-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000") `
  -OutLog (Join-Path $LogDir "backend.out.log") `
  -ErrLog (Join-Path $LogDir "backend.err.log")

$frontend = Start-QProcess `
  -Name "frontend" `
  -FilePath "cmd.exe" `
  -ArgumentList @("/c", "npm run dev -- --port 5173") `
  -OutLog (Join-Path $LogDir "frontend.out.log") `
  -ErrLog (Join-Path $LogDir "frontend.err.log")

@($backend, $frontend) | ConvertTo-Json | Set-Content -LiteralPath $PidFile -Encoding UTF8

Start-Sleep -Seconds 3

try {
  Invoke-WebRequest -UseBasicParsing -Uri $BackendUrl -TimeoutSec 10 | Out-Null
  Write-Host "Backend started: $BackendUrl"
} catch {
  Write-Warning "Backend is not responding yet. Check $LogDir\backend.err.log"
}

try {
  Invoke-WebRequest -UseBasicParsing -Uri $FrontendUrl -TimeoutSec 10 | Out-Null
  Write-Host "Frontend started: $FrontendUrl"
} catch {
  Write-Warning "Frontend is not responding yet. Check $LogDir\frontend.err.log"
}

Write-Host "PID file: $PidFile"

if (-not $NoOpen) {
  Start-Process $FrontendUrl | Out-Null
}
