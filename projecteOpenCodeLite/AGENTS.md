# Project Guidelines

Lite OpenCode setup for small local models.

## Workflow

- Read the relevant file before changing it.
- Keep context small; do not scan the whole project unless needed.
- Make the smallest change that satisfies the request.
- Create or modify only the requested files.
- Use subagents only for focused web research, read-only web quality review, or one-file safe-edit patches.
- Do not use broad shell access, memory workflows, npm installs, or invented validators.
- Verify changed files before reporting completion.

## Editing

- Use safe-edit MCP only; built-in `edit` is disabled.
- For isolated one-file changes, the `safe-editor` subagent may apply a pre-decided patch with safe-edit.
- The main agent still decides the change, re-reads the file, and performs final verification.
- New files: create a short scaffold, verify it, then add small semantic chunks.
- Existing files with one edit: read lines, replace/insert/delete one complete unit, verify, then stop or re-read before the next edit.
- Existing files with multiple edits: prefer one `safe-edit_safe_apply_patch` patch with context instead of several line-number edits.
- If using line-number edit tools more than once, call `safe-edit_safe_verify_file` or `safe-edit_safe_read_lines` after every write and base the next edit only on the returned line numbers.
- Never use line numbers remembered from before a write.
- Replace complete units in any language: markup element, selector rule, statement, function, handler, object property, or small block.
- Keep edit payloads small, about 25-50 short lines.
- In `safe-edit_safe_create_file_from_lines`, each `lines` item must be one physical file line. Do not put embedded newlines inside one array item.
- For larger JavaScript files, create a minimal scaffold first and add functions in small chunks.

## Verification

- Run `safe-edit_safe_verify_file` on changed files.
- Compare the verified content against the requested change before reporting completion.
- For HTML/CSS/JS, run `web-check_check_web` with `{"file":"webs/name.ext"}` after safe verification.
- For nontrivial HTML/CSS/JS work, ask the `web-quality` subagent for a read-only review before final.
- If the prompt requires internet research, ask the `web-search` subagent for compact sourced facts before editing.
- When using the `task` tool, include `description`, `subagent_type`, and `prompt`.
- Use `safe-editor` only when the prompt names one file and one exact small edit; do not delegate broad implementation work.
- Do not report completion until all changed files have been verified.

## Final Response

- State what changed.
- State what was checked.
- Keep the answer short.
