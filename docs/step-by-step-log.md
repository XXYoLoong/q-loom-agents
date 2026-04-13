# Project Process Log

## Project Title

Q-Loom Agents

## Activity Log

### 2026-04-13 Round 1

- Request received: build a LangChain/LangGraph multi-agent project for personalized dataset generation, convert data examples into readable multi-line format, create a Q-style 3D animated console showing each agent's work status, use DeepSeek through existing environment variables, publish each version to a new public GitHub repository, use Apache License 2.0 with copyright notice.
- Current action: created the project logging area and version folder, then started implementing the backend orchestration and frontend console.
- Initial assumptions: use `DEEPSEEK_API_KEY` from the environment, default model `deepseek-chat`, expose a FastAPI backend, and use a Vite/React/Three.js frontend for the 3D status console.
- Research note: DeepSeek official docs show OpenAI-compatible API at `https://api.deepseek.com` and available model IDs including `deepseek-chat` and `deepseek-reasoner`; LangChain supports DeepSeek through the `langchain-deepseek` package.
- Next step: write project files, add license headers, format readable JSON examples, install dependencies, run verification, initialize Git, create a public GitHub repository, and push version `v0.1.0`.

### 2026-04-13 Round 2

- Current action: converted the sample file from one-line JSONL into readable indented JSON and updated the prompt wording so human review data is not stored as a single line.
- Implementation: added Apache License 2.0, backend FastAPI/LangGraph files, frontend Vite/React/Three.js files, and a 3D console architecture note.
- Design decision: use original Three.js Q-style geometry instead of downloading unknown online 3D character assets, while assigning each agent a visible task prop inspired by common Q-style mascot proportions.
- Next step: install dependencies, run backend/frontend checks, then initialize and publish the GitHub repository.

### 2026-04-13 Round 3

- Verification: `npm install` completed successfully with no reported vulnerabilities.
- Blocker: `python -m pip install -e .` initially failed because setuptools auto-discovered multiple top-level directories in the flat project layout.
- Fix: updated `pyproject.toml` package discovery to include only `backend*` and exclude project documentation, frontend, schemas, versions, and workflow directories.
- Next step: rerun Python installation and continue checks.

### 2026-04-13 Round 4

- Verification: Python editable install succeeded after package discovery was constrained to the backend package.
- Verification: readable JSON sample parsed successfully with PowerShell UTF-8 JSON parsing.
- Blocker: first backend smoke command used bash-style heredoc, which PowerShell does not support.
- Blocker: first frontend build failed because `index.html` pointed to `/src/main.tsx` while the source lives in `/frontend/src/main.tsx`.
- Fix: updated the Vite HTML entry path and prepared to rerun checks with PowerShell-compatible syntax.

### 2026-04-13 Round 5

- Verification: backend LangGraph pipeline completed in mock mode, returned an `accept` decision, and produced five status events.
- Verification: frontend production build completed successfully.
- Observation: Vite warned that the main bundle was larger than 500 kB because Three.js was bundled into the app chunk.
- Fix: added Vite manual chunks for `react` and `three` to keep build output cleaner.
- Caveat: LangChain emitted a Python 3.14 compatibility warning for internal Pydantic V1 shims; the smoke run still completed.

### 2026-04-13 Round 6

- Verification: local backend and frontend development servers started successfully; backend health returned `ok`, and Vite served the page on port 5173.
- Verification: Playwright opened the page and found a canvas element.
- Adjustment: enabled Three.js `preserveDrawingBuffer` so automated canvas pixel checks can read the rendered frame reliably.
- Next step: rebuild frontend and rerun browser pixel verification.

### 2026-04-13 Round 7

- Verification: Playwright screenshot succeeded and canvas pixel metrics reported `hasCanvas=true` with `14400/14400` sampled pixels nonblank.
- Blocker: direct PowerShell/Python HTTP smoke tests encoded the Chinese `length_type` value as `?`, causing FastAPI request validation to reject the body.
- Fix: relaxed `AgentRunRequest.length_type` from a Chinese `Literal` to a normalized string validator that accepts Chinese values and ASCII aliases, defaulting unknown values to `中`.
- Next step: rerun backend smoke tests and publish to GitHub.

### 2026-04-13 Round 8

- Verification: restarted the backend and called `/api/run`; the pipeline returned an accept decision and five events.
- Observation: the command-line console displayed some Chinese response fields as mojibake, but the HTTP pipeline succeeded; browser UTF-8 usage is expected to render correctly.
- Repository: initialized a new local Git repository on branch `main`.
- Next step: create the public GitHub repository `q-loom-agents`, commit the v0.1.0 work, and push.

### 2026-04-13 Round 9

- Repository: created public GitHub repository `https://github.com/XXYoLoong/q-loom-agents`.
- Commit: created root commit `cd1a2bb` with message `v0.1.0 q-loom agents foundation`.
- Publish: pushed branch `main` to `origin/main`.
- Delivery state: v0.1.0 source, documentation, prompts, readable sample data, backend, frontend, and license are now available on GitHub.

### 2026-04-13 Round 10

- Adjustment: replaced the abbreviated license file with the standard Apache License 2.0 text so GitHub can recognize the repository license correctly.
- Next step: commit and push the license recognition fix.

### 2026-04-13 Round 11

- Commit: created `02bd01e` with message `docs use standard apache license`.
- Publish: pushed the license fix to `origin/main`.
- Verification: GitHub now reports license key `apache-2.0` and visibility `PUBLIC`.
- Final state: working tree is expected to be clean after this log update is committed and pushed.

### 2026-04-13 Round 12

- Request received: install the external PUA Codex skill from `https://raw.githubusercontent.com/tanweai/pua/main/.codex/INSTALL.md`, avoid C drive writes for that installation, add one-key project startup, and upgrade the console into a full 3D workshop room.
- External install: read the raw installation instructions and changed all default `$env:USERPROFILE\.codex` paths to `F:\.codex`.
- Result: cloned `https://github.com/tanweai/pua.git` to `F:\.codex\pua`, created skill junction `F:\.codex\skills\pua`, and created prompt hard link `F:\.codex\prompts\pua.md`.
- Verification: `F:\.codex\skills\pua\SKILL.md` and `F:\.codex\prompts\pua.md` both exist.
- Next step: implement v0.2.0 one-key startup scripts and rebuild the frontend as a full 3D workshop.

### 2026-04-13 Round 13

- Implementation: added `start-all.bat`, `scripts/start-all.ps1`, and `scripts/stop-all.ps1`.
- Startup behavior: the one-key script starts FastAPI on port 8000, Vite on port 5173, writes logs and PID state under the project `output` directory, sets `CODEX_HOME=F:\.codex`, and opens the console unless `-NoOpen` is passed.
- Safety decision: the startup script does not auto-install missing npm dependencies, because implicit package-manager caches may write outside the project; it asks the user to run `npm install` explicitly if `node_modules` is missing.
- Next step: replace the frontend surface with a fully 3D workshop room.

### 2026-04-13 Round 14

- Implementation: replaced the previous embedded 3D panel with a full-screen Three.js workshop scene.
- 3D modeling: added room geometry, floor, back and side walls, lamps, desks, computers, a large wall status screen, chibi agent bodies, task props, papers, magnifying glass, keyboard, and supervisor whip.
- Interaction: hovering over a mascot now shows a live task tooltip; clicking a mascot starts the agent loop; clicking the wall screen opens a full-screen status and result panel.
- Animation: generator hands type at the keyboard, quality monitor moves the magnifying glass, acceptance flips comparison papers, and supervisor swings the whip.
- Build: `npm run build` and `python -m compileall backend` passed after the scene replacement.
- Next step: run Playwright visual and pixel verification, test one-key startup, then push v0.2.0.

### 2026-04-13 Round 15

- Verification: first `scripts/stop-all.ps1` smoke test exposed a Windows PowerShell parsing issue with UTF-8 Chinese strings in the script.
- Fix: changed runtime messages in `start-all.ps1` and `stop-all.ps1` to ASCII-only text so Windows PowerShell 5.1 can parse them reliably even without UTF-8 BOM handling.
- Next step: rerun one-key startup and stop scripts.

### 2026-04-13 Round 16

- Verification: one-key startup script successfully started backend and frontend; health check returned `ok`, and the frontend returned HTTP 200.
- Verification: Playwright opened the full 3D workshop, captured `output/playwright/q-loom-workshop-v0.2.0.png`, measured canvas pixels as `25600/25600` nonblank, confirmed the wall-screen overlay opened, and confirmed a hover tooltip became visible.
- Blocker: first stop script test stopped the recorded `cmd.exe` wrapper but left the Vite child `node` process listening on port 5173.
- Fix: updated `stop-all.ps1` to stop process trees and also clear listeners on ports 8000 and 5173.
- Next step: rerun stop/start checks, then commit and push v0.2.0.

### 2026-04-13 Round 17

- Verification: rerunning `stop-all.ps1` exposed a PowerShell variable interpolation bug in the string `port $port:`.
- Fix: changed the string to use `${port}` so PowerShell does not parse the colon as part of a scoped variable reference.
- Next step: rerun stop/start checks.

### 2026-04-13 Round 18

- Verification: `stop-all.ps1` successfully stopped the stale Vite listener on port 5173; ports 8000 and 5173 were both clear afterward.
- Verification: `start-all.ps1 -NoOpen` successfully started backend and frontend again; backend health returned `{"status":"ok","model":"deepseek-chat"}` and frontend returned HTTP 200.
- Delivery state: local v0.2.0 services are running for user review.
- Next step: commit and push v0.2.0 to GitHub.

### 2026-04-13 Round 19

- Verification: final `git diff --check` passed.
- Verification: final `npm run build` passed for v0.2.0.
- Verification: final `python -m compileall backend` passed.
- Commit: created `9ec991d` with message `v0.2.0 full 3d workshop and startup`.
- Publish: pushed v0.2.0 to `origin/main` at `https://github.com/XXYoLoong/q-loom-agents`.

### 2026-04-13 Round 20

- Request received: user said the current 3D console is too ugly and provided a Q-style anime control-room reference image.
- Skill: loaded `F:\.codex\pua\codex\pua\SKILL.md` and `frontend-skill`; selected a quality-focused redesign path instead of minor parameter tweaks.
- Visual target: central coder at a long desk, supervisor with whip at left, quality monitor with magnifying glass at lower-left, acceptance agent with documents at right, large wall screen, side monitor racks, plants, papers, coffee, cables, and dense lab-room detail.
- Next step: refactor the Three.js workshop scene for v0.3.0, verify with screenshot and canvas checks, then push to GitHub.

### 2026-04-13 Round 21

- Implementation: rebuilt the workshop composition around the reference image: central coder at a long desk, left supervisor with whip, lower-left quality monitor with magnifying glass, and right acceptance agent with documents.
- 3D detail: added side screen cabinets, top wall screens, a larger wall dashboard, long desk drawers, chair, dual monitors, reading desks, coffee cups, plants, sticky notes, floor cables, character hair colors, glasses, smiles, and outline meshes.
- UX adjustment: removed the main web-style command button so the default control surface is the 3D room itself; users can click an agent to run and click the wall screen for the full-screen panel.
- Verification: `npm run build` and `python -m compileall backend` passed; Playwright screenshot captured `output/playwright/q-loom-workshop-v0.3.0b.png`; canvas metrics were `21600/21600` nonblank, tooltip appeared, and wall-screen overlay opened.
- Next step: update package versions, run final checks, commit, and push v0.3.0.

### 2026-04-13 Round 22

- Final verification: `npm run build`, `python -m compileall backend`, `git diff --check`, and Playwright visual checks passed after removing the web-style command dock.
- Screenshot: final visual artifact saved at `output/playwright/q-loom-workshop-v0.3.0-final.png`.
- Playwright metrics: canvas `21600/21600` nonblank, tooltip visible, and wall-screen overlay opened.
- Commit: created `2a50f31` with message `v0.3.0 anime workshop polish`.
- Publish: pushed v0.3.0 to GitHub `origin/main`.

### 2026-04-13 Round 23

- Request received: user rejected v0.3.0 as still mostly cosmetic and called out missing multi-stage flow visualization plus missing long-running human review workflow.
- Diagnosis: core product gaps are backend persistence and front-end review operations, not model color/style.
- v0.4.0 target: add persistent review queue, staged agent timeline playback, sample-by-sample human review with save/previous/next/return-to-edit behavior, and resume after app restart.
- Next step: implement backend review store and API before adjusting the 3D UI.

### 2026-04-13 Round 24

- Implementation: added backend review schemas and `ReviewStore`, persisting state to `output/review/review_state.json`.
- API: added `GET /api/review`, `POST /api/review/save`, `POST /api/review/navigate`, and `POST /api/review/jump`.
- Pipeline integration: `/api/run` now appends or refreshes the generated sample in the review queue automatically.
- Frontend: added staged timeline playback for generator, quality monitor, acceptance, and supervisor before showing final results.
- Frontend: added `ReviewDesk` inside the wall-screen full-screen panel for sample-by-sample human review with A/B fields, notes, decision, save, previous, next, return-to-revision, and history display.
- Next step: run build, API persistence checks, browser review-flow checks, then push v0.4.0.

### 2026-04-13 Round 25

- Fix: changed the `ReviewDesk` return-to-revision action so it forcibly persists decision `needs_revision` instead of only recording an action label.
- Verification: `npm run build` passed for package version `0.4.0`.
- Verification: `python -m compileall backend` passed.
- Verification: `git diff --check` passed.
- Verification: backend health returned `{"status":"ok","model":"deepseek-chat"}` and frontend returned HTTP 200.
- Browser verification: Playwright clicked the 3D room to run the loop, opened the wall screen during execution, and confirmed an intermediate `running/reviewing` stage was visible.
- Browser verification: Playwright filled human metric A, standardized metric B, reviewer note, clicked return-to-revision, refreshed the page, reopened the wall screen, and confirmed all review values plus decision `needs_revision` persisted.
- Screenshot artifacts: `output/playwright/q-loom-v0.4.0-before.png` and `output/playwright/q-loom-v0.4.0-review-flow.png`.
- Next step: commit and push v0.4.0 to GitHub.

### 2026-04-13 Round 26

- Commit: created `252caba` with message `v0.4.0 staged review workflow`.
- Publish: pushed v0.4.0 to GitHub `origin/main`.
- Repository: `https://github.com/XXYoLoong/q-loom-agents`.
- Next step: commit this documentation sync so the repository history records the published v0.4.0 revision.

### 2026-04-13 Round 27

- Request received: user reported corrupted `human_metric_A/B` values, incorrect review status semantics when navigating, missing configurable sample counts, missing near-duplicate detection, missing Qwen provider selection, and missing proof of real DeepSeek calls.
- Diagnosis: local review state was polluted by earlier PowerShell HTTP smoke-test data; the startup script allowed mock mode by default; the UI hard-coded one medium sample; and no LLM call audit trail existed.
- v0.5.0 target: make real LLM calls observable, support DeepSeek/Qwen selection, add short/medium/long batch counts, add deterministic duplicate checking in quality monitoring, and repair review navigation semantics.
- Next step: implement backend provider/call-log/batch/duplicate services, then update the frontend controls and review desk.

### 2026-04-13 Round 28

- Backend: added DeepSeek/Qwen provider selection, Qwen compatible-mode support, and LLM call auditing under `output/llm_calls/*.jsonl`.
- Backend: default mock mode is now off; `ALLOW_MOCK_LLM=true` is required for fallback without real model calls.
- Backend: added `/api/run-batch`, `/api/llm/status`, and `/api/llm/calls`.
- Backend: added near-duplicate detection for quality monitoring; duplicate samples are rejected and skipped from the review queue.
- Review: navigation autosave now only fires when the current item has unsaved changes; unchanged previous/next navigation preserves `pending`.
- Repair: local v0.4 smoke-test values, including `????`, were removed from `output/review/review_state.json`.
- Frontend: added model/count/dataset settings and LLM audit display.
- Next step: correct the generation settings so user messages remain fully simulated by the generator, then verify real provider calls.

### 2026-04-13 Round 29

- Correction: user clarified that `user_message` must also be generated by the system, not manually entered.
- Backend: changed default `user_message` to empty and updated generator instructions so the generator self-simulates current user input plus 3-6 rounds of context when no explicit message is supplied.
- Frontend: removed the manual user input field; the settings panel now only exposes provider, short/medium/long counts, and dataset split.
- Verification: `npm run build`, `python -m compileall backend`, and `git diff --check` passed after the correction.
- Real-call verification: `/api/run-batch` with DeepSeek produced four `success` records for generator, quality monitor, acceptance, and supervisor in `output/llm_calls/20260413.jsonl`.
- Qwen verification: direct `qwen_probe` call returned JSON successfully and wrote a `qwen/qwen-plus` success audit record.
- Duplicate verification: a controlled duplicate request returned `review_action=skipped_duplicate`, duplicate count `2`, and acceptance decision `reject`.
- Browser verification: Playwright confirmed no non-number manual input exists in the generation settings panel, and unchanged review navigation moved index without changing decision or appending history.
- Next step: finalize docs/changelog, rerun final checks, commit, push v0.5.0.

### 2026-04-13 Round 30

- Final verification: `npm run build`, `python -m compileall backend`, `git diff --check`, backend health, and frontend HTTP 200 all passed.
- Runtime: restarted services through `scripts/stop-all.ps1` and `scripts/start-all.ps1 -NoOpen`; backend reports `provider=deepseek`, `model=deepseek-chat`, `mock_allowed=false`.
- Commit: created `701566d` with message `v0.5.0 real llm batch review fixes`.
- Publish: pushed v0.5.0 to GitHub `origin/main`.
- Repository: `https://github.com/XXYoLoong/q-loom-agents`.
- Documentation sync: created and pushed `f0a1772` with message `docs record v0.5.0 publish`.
- Delivery state: v0.5.0 is published; local services are running for review.

### 2026-04-13 Round 31

- Request received: add `ANTHROPIC_API_KEY` support and Claude model selection.
- Research: checked Anthropic docs for API model IDs and LangChain docs for `ChatAnthropic`; stable default chosen as `claude-sonnet-4-20250514`, with `ANTHROPIC_MODEL` override.
- Environment check: current process has DeepSeek and DashScope keys, but no `ANTHROPIC_API_KEY`; `langchain_anthropic` is not installed in the current Python environment.
- v0.6.0 target: add Claude/Anthropic as a third provider without breaking current DeepSeek/Qwen runtime when the Anthropic package or key is absent.
- Next step: update backend provider config, LLM factory, schemas, frontend provider selection, docs, and version records.

### 2026-04-13 Round 32

- Backend: added Claude provider support with `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, and optional `ANTHROPIC_BASE_URL`.
- Backend: added optional `langchain_anthropic` import handling; Claude status reports both `key_configured` and `package_installed`.
- Frontend: model selector now includes Claude and displays it as unconfigured when the key or provider package is missing.
- Docs: README and v0.6.0 changelog now include Anthropic/Claude setup.
- Version: bumped frontend and Python project versions to `0.6.0`; added `langchain-anthropic` to Python dependencies.
- Verification: `python -m compileall backend`, `npm run build`, and `git diff --check` passed.
- Runtime verification: services restarted successfully; backend health remained DeepSeek with `mock_allowed=false`; `/api/llm/status` listed Claude as `configured=false`, `key_configured=false`, `package_installed=false`.
- Browser verification: Playwright confirmed the provider dropdown contains DeepSeek, Qwen, and `Claude（未配置）`.
- Next step: commit and push v0.6.0.

### 2026-04-13 Round 33

- Commit: created `00efd96` with message `v0.6.0 add claude provider`.
- Publish: pushed v0.6.0 to GitHub `origin/main`.
- Repository: `https://github.com/XXYoLoong/q-loom-agents`.
- Next step: commit this documentation sync.

### 2026-04-13 Round 34

- Correction: after checking Anthropic's current model documentation, updated the default Claude model from `claude-sonnet-4-20250514` to `claude-sonnet-4-6`.
- Version: bumped project versions to `0.6.1` for this Claude default correction.
- Verification: `python -m compileall backend`, `npm run build`, and `git diff --check` passed.
- Runtime verification: services restarted successfully; `/api/llm/status` reports Claude model `claude-sonnet-4-6`, while backend remains healthy on DeepSeek with `mock_allowed=false`.
- Commit: created `bdb182c` with message `v0.6.1 update claude default model`.
- Publish: pushed v0.6.1 to GitHub `origin/main`.

### 2026-04-13 Round 35

- Request clarification: user said `ANTHROPIC_API_KEY` is set in system environment variables and asked to list all models callable by each provider API key.
- Diagnosis: reading only process environment can miss Windows User/Machine variables; a single provider dropdown is not enough because concrete model IDs must be selectable.
- Backend: added Process/User/Machine environment lookup on Windows.
- Backend: added model discovery for DeepSeek and Qwen via OpenAI-compatible `/models`, and Claude via Anthropic `/v1/models`, with safe fallback lists and error strings.
- API: `/api/llm/status` now returns model lists per provider; `/api/llm/models/{provider}?refresh=true` can force refresh.
- Pipeline: `AgentRunRequest` and `BatchRunRequest` now carry a concrete `model`; LangGraph passes the selected model to all four LLM calls and audit records.
- Frontend: added second-level model selector linked to provider selection.
- Verification: `python -m compileall backend`, `npm run build`, and `git diff --check` passed.
- Runtime verification: services restarted successfully; `/api/llm/status` returned DeepSeek 2 models, Qwen 222 models, and Claude `key_configured=true` with fallback model `claude-sonnet-4-6`.
- Note: Claude package is still not installed in the current Python environment, so `/api/llm/status` correctly reports `package_installed=false`; model list fetch returned HTTPError and used fallback instead of crashing.
- Browser verification: Playwright confirmed provider/model linked dropdowns, including 222 Qwen model options and Claude fallback model.
- Commit: created `54b9c85` with message `v0.7.0 dynamic provider model selection`.
- Publish: pushed v0.7.0 to GitHub `origin/main`.

### 2026-04-13 Round 36

- Follow-up diagnosis: although the project now declares `langchain-anthropic`, the current Python environment still does not have it installed; selecting Claude would not be callable immediately.
- Backend: added `_HttpClaudeClient` fallback using Anthropic `/v1/messages`, so an available `ANTHROPIC_API_KEY` can call Claude even before installing `langchain_anthropic`.
- API: Claude status now includes `http_fallback` to make this runtime path visible.
- Version: bumped project versions to `0.7.1`.
- Verification: `python -m compileall backend`, `npm run build`, and `git diff --check` passed.
- Runtime verification: services restarted successfully; `/api/llm/status` reports Claude `configured=true`, `key_configured=true`, `package_installed=false`, `http_fallback=true`.
- Note: Claude model-list endpoint still returned HTTPError, so the model dropdown uses fallback `claude-sonnet-4-6` until the provider accepts the model-list request.
- Commit: created `0d8f266` with message `v0.7.1 add claude http fallback`.
- Publish: pushed v0.7.1 to GitHub `origin/main`.

### 2026-04-13 Round 37

- Request received: user pointed out that the Claude key should have many applicable models, while the UI only showed `claude-sonnet-4-6`.
- Root cause: Anthropic `/v1/models` returned HTTPError, and the fallback Claude model list only contained a single model.
- Fix: expanded Claude fallback list to current/common Claude model IDs and changed HTTPError reporting to include status code plus response-body snippet.
- Version: bumped project versions to `0.7.2`.
- Verification: `python -m compileall backend`, `npm run build`, and `git diff --check` passed.
- Runtime verification: `/api/llm/status` now returns 13 Claude fallback models; Anthropic model-list error is explicit: `HTTP 401 invalid x-api-key`.
- Browser verification: Playwright confirmed the Claude model dropdown has 13 options, including `claude-opus-4-6` and `claude-sonnet-4-6`.
- Commit: created `6a024b6` with message `v0.7.2 expand claude fallback models`.
- Publish: pushed v0.7.2 to GitHub `origin/main`.

### 2026-04-13 Round 38

- Request received: user clarified that the Claude key is for a NewAPI relay and provided the NewAPI Apifox documentation URL.
- Documentation check: NewAPI exposes model listing at `/v1/models` with `Authorization: Bearer`, and Claude native messages at `/v1/messages` with `anthropic-version`.
- Root cause: the previous Claude branch treated `ANTHROPIC_API_KEY` as an official Anthropic key and sent `x-api-key`, so NewAPI relay keys produced `invalid x-api-key`.
- Backend: added `NEWAPI_BASE_URL` and `NEWAPI_API_KEY`, with `ANTHROPIC_API_KEY` still usable as the relay token when `NEWAPI_API_KEY` is absent.
- Backend: Claude now automatically switches auth mode between official Anthropic `x-api-key` and NewAPI relay `Authorization: Bearer`.
- API: `/api/llm/status` now reports Claude `newapi_configured`, `relay_configured`, and `auth_mode` so the UI/debug output can prove which route is active.
- Docs: README and v0.7.3 changelog now document NewAPI relay setup and the reason the docs URL itself must not be used as the API base URL.
- Verification: `python -m compileall backend`, `npm run build`, and `git diff --check` passed.
- Runtime verification: one-key scripts restarted the stack; `/api/health` returned `status=ok`, `provider=deepseek`, and `mock_allowed=false`; frontend returned HTTP 200.
- Runtime caveat: current machine has `ANTHROPIC_API_KEY`, but no `NEWAPI_BASE_URL`, `NEWAPI_API_KEY`, or `ANTHROPIC_BASE_URL`, so Claude correctly reports `auth_mode=x-api-key` and `newapi_configured=false`.
- Relay probe: with dummy process-only `NEWAPI_BASE_URL`, backend helper routing resolves Claude to `/v1/models`, `/v1/messages`, and `Authorization` auth mode.
- Next step: commit and push v0.7.3, then record the publish commit.

### 2026-04-13 Round 39

- Commit: created `f56de22` with message `v0.7.3 support newapi claude relay`.
- Publish: pushed v0.7.3 to GitHub `origin/main`.
- Repository: `https://github.com/XXYoLoong/q-loom-agents`.
- Delivery state: local stack is running; backend health and frontend HTTP checks both passed after this release.
