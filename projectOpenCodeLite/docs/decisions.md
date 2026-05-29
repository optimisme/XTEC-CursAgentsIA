# Decisions

## Prefer controlled edits

Local small models can struggle with large edits and exact replacement schemas. This project uses `safe-edit` to read, replace and verify small line ranges.

## Keep context small

Do not load broad project context unless the task requires it.

## Use narrow subagents for noisy work

The Lite project keeps the main implementation agent small, but allows narrow subagents for isolated noisy work:

- `web-search` gathers compact sourced facts from the web.
- `web-quality` reviews generated HTML/CSS/JS and returns short blocking findings.
- `safe-editor` applies one pre-decided change to one file with `safe-edit`, verifies the file, and returns a compact result.

The `safe-editor` subagent is not a second implementation agent. The main agent still decides what to change, re-reads the file after the edit, and performs final verification.

## Do not add memory MCP by default

Persistent memory is useful for larger models and long-running agents, but this local project favors explicit instructions and validation after each step.
