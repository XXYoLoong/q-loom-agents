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

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$PidFile = Join-Path $Root "output\runtime\pids.json"

function Stop-ProcessTree {
  param([int]$ProcessId)

  $children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$ProcessId" -ErrorAction SilentlyContinue
  foreach ($child in $children) {
    Stop-ProcessTree -ProcessId $child.ProcessId
  }

  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if ($process) {
    Stop-Process -Id $ProcessId -Force
  }
}

if (-not (Test-Path -LiteralPath $PidFile)) {
  Write-Host "No PID file found."
} else {
  $records = Get-Content -LiteralPath $PidFile -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($record in $records) {
    $process = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
    if ($process) {
      Stop-ProcessTree -ProcessId $record.pid
      Write-Host "Stopped $($record.name): $($record.pid)"
    }
  }
  Remove-Item -LiteralPath $PidFile -Force
}

$ports = @(8000, 5173)
foreach ($port in $ports) {
  $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($listener in $listeners) {
    Stop-ProcessTree -ProcessId $listener.OwningProcess
    Write-Host "Stopped listener on port ${port}: $($listener.OwningProcess)"
  }
}

Write-Host "All stopped."
