# Architecture

This is the local-model version of the OpenCode teaching project.

It is designed for small local models with limited reasoning and output budget.

The project keeps the workflow simple:

- one primary agent: `goal-lite`;
- no subagents;
- no built-in edit tool;
- file changes through the `safe-edit` MCP;
- HTML validation through the `html-check` MCP.
