# Decisions

## Prefer controlled edits

Local small models can struggle with large edits and exact replacement schemas. This project uses `safe-edit` to read, replace and verify small line ranges.

## Keep context small

Do not load broad project context unless the task requires it.

## Do not add memory MCP by default

Persistent memory is useful for larger models and long-running agents, but this local project favors explicit instructions and validation after each step.
