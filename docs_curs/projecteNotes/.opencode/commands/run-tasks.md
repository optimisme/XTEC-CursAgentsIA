---
description: Repeatedly run the /next-task workflow until there are no pending tasks or a task fails.
agent: orchestrator
---

# /run-tasks Command

Act as the Orchestrator.
This command must reuse the exact workflow defined in `.opencode/commands/next-task.md`.

Loop:
1. Read `.opencode/commands/next-task.md`.
2. Run one full `/next-task` cycle.
3. Re-read `docs/tasks.json`.
4. If there are no tasks with `"status": "pending"`, report completion and stop.
5. If the last `/next-task` cycle failed, stop and report the failure.
6. Otherwise, repeat.

Safety limits:
- Stop after 10 completed tasks in one run.
- Never work on more than one task at a time.
- Re-read `docs/tasks.json` before every cycle.
- Do not duplicate or override `/next-task` rules.

