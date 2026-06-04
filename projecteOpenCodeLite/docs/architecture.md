# Architecture

This is the local-model version of the OpenCode teaching project.

It is designed for small local models with limited reasoning and output budget.

The project keeps the workflow simple:

- one primary agent: `goal_lite`;
- two narrow read-only subagents: `web_search` and `web_quality`;
- one narrow write-capable subagent: `safe_editor` for one-file safe_edit patches;
- no built-in edit tool;
- file changes through the `safe_edit` MCP;
- Web validation through the `web_check` MCP.
