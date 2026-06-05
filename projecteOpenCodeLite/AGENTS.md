# Project Guidelines

Lite OpenCode setup for small local models.

## Workflow

- Read the relevant file before changing it.
- Keep context small; do not scan the whole project unless needed.
- Make the smallest change that satisfies the request.
- Create or modify only the requested files.
- Use subagents only for focused web research, read-only web/code review, image inspection, or scoped safe_edit file changes.
- If you say you will use a tool or subagent, the next assistant action must be the actual tool call. Do not narrate intended tool calls as plain text.
- Never write literal pseudo-tool syntax such as `<|tool_call>`, `<tool_call|>`, `call:task`, or JSON-looking tool calls in assistant text. If a tool is needed, invoke the actual tool.
- Do not pass exploratory reasoning, conflicting calculations, or long analysis prose to editing subagents. Convert decisions into short explicit edit instructions first.
- Do not use broad shell access, memory workflows, npm installs, or invented validators.
- Verify changed files before reporting completion.
- Use `image_vision_describe` only when the user includes an explicit local image path such as `@pic.png`, `calculator.png`, `images/mockup.jpg`, `.jpeg`, `.webp`, or `.gif`.
- Do not use `image_vision_describe` for ordinary visual styling, animation, layout, colors, or polished appearance requests unless an actual image file path is named.

## Editing

- Use the safe_edit MCP only; built-in `edit` is disabled.
- Use underscore tool names such as `safe_edit_safe_create_file`, `safe_edit_safe_create_file_from_lines`, `safe_edit_safe_replace_lines`, `safe_edit_safe_insert_lines`, and `safe_edit_safe_delete_lines`.
- For new files and simple one-file edits, delegate to `safe_editor` with the `task` tool; `safe_editor` verifies its own file with safe_edit.
- For debugging or improving existing code, first call `code_planner`, then pass its explicit local instructions to `function_editor` or `code_editor`.
- The `code_planner` subagent is read-only and proposes the smallest scoped fix.
- The `function_editor` subagent applies one existing-function or small-block change with safe_edit.
- The `code_editor` subagent applies 2-4 coordinated small block changes in one existing file with safe_edit.
- The `safe_editor` subagent applies one-file creation or simple one-file changes with safe_edit.
- For multi-file HTML/CSS/JS apps, call `safe_editor` once per file in this order: HTML, CSS, JS.
- The main agent still decides the change, re-reads the file, and performs final verification.
- Before calling an editing subagent, compress the request to file, target unit, exact edits, preserved behavior, and verification. Do not include abandoned alternatives.
- New self-contained HTML files: create the complete requested file in one `safe_edit_safe_create_file` call, then verify it. Do not create a scaffold first.
- New simple text files: create the complete file in one `safe_edit_safe_create_file_from_lines` call, then verify it.
- Existing files: use small current-line edits. Prefer `safe_edit_safe_replace_lines` for replacements; use `safe_edit_safe_delete_lines` or `safe_edit_safe_insert_lines` only for pure deletion or pure insertion.
- To modify content, delete the current old lines, verify if another edit is needed, then insert the new physical lines at the current position.
- For existing files, do not use any editing method other than `safe_edit_safe_replace_lines`, `safe_edit_safe_delete_lines`, and `safe_edit_safe_insert_lines`.
- If using insert/delete lines, call `safe_edit_safe_verify_file` first and base the edit only on those returned line numbers.
- Verify again after every insert/delete write before doing another line-number edit.
- Never use line numbers remembered from before a write.
- In `safe_edit_safe_create_file_from_lines`, each `lines` item must be one physical file line. Do not put embedded newlines inside one array item.
- For larger existing files, keep edits bounded and localized. If the requested change is a code repair, use `code_planner` before editing. If it cannot be reduced to a small function/block change, report a blocker.

## Verification

- Do not call `safe_edit_safe_verify_file` from the main coordinator; editing subagents handle safe verification.
- Compare the editing subagent result against the requested change before reporting completion.
- For HTML/CSS/JS, run `web_check_check_web` with `{"file":"webs/name.ext"}` after safe verification.
- For HTML/CSS/JS work, run `web_check_check_web` on the HTML entry file before final. Do not call `web_quality` unless the user explicitly asks for an extra syntax-only review.
- If the prompt requires internet research and also asks for a new file, ask the `web_search` subagent for compact sourced facts, then ask `safe_editor` to create the requested file. Do not call web or safe_edit tools directly in the main implementation agent.
- When using the `task` tool, include `description`, `subagent_type`, and `prompt`.
- Use `safe_editor` only when the prompt names one file; it may create a complete new self-contained HTML file or apply a simple scoped one-file edit.
- Use `code_planner` for existing-code fixes, behavioral bugs, refactors, or unclear programming modifications.
- Use `function_editor` only for JavaScript functions, methods, handlers, or similarly named code blocks. Do not use it for CSS selectors.
- Use `code_editor` for CSS-only edits in existing HTML/CSS files, and for 2-4 coordinated target selector/function/block edit tasks in one file.
- If a plan contains several coordinated changes in one file, prefer one `code_editor` call with atomic tasks. If the changes all replace one function body, one `function_editor` call is preferred.
- Do not call `safe_editor` twice for the same file in one user request unless the user explicitly asks for a second edit.
- For existing-code repair, multiple `function_editor` calls on the same file are allowed only when each call targets a distinct planned function/block or the user explicitly asks for a follow-up edit.
- Do not report completion until all changed files have been verified.

## Final Response

- State what changed.
- State what was checked.
- Keep the answer short.

## Task Tool Contract

- When using `task`, pass exactly three fields: `description`, `subagent_type`, and `prompt`.
- Do not include `command`, `file`, `target`, `agent`, `action`, or any other top-level field in a `task` call.
- `description` must be 3-8 plain words.
- `subagent_type` must be exactly one available subagent name, such as `safe_editor`, `code_planner`, `code_editor`, `function_editor`, `web_search`, or `web_quality`.
- `prompt` must be plain text. Do not include `<|`, `|>`, `<tool_call`, `call:`, or fake tool-call delimiters.
- For CSS in existing files, use `code_editor`, not `function_editor`.
- Valid shape:

```text
description: Smooth tile movement
subagent_type: code_editor
prompt:
file: webs/slider.html
goal: Make puzzle tiles move smoothly when positions change.
tasks:
1. target: .tile CSS rule; edit: set transition for left/top/transform movement.
preserve: existing HTML and game logic.
verify: safe_edit verify file.
```
