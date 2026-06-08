# Decisions

## Prefer controlled edits

Local small models can struggle with large edits and exact replacement schemas. This project uses `safe_edit` to read, replace and verify small line ranges.

## Keep context small

Do not load broad project context unless the task requires it.

## Use narrow subagents for noisy work

The Lite project keeps the main implementation agent small, but allows narrow subagents for isolated noisy work:

- `web_search` gathers compact sourced facts from the web.
- `web_quality` is syntax-only and is not part of the default generation flow; default HTML/CSS/JS verification uses `web_check_check_web`.
- `safe_editor` applies one pre-decided change to one file with `safe_edit`, verifies the file, and returns a compact result.
- `code_planner` analyzes existing code without editing and returns explicit local edit tasks.
- `result_checker` compares the user's request with observable final file state when the coordinator needs a read-only final-state check.
- `function_editor` applies one existing-function or small-block change.
- `code_editor` applies 2-4 coordinated changes in one existing file, such as a CSS selector plus a JavaScript function in one HTML file.

The editing subagents are not second implementation agents. The main agent or `code_planner` still decides what to change, and the main agent performs final verification.

## Prefer verifier-shaped feedback

Small local models improve when the harness turns failures into compact state feedback. Planner/editor handoffs should name preconditions, edit actions, expected results and verifiers. The wrapper reports failed requirement, expected action, observed actions and a repair hint when it rejects a run.

## Use contracts for planner and editor results

The `agent_contract` MCP validates planner and editor result shapes. It prevents read-only planners from claiming file changes and requires editor results that changed files to name safe_edit tools and verification.

## Do not add memory MCP by default

Persistent memory is useful for larger models and long-running agents, but this local project favors explicit instructions and validation after each step.
