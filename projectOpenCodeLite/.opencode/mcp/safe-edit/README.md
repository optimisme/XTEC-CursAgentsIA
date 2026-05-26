# safe-edit MCP

Local MCP server with small, line-oriented file editing tools for OpenCode agents.

The server rejects paths outside the project root, creates backups before every write, and returns simple text output. Backups are stored in:

```text
.opencode/mcp/safe-edit/backups
```

## Tools

- `safe_read_lines`: read a 1-based inclusive line range.
- `safe_create_file_from_lines`: create a new UTF-8 text file from a JSON array of lines.
- `safe_append_lines`: append a JSON array of lines to an existing file.
- `safe_replace_lines`: replace a 1-based inclusive line range.
- `safe_insert_after`: insert content after a line. Use line `0` to insert at the top.
- `safe_delete_lines`: delete a 1-based inclusive line range.
- `safe_apply_patch`: validate a unified diff with `git apply --check`, then apply it.
- `safe_verify_file`: read the full file or a selected range after editing.

## Arguments and paths

OpenCode passes MCP tool arguments as a JSON object. Use project-relative file paths whenever possible:

```json
{
  "file": "snake.html",
  "lines": [
    "<!DOCTYPE html>",
    "<html lang=\"en\">",
    "</html>"
  ]
}
```

```json
{
  "file": "snake.html",
  "lines": [
    "<head>",
    "  <title>Snake</title>",
    "</head>"
  ]
}
```

```json
{
  "file": "app.js",
  "start": 10,
  "end": 20
}
```

The `file` argument is resolved from the project root. Nested paths are allowed:

```json
{
  "file": "teoria/04-MCPs.md",
  "start": 5,
  "end": 12
}
```

Absolute paths are accepted only when they point inside the project root. Paths that escape the project root, including traversal such as `../other-project/file.js`, are rejected.

Line numbers are 1-based and inclusive. For example, `start: 4` and `end: 6` targets lines 4, 5 and 6.

Tool argument examples:

```json
{
  "file": "app.js",
  "start": 10,
  "end": 14,
  "content": "const value = 1;\nconsole.log(value);"
}
```

```json
{
  "file": "styles.css",
  "line": 24,
  "content": ".button {\n  display: inline-flex;\n}"
}
```

```json
{
  "file": "index.html",
  "start": 30,
  "end": 35
}
```

```json
{
  "patch": "diff --git a/app.js b/app.js\n--- a/app.js\n+++ b/app.js\n@@ -1,1 +1,1 @@\n-old\n+new\n"
}
```

`safe_verify_file` accepts only `file`, plus optional `start` and `end`. Omit the range to read the whole file.

## Install

From the project root:

```sh
npm install --prefix .opencode/mcp/safe-edit
```

## OpenCode configuration

Add this entry to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "safe-edit": {
      "type": "local",
      "command": ["node", ".opencode/mcp/safe-edit/server.js"],
      "enabled": true
    }
  }
}
```

If `opencode.json` already has an `mcp` object, add only the `safe-edit` entry inside it.

## Minimal test

```sh
npm --prefix .opencode/mcp/safe-edit test
```

## Example prompt

```text
Use the safe-edit MCP to update app.js. First read the target lines with safe_read_lines, replace only the needed line range, then verify the changed section with safe_verify_file.
```

For a new file, use `safe_create_file_from_lines`, then verify it with `safe_verify_file`. For nontrivial HTML/JavaScript files, create only a small scaffold first and add content in 25-50 line chunks. Each `lines` array item should be one physical file line; if an item contains embedded newlines, safe-edit expands it into physical file lines before writing.

For `.html` and `.htm` files, `safe_verify_file` also performs a lightweight sanity check: it fails when content appears after the first `</html>` closing tag, or when basic paired tags such as `html`, `head`, `body`, `style`, and `script` are unbalanced.
