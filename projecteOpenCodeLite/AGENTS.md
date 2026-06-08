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
- For new files and trivial one-file text/style edits, delegate to `safe_editor` with the `task` tool; `safe_editor` verifies its own file with safe_edit.
- For behavioral `modify @existing-file` requests, debugging, or improving existing code, first call `code_planner`, then pass its explicit local instructions to `function_editor` or `code_editor`.
- The `code_planner` subagent is read-only and proposes the smallest scoped fix.
- The `function_editor` subagent applies one existing-function or small-block change with safe_edit.
- The `code_editor` subagent applies 2-4 coordinated small block changes in one existing file with safe_edit.
- The `safe_editor` subagent applies one-file creation or simple one-file changes with safe_edit.
- When using planner/editor subagents, prefer compact action reasoning: `preconditions`, `expected_result`, and `verify`. Do not ask for long reasoning traces.
- For multi-file HTML/CSS/JS apps, call `safe_editor` once per file in this order: HTML, CSS, JS.
- After each editor task, the coordinator must verify the expected target file exists with `read` or `glob`; do not trust subagent prose alone.
- For separate HTML/CSS/JS apps, confirm each file has the expected kind before final `web_check`: HTML markup in `.html`, CSS rules in `.css`, and JavaScript code in `.js`.
- The main agent still decides the change, re-reads the file, and performs final verification.
- Before calling an editing subagent, compress the request to file, target unit, exact edits, preserved behavior, and verification. Do not include abandoned alternatives.
- New self-contained HTML files: create the complete requested file in one `safe_edit_safe_create_file` call, then verify it. Do not create a scaffold first.
- New simple text files: create the complete file in one `safe_edit_safe_create_file_from_lines` call, then verify it.
- Existing files: use small current-line edits. Prefer `safe_edit_safe_replace_lines` for replacements; use `safe_edit_safe_delete_lines` or `safe_edit_safe_insert_lines` only for pure deletion or pure insertion.
- Every editor prompt should put the exact target path first, as `file: webs/name.ext`. Editing subagents must use exactly that path for every safe_edit call.
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
- Treat verifier output as state feedback. If validation fails, identify the failed invariant, make one smallest repair, verify again, and stop with a blocker if the same invariant fails twice.
- If any `.html`, `.css`, or `.js` file changed, run `web_check_check_web` with `{"file":"webs/name.html"}` on the HTML entry file after safe verification.
- For HTML/CSS/JS work, run `web_check_check_web` on the HTML entry file before final even if the user did not explicitly ask for it. Do not call `web_quality` unless the user explicitly asks for an extra syntax-only review.
- If the prompt requires internet research and also asks for a new file, ask the `web_search` subagent for compact sourced facts, then ask `safe_editor` to create the requested file. Do not call web or safe_edit tools directly in the main implementation agent.
- When using the `task` tool, include `description`, `subagent_type`, and `prompt`.
- Use `safe_editor` only when the prompt names one file; it may create a complete new self-contained HTML file or apply a simple scoped one-file edit.
- Use `code_planner` for existing-code fixes, behavioral bugs, refactors, or unclear programming modifications.
- Use `result_checker` only when final observable state is ambiguous after edits or validator feedback contradicts subagent prose. It is read-only and does not replace `web_check_check_web`.
- Use `function_editor` only for JavaScript functions, methods, handlers, or similarly named code blocks. Do not use it for CSS selectors.
- Use `code_editor` for CSS-only edits in existing HTML/CSS files, and for 2-4 coordinated target selector/function/block edit tasks in one file.
- If a plan contains several coordinated changes in one file, prefer one `code_editor` call with atomic tasks. If the changes all replace one function body, one `function_editor` call is preferred.
- Do not call `safe_editor` twice for the same file in one user request unless the user explicitly asks for a second edit.
- For existing-code repair, multiple `function_editor` calls on the same file are allowed only when each call targets a distinct planned function/block or the user explicitly asks for a follow-up edit.
- Do not report completion until all changed files have been verified.

## Action Preconditions

- Before `safe_editor`: exactly one target file is named, the change is a new file or trivial text/style replacement, and the prompt starts with `file: ...`.
- Before `code_planner`: the target is existing code and the requested change is behavioral, animation/timing-related, unclear, or needs a scoped edit plan.
- Before `function_editor`: one existing function, handler, method, or small code block has been identified, and the task is not CSS-only.
- Before `code_editor`: one existing file has 2-4 coordinated target blocks, selectors, functions, or handlers to edit.
- Before final: every requested file exists, each file kind matches its extension, changed files were verified, and HTML/CSS/JS entry files passed `web_check_check_web`.

## Final Response

- State what changed.
- State what was checked.
- Keep the answer short.

## Task Tool Contract

- When using `task`, pass exactly three fields: `description`, `subagent_type`, and `prompt`.
- Do not include `command`, `file`, `target`, `agent`, `action`, or any other top-level field in a `task` call.
- `description` must be 3-8 plain words.
- `subagent_type` must be exactly one available subagent name, such as `safe_editor`, `code_planner`, `code_editor`, `function_editor`, `result_checker`, `web_search`, or `web_quality`.
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
preconditions:
- webs/slider.html exists and contains the .tile rule.
expected_result:
- Tile positions animate without changing game logic.
preserve: existing HTML and game logic.
verify: safe_edit verify file.
```

Preferred handoffs use this same compact shape: `file`, `goal`, `preconditions`, `tasks`, `expected_result`, `preserve`, and `verify`.
