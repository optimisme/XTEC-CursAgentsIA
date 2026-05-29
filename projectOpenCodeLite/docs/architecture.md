# Architecture

This is the local-model version of the OpenCode teaching project.

It is designed for small local models with limited reasoning and output budget.

The project keeps the workflow simple:

- one primary agent: `goal-lite`;
- two narrow read-only subagents: `web-search` and `web-quality`;
- one narrow write-capable subagent: `safe-editor` for one-file safe-edit patches;
- no built-in edit tool;
- file changes through the `safe-edit` MCP;
- Web validation through the `web-check` MCP.
