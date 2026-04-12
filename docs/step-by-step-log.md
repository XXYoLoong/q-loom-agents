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
