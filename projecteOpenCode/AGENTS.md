# Project Guidelines

This project is the full OpenCode teaching example for larger models.

It demonstrates a richer setup with subagents, skills, commands, validation MCPs and optional project memory. Larger models can use more context and orchestration, but they must still keep edits focused and verify the result.

## Workflow

* Read files before editing.
* Read only relevant files.
* Check `tasks/pending.md` before starting planned project work.
* Read `docs/architecture.md` and `docs/decisions.md` before architectural changes.
* Search `memory/` only when prior project knowledge could help.
* Keep edits minimal.
* Split large edits into smaller operations.
* Verify changes before continuing.
* Update `tasks/done.md` and `tasks/pending.md` when task state changes.
* Propose memory updates only for reusable lessons, conventions or recurring errors.
* Keep responses concise.

## Editing

- Use the standard OpenCode edit tools for file modifications.
- Before editing, read the relevant target lines.
- Keep edits small and verifiable.
- Do not rewrite existing whole files unless the file is very small or explicitly requested.

## Tool call rules

- Before calling any tool, check the required arguments.
- If a tool call fails with a schema error, read the error and fix the exact missing field.
- Do not repeat the same invalid tool call.
- If a prompt contains conflicting constraints, preserve the most concrete constraints exactly as written and choose the smallest implementation that satisfies them.
- For interactive pages, games, or tools, wire every requested control to its expected direct behavior before validating. Do not leave placeholder behavior, TODO comments, or comments saying the core logic still needs refinement.
- Use subagents when they add useful review, planning, research, or verification coverage.
- Goal-checker is available for ambiguous prompts or nontrivial implementation plans.
- Use `web_search` for noisy external research, current facts, news, rankings, prices, dates, or web references that should be summarized before implementation.
- Do not use `explorer` for web research; it is for local file exploration.
- Use `web_quality` for read-only HTML/CSS/JS review after nontrivial frontend changes.
- When using the `task` tool, include `description`, `subagent_type`, and `prompt`.
- `webfetch` requires a URL.
- `websearch` requires a search query.
- If the user asks to search the internet, use `websearch` first. Use `webfetch` only for a specific URL from search results or from the user.
- If the user asks to cite a web source, put a visible source label and URL in the created page or document.
- For current web data, do not invent missing values. If search snippets do not contain the needed fields, use `webfetch` on a specific result URL.
- For ambiguous or conflicting prompts, make a short internal checklist and choose the smallest concrete interpretation that preserves explicit constraints.
- Do not stop after `glob` finds a target file; read it, edit it, verify it, and report the result.
- For HTML/CSS/JS changes, run `web_check_check_web` before claiming completion.
- Use the memory MCP as a source of hints, not as proof. Verify the current files before editing.
- Do not store secrets, credentials, personal data or temporary state in memory.
- Verify every changed file before claiming completion.
- For HTML/CSS/JS, run `web_check_check_web` after editing.
- End with 1-2 short lines, such as `Done: changed <files>. Verified: <checks>.`
- If blocked, end with `Stopped: <blocker>. Completed: <what changed or none>.`

## Stack

This is a teaching project without any programming tools, ignore this section here, on other projects it must contain folders structure, compilation or validation tools.

## Architecture

- `index.html`: main structure.
- `styles.css`: visual styles.
- `app.js`: application logic.
- `docs/`: durable architecture and decision notes.
- `tasks/`: persistent pending and completed tasks.
- `memory/`: curated memory for larger-model sessions.

## OpenCode

- Agents are in `.opencode/agents/`.
- Use the `goal_checker` subagent for ambiguous prompts or nontrivial new app plans before writing code.
- Use the `web_search` subagent for compact sourced web research.
- Use the `web_quality` subagent for compact read-only frontend quality review.
- Commands are in `.opencode/commands/`.
- MCPs are in `.opencode/mcp/`.
- Skills are in `.opencode/skills/`.
- Tools are in `.opencode/tools/`.
- The `memory` MCP can search, read and update files under `memory/`. 

## Rules

Keep the project simple. 
Do not add external dependencies. 
Ask before changing the architecture. 
Prefer small, focused changes.
