# OpenCode Harness — Spec Driven Development

This project uses OpenCode with a **Spec Driven Development** workflow. A task-based agent system drives the project forward, but the workflow only runs when you explicitly trigger it.

---

## Task Source of Truth

**`docs/tasks.json`** is the single source of truth for all project tasks. It contains a JSON array of objects, each with:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | The task description |
| `status` | `"pending" \| "done" \| "failed"` | Current task state |
| `acceptance` | string[] | Acceptance criteria that must all pass to mark a task done |

**Never manually edit task status outside of the workflow.** The orchestrator is the only agent that updates `docs/tasks.json`.

---

## Workflow Triggers

The task workflow runs **only** when you:

- Run the `/next-task` command
- Explicitly ask to continue task development (e.g., "continue", "next task", "implement the next task")

For **normal prompts** — greetings ("hi"), questions, debugging help, code review requests, or any other casual interaction — respond normally. **Do not** read `docs/tasks.json` or start working on pending tasks.

---

## Agent Roles

| Agent | Mode | Description |
|-------|------|-------------|
| **orchestrator** | primary | Coordinates the workflow: reads `docs/tasks.json`, finds the first pending task, delegates to Programmer, delegates to Reviewer, then updates task status. |
| **programmer** | subagent | Implements the current task by writing code. Reports created/modified files. |
| **reviewer** | subagent | Verifies that the Programmer's implementation meets all acceptance criteria. Reports PASS or FAIL. |

---

## Available Commands

### `/next-task`
Find the first pending task in `docs/tasks.json`, implement it, verify every acceptance criterion, and mark it `"done"` only if all criteria pass. If any criterion fails, mark it `"failed"`.

---

## Available Skills

| Skill | Location | Purpose |
|-------|----------|---------|
| **task-workflow** | `.opencode/skills/task-workflow/` | Guides the overall task workflow process: finding, implementing, and verifying tasks in sequence. |
| **localstorage-review** | `.opencode/skills/localstorage-review/` | Reviews localStorage usage: safe access, try/catch wrapping, data validation, handling corrupted or missing data, and safe defaults. |
| **minimal-usable-design** | `.opencode/skills/project-design/` | Ensures clean, minimal, usable design: simple layouts, adequate spacing, readable fonts, touch-friendly buttons, and consistent color palettes. |
| **code-review** | `.opencode/skills/code-review/` | Reviews code quality: acceptance criteria verification, regression checks, semantic HTML, readable CSS/JS, scope discipline, and localStorage safety. |

---

## MCP: task-contract

**`docs/task-contract`** is the MCP (Model Context Protocol) server for task reports.

- Tool: `submit_task_report` — accepts `taskId`, `status`, `changedFiles`, `verification` checks, and optional `notes`.
- Appends structured JSONL reports to `.opencode/mcp/task-contract/reports.jsonl`.
- Setup: `cd .opencode/mcp/task-contract && npm install && npm start`

---

## Project Structure

```
projecteOpenCode/
├── AGENTS.md              # This file
├── docs/
│   └── tasks.json         # Task source of truth
├── webs/                  # Web app source (HTML, CSS, JS)
├── .opencode/
│   ├── agents/
│   │   ├── orchestrator.md
│   │   ├── programmer.md
│   │   └── reviewer.md
│   ├── commands/
│   │   └── next-task.md
│   ├── mcp/
│   │   └── task-contract/ # MCP server for task reports
│   └── skills/
│       ├── code-review/
│       └── project-design/
├── opencode.json          # OpenCode configuration
└── run_opencode.sh        # Launch script
```

---

## Rules

1. **One task at a time.** Never implement more than the first pending task.
2. **Never skip tasks.** Always work on the first pending task in `docs/tasks.json`.
3. **Verify before marking done.** Every acceptance criterion must pass before updating status to `"done"`.
4. **No external dependencies.** Use vanilla HTML, CSS, and JavaScript only.
5. **Keep changes focused.** Only modify what is necessary for the current task.
6. **Normal prompts are normal.** Do not start the task workflow unless explicitly triggered.
