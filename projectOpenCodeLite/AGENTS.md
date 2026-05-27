# Project Guidelines

Lite OpenCode setup for small local models.

## Workflow

- Read the relevant file before changing it.
- Keep context small; do not scan the whole project unless needed.
- Make the smallest change that satisfies the request.
- Create or modify only the requested files.
- Use subagents only for focused web research or read-only web quality review.
- Do not use broad shell access, memory workflows, npm installs, or invented validators.
- Verify changed files before reporting completion.

## Editing

- Use safe-edit MCP only; built-in `edit` is disabled.
- New files: create a short scaffold, verify it, then add small semantic chunks.
- Existing files: read lines, replace/insert/delete by line range, verify, then re-read before the next edit.
- Replace complete units in any language: markup element, selector rule, statement, function, handler, object property, or small block.
- Treat line numbers as stale after every write.
- Keep edit payloads small, about 25-50 short lines.
- In `safe-edit_safe_create_file_from_lines`, each `lines` item must be one physical file line. Do not put embedded newlines inside one array item.
- For larger JavaScript files, create a minimal scaffold first and add functions in small chunks.

## Verification

- Run `safe-edit_safe_verify_file` on changed files.
- For HTML/CSS/JS, run `web-check_check_web` with `{"file":"webs/name.ext"}` after safe verification.
- For nontrivial HTML/CSS/JS work, ask the `web-quality` subagent for a read-only review before final.
- If the prompt requires internet research, ask the `web-search` subagent for compact sourced facts before editing.
- When using the `task` tool, include `description`, `subagent_type`, and `prompt`.
- Do not report completion until all changed files have been verified.

## Final Response

- State what changed.
- State what was checked.
- Keep the answer short.
