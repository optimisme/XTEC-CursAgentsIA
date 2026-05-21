# Project Guidelines

## Workflow

Before architectural changes, read `docs/architecture.md` and `docs/decisions.md`.

Before starting work, check `tasks/pending.md`.

After finishing work, update `tasks/done.md` and `tasks/pending.md`.

## Stack

HTML, CSS and vanilla JavaScript only.

No frameworks, no npm dependencies, no build step.

Use `bun run dev` to start the development server. Do not use `node` unless explicitly requested.

## Architecture

- `index.html`: main structure.
- `styles.css`: visual styles.
- `app.js`: application logic.

## OpenCode

- Agents are in `.opencode/agents/`.
- Skills are in `.opencode/skills/`.
- Commands are in `.opencode/commands/`.
- Tools are in `.opencode/tools/`.

Available agents: `reviewer`, `frontend-designer`, `accessibility`, `responsive`, `performance`, `security`, `seo`.

Use the matching skill for each agent: `code-review`, `frontend-design`, `accessibility`, `responsive`, `performance`, `security`, `seo`.

Available command: `supercommit`.

Available tool: `search-students`.

## Rules

Keep the project simple. Do not add external dependencies. Ask before changing the architecture. Prefer small, focused changes.