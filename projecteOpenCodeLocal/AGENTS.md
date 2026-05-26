# Project Guidelines

This project is the local-model OpenCode teaching example.

It is designed for a small local model, so the workflow is intentionally narrower than `projecteOpenCode`: no subagents, no built-in edit tool, no broad shell access and no persistent memory MCP by default.

## Workflow

- Read the relevant file before changing it.
- Keep context small. Do not scan the whole project unless needed.
- Read `docs/architecture.md` or `docs/decisions.md` only when the user asks for architectural or workflow changes.
- Make the smallest change that satisfies the request.
- For new files, create the complete file directly.
- For existing files, edit small exact sections.
- If the user names exact files, create or modify only those files.
- Do not create unrelated demo files, sample files, or alternate app files.
- Do not use subagents.
- Search for information before creating or modifying files only if it is necessary to satisfy the request.
- Do not browse the web for routine implementation details.
- Verify changed files before reporting completion.
- Do not invent validation tools or npm packages.

## Local Model Constraints

- Model is a small local 8 billion paramenters agent with a 32K context window and 4096 output tokens.
- Avoid long plans, large pasted context, and multi-agent decomposition.
- Prefer one direct implementation pass plus one verification pass.
- Do not narrate long plans. Act directly with the available tools.
- Use concise tool arguments and avoid sending unnecessary file content back to the model.
- If a task is a small web app, create exactly the requested files and stop after verification.
- Do not use persistent memory workflows unless the user explicitly asks for that experiment.

## Editing

- Use the safe-edit MCP for file modifications.
- Do not use OpenCode built-in `edit`; it is disabled in this lite project because local Gemma often fails the `oldString` schema.
- In OpenCode, safe-edit MCP tools appear as `safe-edit_safe_create_file_from_lines`, `safe-edit_safe_read_lines`, `safe-edit_safe_replace_lines`, `safe-edit_safe_insert_after`, `safe-edit_safe_delete_lines`, `safe-edit_safe_apply_patch`, and `safe-edit_safe_verify_file`.
- For new files, use `safe-edit_safe_create_file_from_lines`, then verify with `safe-edit_safe_verify_file`.
- For existing files, read line numbers with `safe-edit_safe_read_lines`, then replace by line range with `safe-edit_safe_replace_lines`.
- Do not use exact old-string replacement workflows.
- For new browser pages, prefer one self-contained HTML file unless the user asks for multiple files.
- For large generated HTML, create or replace the whole file instead of making many tiny edits.
- Keep safe-edit calls small. For long HTML files, create a scaffold first and add or replace content in chunks.
- When the user asks for multiple files, create exactly those files and keep each file focused.
- For three-file web apps, create the HTML, CSS, and JavaScript files separately with safe-edit. Do not merge them into one file unless asked.

## Verification

- Use only commands that are already available in this project or standard shell commands.
- Do not run `npx html-checker`, `npm install`, or package-based validators unless the package already exists in this project.
- For HTML files, use the local HTML checker MCP tool: `html-check_check_html`.
- The HTML checker argument is `{"file":"webs/name.html"}`.
- After changing HTML, run `html-check_check_html` on the changed HTML file before final response.
- For non-HTML files, use safe-edit verification or read relevant lines.
- Do not use `npx html-checker`; it is not a package in this project.

## Final Response

- State what changed.
- State what was checked.
- Keep the answer short.
