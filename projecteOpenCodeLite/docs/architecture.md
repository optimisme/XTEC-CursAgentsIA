# Architecture

This is the local-model version of the OpenCode teaching project.

It is designed for small local models with limited reasoning and output budget.

The project keeps the workflow simple:

- one primary agent: `goal_lite`;
- narrow read-only subagents: `web_search`, syntax-only `web_quality` for explicit review requests, `code_planner`, and final-state `result_checker`;
- three narrow write-capable subagents: `safe_editor` for one-file creation/simple edits, `function_editor` for one function/block, and `code_editor` for 2-4 coordinated blocks in one file;
- no built-in edit tool;
- file changes through the `safe_edit` MCP;
- Web validation through the `web_check` MCP;
- structured planner/editor contracts through the `agent_contract` MCP.
