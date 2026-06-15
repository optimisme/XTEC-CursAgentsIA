# agent_contract MCP

Strict handoff contracts for OpenCode Lite subagents.

This MCP exposes schema-validated final tools for internal agent handoffs:

- `submit_plan`: read-only planner result. It must not claim file changes.
- `submit_edit_result`: editor result. Changed files require `safe_edit_*` tools and verification notes.

The tools return compact JSON and append accepted payloads to `.opencode/mcp/agent_contract/contracts.jsonl` for audit/debugging. That log is not used as the handoff mechanism; the tool call itself is the contract.

Run tests:

```sh
npm --prefix .opencode/mcp/agent_contract test
```
