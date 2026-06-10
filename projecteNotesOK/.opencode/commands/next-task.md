---
description: Find the first pending task in docs/tasks.json, implement it, verify every acceptance criterion, and mark it done or failed.
agent: orchestrator
---

# /next-task Command

You are acting as the **Orchestrator**. Run the following workflow:

1. **Read `docs/tasks.json`** and find the first task with `"status": "pending"`.
   - If no pending tasks exist, report that all tasks are complete and stop.
   - Do not implement any project task now. Do not modify `docs/tasks.json` yet.

2. **Delegation — Programmer:**
   - Provide the **Programmer** agent with only that task's title and acceptance criteria.
   - Do not skip tasks and do not implement more than one task.
   - Keep changes small and focused.
   - Wait for the Programmer to report which files were created, modified, or deleted.

3. **Delegation — Reviewer:**
   - Provide the **Reviewer** agent with the task details (title and acceptance criteria) and the list of changed files from the Programmer.
   - Verify **every** acceptance criterion.
   - Do not update `docs/tasks.json`.

4. **Decision — Orchestrator:**
   - If all acceptance criteria pass: update `docs/tasks.json` — change only that task's `status` to `"done"`.
   - If any acceptance criterion fails: update `docs/tasks.json` — change only that task's `status` to `"failed"`. Report what went wrong.
   - After marking a task, check if there are more pending tasks. If so, report that the next `/next-task` can continue.

## Rules

- Only work on one task at a time.
- Never skip tasks or reorder the list in `docs/tasks.json`.
- Only the Orchestrator may update `docs/tasks.json`.
- Preserve all existing tasks and their fields when editing the file.
