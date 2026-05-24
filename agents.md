# Project Guidelines

## Workflow

* Read files before editing.
* Read only relevant files.
* Keep edits minimal.
* Split large edits into smaller operations.
* Verify changes before continuing.
* Keep responses concise.

## Safe Editing

- Use the safe-edit MCP for all file modifications whenever it is available.
- Do not use OpenCode edit/write tools for file modifications unless safe-edit is unavailable or explicitly requested.
- The built-in OpenCode edit permission is intentionally denied in `opencode.json`; use the safe-edit MCP tools instead of trying to edit files directly.
- In OpenCode, safe-edit MCP tools appear as `safe-edit_safe_read_lines`, `safe-edit_safe_apply_patch`, `safe-edit_safe_replace_lines`, `safe-edit_safe_insert_after`, `safe-edit_safe_delete_lines`, and `safe-edit_safe_verify_file`.
- Never replace code using exact old_text/new_text matching.
- Before editing, read the target lines with `safe-edit_safe_read_lines`.
- Pass safe-edit tool parameters as JSON arguments, for example `{"file":"app.js","start":1,"end":20}`.
- Use project-relative paths in the `file` argument whenever possible.
- Absolute paths are allowed only if they are inside the project root.
- Never use paths that escape the project root, such as `../other-project/file.js`.
- Treat `start`, `end`, and `line` as 1-based line numbers, except `safe_insert_after` may use `line: 0` to insert at the top.
- Edit only by line range or unified diff.
- After editing, verify the modified section with `safe-edit_safe_verify_file`.
- If line numbers are unclear, inspect the file again before editing.
- Keep edits small and verifiable.
- Do not rewrite whole files unless the file is very small or explicitly requested.
- Do not override or redefine OpenCode internal tools such as read, write, edit, bash, grep, or glob.

## Tool call rules

- Before calling any tool, check the required arguments.
- If a tool call fails with a schema error, read the error and fix the exact missing field.
- Do not repeat the same invalid tool call.
- `task` requires `description`.
- `webfetch` requires a URL.
- `websearch` requires a search query.
- In OpenCode, the websearch MCP tool appears as `websearch_websearch`.
- If the user asks to search the internet, use `websearch_websearch` first. Use `webfetch` only for a specific URL from search results or from the user.
- Do not stop after `glob` finds a target file; read it, edit it, verify it, and report the result.
- For HTML changes, run `html-check_check_html_js` on each changed HTML file before claiming completion.

## Stack

This is a teaching project without any programming tools, ignore this section here, on other projects it must contain folders structure, compilation or validation tools.

## Architecture

- `index.html`: main structure.
- `styles.css`: visual styles.
- `app.js`: application logic.

## OpenCode

- Agents are in `.opencode/agents/`.
- Commands are in `.opencode/commands/`.
- MCPs are in `.opencode/mcp/`.
- Skills are in `.opencode/skills/`.
- Tools are in `.opencode/tools/`.

## Visual references

- Swiss railway clock style: white circular face, black minute ticks, heavier hour ticks, black rectangular hour and minute hands, and a thin red second hand with a red circular disc near its tip.
- Canvas clock angles: 12 o'clock is at the top; minutes and seconds use `value / 60 * 2 * Math.PI - Math.PI / 2`; hours use `((hour % 12) + minutes / 60) / 12 * 2 * Math.PI - Math.PI / 2`.

## Rules

Keep the project simple. 
Do not add external dependencies. 
Ask before changing the architecture. 
Prefer small, focused changes.
