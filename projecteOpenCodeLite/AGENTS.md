# Project Guidelines

Lite OpenCode setup for small local models.

## Workflow

- Read the relevant file before changing it.
- Keep context small; do not scan the whole project unless needed.
- Make the smallest change that satisfies the request.
- Create or modify only the requested files.
- Use subagents only for focused web research, read-only web quality review, image inspection, or scoped safe_edit file changes.
- If you say you will use a tool or subagent, the next assistant action must be the actual tool call. Do not narrate intended tool calls as plain text.
- Do not use broad shell access, memory workflows, npm installs, or invented validators.
- Verify changed files before reporting completion.
- Use `image_vision_describe` only when the user includes an explicit local image path such as `@pic.png`, `calculator.png`, `images/mockup.jpg`, `.jpeg`, `.webp`, or `.gif`.
- Do not use `image_vision_describe` for ordinary visual styling, animation, layout, colors, or polished appearance requests unless an actual image file path is named.

## Editing

- Use the safe_edit MCP only; built-in `edit` is disabled.
- Use underscore tool names such as `safe_edit_safe_create_file`, `safe_edit_safe_create_file_from_lines`, and `safe_edit_safe_overwrite_file`.
- For file changes, delegate to `safe_editor` with the `task` tool; `safe_editor` verifies its own file with safe_edit.
- The `safe_editor` subagent applies one-file changes with safe_edit.
- For multi-file HTML/CSS/JS apps, call `safe_editor` once per file in this order: HTML, CSS, JS.
- The main agent still decides the change, re-reads the file, and performs final verification.
- New self-contained HTML files: create the complete requested file in one `safe_edit_safe_create_file` call, then verify it. Do not create a scaffold first.
- New simple text files: create the complete file in one `safe_edit_safe_create_file_from_lines` call, then verify it.
- Existing files: inspect the current file, write the complete replacement content with `safe_edit_safe_overwrite_file`, verify, then stop.
- For very long existing files or explicitly surgical edits, use only `safe_edit_safe_insert_lines` and `safe_edit_safe_delete_lines`.
- Do not use replace, append, patch, or built-in edit tools in Lite.
- If using insert/delete lines, call `safe_edit_safe_verify_file` first and base the edit only on those returned line numbers.
- Verify again after every insert/delete write before doing another line-number edit.
- Never use line numbers remembered from before a write.
- In `safe_edit_safe_create_file_from_lines`, each `lines` item must be one physical file line. Do not put embedded newlines inside one array item.
- For larger existing files, prefer complete overwrite when practical; otherwise use current-line add/delete operations.

## Verification

- Do not call `safe_edit_safe_verify_file` from the main coordinator; `safe_editor` handles safe verification.
- Compare the `safe_editor` result against the requested change before reporting completion.
- For HTML/CSS/JS, run `web_check_check_web` with `{"file":"webs/name.ext"}` after safe verification.
- For nontrivial HTML/CSS/JS work, ask the `web_quality` subagent for a read-only review before final.
- If the prompt requires internet research and also asks for a new file, ask the `web_search` subagent for compact sourced facts, then ask `safe_editor` to create the requested file. Do not call web or safe_edit tools directly in the main implementation agent.
- When using the `task` tool, include `description`, `subagent_type`, and `prompt`.
- Use `safe_editor` only when the prompt names one file; it may create a complete new self-contained HTML file or apply a scoped one-file edit.
- Do not call `safe_editor` twice for the same file in one user request unless the user explicitly asks for a second edit.
- Do not report completion until all changed files have been verified.

## Final Response

- State what changed.
- State what was checked.
- Keep the answer short.
