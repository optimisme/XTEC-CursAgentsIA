# Decisions

## Keep examples small

The project is used for teaching agents, tools and MCPs. Examples should stay small enough to inspect and validate during class.

## Use project documentation for durable knowledge

Stable decisions belong in `docs/` or `AGENTS.md`, not only in chat history.

## Use memory for reusable but evolving knowledge

The `memory/` folder stores curated notes that can help future sessions. Memory is a hint, not a replacement for reading the current code.

## Use narrow subagents for noisy web work

Use `web-search` to gather compact sourced facts before implementation when internet research is needed.
Use `web-quality` to review generated HTML/CSS/JS without mixing noisy inspection into the main goal context.
