# OpenCode Harness - Girona Travel Guide Project

This project uses OpenCode with a **task-driven development** workflow to build a researched mini travel-guide website for Girona.

The workflow runs only when explicitly triggered. Normal conversation, one-off questions, debugging requests, or reviews must not automatically start task implementation.

---

## Project Goal

Build a responsive mini travel-guide website in `webs/` using exactly these app files:

- `webs/travel.html`
- `webs/travel.css`
- `webs/travel.js`

The final website should help visitors explore Girona through 10 recommended places, with:

- short practical descriptions
- categories such as landmark, museum, viewpoint, historic quarter, bridge, food or market, park, and family-friendly stop
- opening hours when available from reliable sources
- official links for each place whenever available
- visible citations and a sources section
- card-based layout
- search and category filtering
- responsive behavior across desktop and mobile

The site must use only HTML, CSS, and JavaScript. Do not add external frameworks, build tools, map SDKs, fonts, or runtime dependencies.

---

## Research Requirements

The first task must perform web research before implementation.

Research must collect 10 recommended Girona places to visit. Prefer official or authoritative sources in this order:

1. Girona City Council / official Girona tourism pages.
2. Official attraction or museum websites.
3. Spain.info or other public tourism bodies.
4. Reputable travel publishers only when official data is incomplete.

For each place, capture:

- name
- category
- short description in original words, not copied text
- opening hours when available
- official link when available
- source link used for the description or hours
- retrieval date

If opening hours are missing or unclear, write `"Hours not available from checked sources"` rather than inventing them.

---

## Task Source Of Truth

**`docs/tasks.json`** is the single source of truth for project tasks. It contains a JSON array of objects with:

| Field | Type | Description |
|---|---|---|
| `title` | string | Task description |
| `status` | `"pending" \| "done" \| "failed"` | Current task state |
| `acceptance` | string[] | Acceptance criteria that must all be verified |

Do not manually edit task status outside the workflow. The orchestrator updates a task to `done` or `failed` only after review.

---

## Workflow Triggers

The task workflow runs only when:

- the `/next-task` command is used
- the user explicitly asks to continue task development
- the user explicitly asks to implement the next pending task

For normal prompts, debugging, design discussion, or reviews, respond normally without starting the workflow or modifying `docs/tasks.json`.

---

## Agent Roles

| Agent | Mode | Responsibility |
|---|---|---|
| **orchestrator** | primary | Reads `docs/tasks.json`, selects the first pending task, delegates implementation, requests review, and updates task status. |
| **programmer** | subagent | Implements only the current task, keeping changes focused on the necessary files. |
| **reviewer** | subagent | Verifies every acceptance criterion and reports PASS or FAIL with concrete reasons. |

---

## Available Commands

### `/next-task`

Find the first `pending` task in `docs/tasks.json`, implement it, verify every acceptance criterion, and mark it `done` only if all criteria pass.

If any criterion fails, mark the task `failed` with a useful explanation for correction.

### `/run-tasks`

Repeatedly run the `/next-task` workflow until there are no pending tasks, a task fails, or the command safety limit is reached.

---

## Technical Criteria

- Use only vanilla HTML, CSS, and JavaScript.
- Keep the app as static files; it must work from a simple local server and should not require a backend.
- Keep researched place data structured so cards and filters are generated consistently.
- Do not fetch live data at runtime; research happens during implementation and is stored in the project files.
- External links must open safely with `target="_blank"` and `rel="noopener noreferrer"` when they open in a new tab.
- Avoid copying long source text. Use short original summaries and cite links.
- Do not include inaccurate opening hours. Mark uncertain hours clearly.

---

## Travel Guide UX Criteria

When implementing or reviewing tasks, preserve these behaviors:

- Girona is the first-viewport subject of the page.
- The cards are scannable and useful to a traveler planning a short visit.
- Search matches names, descriptions, categories, and nearby practical text.
- Category filtering works together with search.
- Source links and official links are visible enough for verification without dominating the page.
- Empty search or filter states are handled gracefully.
- The website remains usable without internet access after it has been built, except for opening external source links.

---

## Visual And UX Criteria

- Build the travel-guide experience directly, not a marketing landing page.
- Use a responsive card grid for places.
- Use clear category controls, not hidden filters.
- Avoid oversized hero sections that push the actual guide below the first viewport.
- Do not use dark, blurred, cropped, stock-like, or purely atmospheric media.
- Text must not overlap cards, controls, or footer content on mobile or desktop.

---

## Recommended Verification

Before marking a task `done`, at minimum:

- open `webs/travel.html` in a browser or through a simple local server after the web files exist
- check the browser console
- verify search and category filters after they are implemented
- inspect responsive layout at desktop and mobile widths
- manually confirm every acceptance criterion for the task
- verify that source links and official links are present and relevant

For research tasks, verify that the saved research includes 10 places, source URLs, retrieval dates, and no invented opening hours.

---

## MCP: task-contract

**`.opencode/mcp/task-contract`** is the MCP server for task reports.

- Tool: `submit_task_report`
- Accepts `taskId`, `status`, `changedFiles`, `verification`, and `remarks`.
- Appends JSONL reports to `.opencode/mcp/task-contract/reports.jsonl`.
- Setup: `cd .opencode/mcp/task-contract && npm install && npm start`

---

## Project Structure

```text
projecteGirona/
├── AGENTS.md              # This file
├── docs/
│   ├── tasks.json         # Girona travel-guide backlog
│   └── girona-research.json
├── webs/
│   ├── travel.html        # Travel guide structure
│   ├── travel.css         # Responsive card layout and visual design
│   └── travel.js          # Data rendering, search, and category filtering
├── .opencode/
│   ├── agents/
│   │   ├── orchestrator.md
│   │   ├── programmer.md
│   │   └── reviewer.md
│   ├── commands/
│   │   ├── next-task.md
│   │   └── run-tasks.md
│   └── mcp/
│       └── task-contract/
├── opencode.json
└── run_opencode.sh
```

---

## Rules

1. Work on one task at a time.
2. Do not skip tasks: always implement the first `pending` task.
3. Do not mark a task `done` until every acceptance criterion passes.
4. Keep changes focused on the current task.
5. Do not add external dependencies.
6. Do not replace the backlog with generic non-Girona tasks.
7. Normal conversation must not start the task workflow.
