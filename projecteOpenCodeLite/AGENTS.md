# Project Guidelines

Lite OpenCode setup for small local models.

## Workflow

- Read the relevant file before changing it.
- Keep context small; do not scan the whole project unless needed.
- Make the smallest change that satisfies the request.
- Create or modify only the requested files.
- Use subagents only for focused web research, read-only web quality review, or one-file safe_edit patches.
- If you say you will use a tool or subagent, the next assistant action must be the actual tool call. Do not narrate intended tool calls as plain text.
- Do not use broad shell access, memory workflows, npm installs, or invented validators.
- Verify changed files before reporting completion.
- For image prompts such as `@pic.png`, use `image_vision_describe`; OpenCode may not pass image attachments to the model directly.

## Editing

- Use the safe_edit MCP only; built-in `edit` is disabled.
- Use underscore tool names such as `safe_edit_safe_create_file` and `safe_edit_safe_create_file_from_lines`.
- For file changes, delegate to `safe_editor` with the `task` tool, then verify or validate the result as needed.
- The `safe_editor` subagent applies one-file changes with safe_edit.
- The main agent still decides the change, re-reads the file, and performs final verification.
- New self-contained HTML files: create the complete requested file in one `safe_edit_safe_create_file` call, then verify it. Do not create a scaffold first.
- New simple text files: create the complete file in one `safe_edit_safe_create_file_from_lines` call, then verify it.
- Existing files with one edit: read lines, replace/insert/delete one complete unit, verify, then stop or re-read before the next edit.
- Existing files with multiple edits: prefer one `safe_edit_safe_apply_patch` patch with context instead of several line-number edits.
- If using line-number edit tools more than once, call `safe_edit_safe_verify_file` or `safe_edit_safe_read_lines` after every write and base the next edit only on the returned line numbers.
- Never use line numbers remembered from before a write.
- Replace complete units in any language: markup element, selector rule, statement, function, handler, object property, or small block.
- Keep edit payloads small, about 25-50 short lines.
- In `safe_edit_safe_create_file_from_lines`, each `lines` item must be one physical file line. Do not put embedded newlines inside one array item.
- For larger existing files, use small semantic chunks only when a single complete patch would be too risky.

## Verification

- Run `safe_edit_safe_verify_file` on changed files.
- Compare the verified content against the requested change before reporting completion.
- For HTML/CSS/JS, run `web_check_check_web` with `{"file":"webs/name.ext"}` after safe verification.
- For nontrivial HTML/CSS/JS work, ask the `web_quality` subagent for a read-only review before final.
- If the prompt requires internet research and also asks for a new file, ask the `web_search` subagent for compact sourced facts, then ask `safe_editor` to create the requested file. Do not call web or safe_edit tools directly in the main implementation agent.
- When using the `task` tool, include `description`, `subagent_type`, and `prompt`.
- Use `safe_editor` only when the prompt names one file; it may create a complete new self-contained HTML file or apply a scoped one-file edit.
- Do not report completion until all changed files have been verified.

## Final Response

- State what changed.
- State what was checked.
- Keep the answer short.
