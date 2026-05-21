---
name: security
description: Basic frontend and Node.js security review for web projects.
---

# Basic Web Security Skill

Use this skill when the user asks to review security, detect unsafe code, or improve basic protection in a web project.

## Check

### Frontend

- Avoid inserting untrusted content with `innerHTML`.
- Prefer `textContent` for user-provided text.
- Validate user input before using it.
- Do not expose secrets in client-side code.

### Links

- External links opened with `target="_blank"` should use `rel="noopener noreferrer"`.

### Forms

- Validate input on the server when there is a backend.
- Do not trust client-side validation alone.

### Node.js

- Do not commit `.env` files.
- Do not expose API keys.
- Avoid unsafe use of `eval`, dynamic imports or shell commands.
- Check that server routes validate received data.

### Dependencies

- Avoid adding unnecessary dependencies.
- Prefer maintained packages.

## Output

Return:

1. Security risks found.
2. Severity: low, medium or high.
3. Concrete fix.
4. Files affected.

## Rules

- Do not add security libraries unless explicitly requested.
- Do not make destructive changes.
- Ask before changing authentication or authorization logic.