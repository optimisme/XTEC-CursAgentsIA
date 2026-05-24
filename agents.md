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
- Never replace code using exact old_text/new_text matching.
- Before editing, read the target lines with safe_read_lines.
- Edit only by line range or unified diff.
- After editing, verify the modified section with safe_verify_file.
- If line numbers are unclear, inspect the file again before editing.
- Keep edits small and verifiable.
- Do not rewrite whole files unless the file is very small or explicitly requested.
- Do not override or redefine OpenCode internal tools such as read, write, edit, bash, grep, or glob.

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

## Rules

Keep the project simple. 
Do not add external dependencies. 
Ask before changing the architecture. 
Prefer small, focused changes.
