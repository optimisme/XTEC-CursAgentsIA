# html-check MCP

Local MCP server for basic HTML and JavaScript validation.

## Tools

- `check_html_js`: checks one project-relative HTML file for basic tag balance, linked local asset existence, inline JavaScript syntax errors, and linked local JavaScript syntax errors.

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
