# OpenCode Task Harness

This project uses OpenCode agents and commands to coordinate task-driven development. The task workflow is **off by default** — it only runs when you explicitly invoke it.

## How it works

- **Normal interaction** — For prompts like "hi", questions, debugging, or general chat, the agent responds normally. It does **not** read or modify `docs/tasks.json` unless you ask it to.
- **`/next-task`** — This command reads `docs/tasks.json`, finds the first `"pending"` task, implements only that task, verifies it against acceptance criteria, and marks it `"done"` only if all criteria pass.
- **`/review-current-task`** — Re-runs verification on the most recently implemented task without re-implementing it.

## Task source of truth

`docs/tasks.json` — all tasks live here. Each task has an `id`, `title`, `description`, `acceptance_criteria` (list), and `status` (`"pending"` or `"done"`).

## Agents

| Agent | File | Responsibility |
|---|---|---|
| **Orchestrator** | `.opencode/agents/orchestrator.md` | Reads `docs/tasks.json`, assigns the first pending task to the Programmer, then asks the Reviewer to verify it. Marks a task `done` only when all acceptance criteria pass. |
| **Programmer** | `.opencode/agents/programmer.md` | Implements only the current task with minimal, focused changes. Uses no external dependencies. Reports changed files. |
| **Reviewer** | `.opencode/agents/reviewer.md` | Verifies changed files against the task's acceptance criteria, checks project integrity, basic accessibility (if applicable), and absence of debugging artefacts. Returns a structured pass/fail report. |

## Workflow (triggered by `/next-task`)

```
┌─────────────┐     task details     ┌──────────────┐
│ Orchestrator │ ──────────────────→ │  Programmer  │
│  (reads      │                     │  (implements)│
│   tasks.json)│ ←────────────────── │              │
└──────┬───────┘   changed files     └──────────────┘
       │
       │  changed files + criteria
       ▼
┌──────────────┐     pass/fail       ┌──────────────┐
│   Reviewer   │ ──────────────────→ │ Orchestrator │
│  (verifies)  │                     │  (decides)   │
└──────────────┘                     └──────────────┘
```

1. Orchestrator reads `docs/tasks.json` and picks the first `"pending"` task.
2. Orchestrator asks Programmer to implement it.
3. Programmer implements and reports the changed files.
4. Orchestrator asks Reviewer to verify the changed files against the task's acceptance criteria.
5. Reviewer returns a pass/fail JSON report.
6. If all criteria pass → Orchestrator updates task status to `"done"`.
7. If any criteria fail → Orchestrator sends the task back to the Programmer.
8. When no pending tasks remain → Orchestrator reports completion.

## Available skills

| Skill | Description |
|---|---|
| `task-workflow` | Workflow for implementing tasks from `docs/tasks.json` using `/next-task`. |
| `localstorage-review` | Review guidelines for localStorage usage, null-safety, JSON.parse error handling, and key namespacing. |
| `minimal-usable-design` | Design principles for simple, accessible, responsive interfaces with minimal CSS. |
| `code-review` | Review code changes in the notes web app — acceptance criteria, existing features, readability, localStorage safety, minimal diffs. |

## Available commands

| Command | Description |
|---|---|
| `/next-task` | Picks the next pending task, implements it, verifies it, and marks it done on success. |
| `/review-current-task` | Re-verifies the most recently implemented task without re-implementation. |
