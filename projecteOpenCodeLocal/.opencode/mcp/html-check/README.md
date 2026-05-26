# html-check MCP

Local MCP server for basic HTML, JavaScript, and CSS validation.

## Tools

- `check_html`: checks one project-relative HTML file for basic tag balance, linked local asset existence, inline and linked local JavaScript syntax errors, and inline and linked local CSS syntax errors.

Example:

```json
{
  "file": "clock.html"
}
```

## Install

From the project root:

```sh
npm install --prefix .opencode/mcp/html-check
```

## Test

```sh
npm --prefix .opencode/mcp/html-check test
```
