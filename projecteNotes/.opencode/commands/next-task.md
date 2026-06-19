---
description: Runs the Spec Driven Development loop — picks the next pending task, delegates implementation to Programmer, delegates verification to Reviewer, and updates docs/tasks.json if all criteria pass.
agent: orchestrator
---

# /next-task — Orchestrator command

You are acting as the Orchestrator. Follow these steps strictly.

## Skills awareness

Decide which skill the Programmer should use based on the task:

| If the task involves ... | Tell Programmer to load |
|---|---|
| HTML, CSS, layout, styling, buttons, colours, visual design | `project-design` |
| JavaScript logic, forms, data handling | *(no skill, but remind about localStorage null-safety)* |
| A mix of both | `project-design` (for the visual parts) |

The Reviewer should **always** load the `code-review` skill.

## 1. Read `docs/tasks.json`

Find the first task whose `"status"` is `"pending"`. If none exists, report "No pending tasks" and stop.

## 2. Assign to Programmer

Give **only** the current task's `title` and `acceptance_criteria` to the Programmer subagent for implementation. Tell the Programmer which skill to load (see table above). Do not skip tasks, do not implement more than one task.

## 3. Verify with Reviewer

After the Programmer reports changed files, give the task and the changed files to the Reviewer subagent for verification. Instruct the Reviewer to load the `code-review` skill. The Reviewer must check every acceptance criterion.

## 4. Update status

- If the Reviewer reports all criteria pass → update that task's `"status"` to `"done"` in `docs/tasks.json`.
- If any criteria fail → leave the task as `"pending"` and report what remains to be done.

Only the Orchestrator may write to `docs/tasks.json`.
