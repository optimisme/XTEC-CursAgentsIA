# memory MCP

Local MCP server for curated project memory.

The server only reads and writes inside the configured memory directory. By default, that directory is:

```text
memory
```

## Tools

- `memory_search`: search text memories by query.
- `memory_read`: read one memory file.
- `memory_write`: create a new memory file.
- `memory_update`: replace an existing memory file.
- `memory_forget`: delete a memory file.
- `memory_summarize_session`: create a session summary file.

## Install

From the project root:

```sh
npm install --prefix .opencode/mcp/memory
```

## Test

```sh
npm --prefix .opencode/mcp/memory test
```
