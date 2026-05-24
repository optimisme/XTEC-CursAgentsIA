# websearch MCP

Local MCP server that exposes a `websearch` tool for OpenCode agents.

The tool queries DuckDuckGo's HTML endpoint and returns concise text results with titles, URLs, and snippets. Use it before `webfetch` when the user asks to search the internet.

## Tools

- `websearch`: accepts `query` and optional `max_results`.

Example:

```json
{
  "query": "Swiss railway clock design",
  "max_results": 5
}
```

## Install

From the project root:

```sh
npm install --prefix .opencode/mcp/websearch
```

## Test

```sh
npm --prefix .opencode/mcp/websearch test
```
