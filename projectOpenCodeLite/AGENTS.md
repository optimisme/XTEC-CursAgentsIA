# Project Guidelines

Lite OpenCode setup for small local models.

## Workflow

- Read the relevant file before changing it.
- Keep context small; do not scan the whole project unless needed.
- Make the smallest change that satisfies the request.
- Create or modify only the requested files.
- Do not use subagents, broad shell access, memory workflows, npm installs, or invented validators.
- Verify changed files before reporting completion.

## Editing

- Use safe-edit MCP only; built-in `edit` is disabled.
- New files: create a short scaffold, then add small semantic chunks.
- Existing files: read lines, replace/insert/delete by line range, verify, then re-read before the next edit.
- Replace complete units in any language: markup element, selector rule, statement, function, handler, object property, or small block.
- Treat line numbers as stale after every write.
- Keep edit payloads small, about 25-50 short lines.

## Verification

- Run `safe-edit_safe_verify_file` on changed files.
- For HTML/CSS/JS, run `web-check_check_web` with `{"file":"webs/name.ext"}`.

## Final Response

- State what changed.
- State what was checked.
- Keep the answer short.
