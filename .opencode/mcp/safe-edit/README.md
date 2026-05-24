# safe-edit MCP

Local MCP server with small, line-oriented file editing tools for OpenCode agents.

The server rejects paths outside the project root, creates backups before every write, and returns simple text output. Backups are stored in:

```text
.opencode/mcp/safe-edit/backups
```

## Tools

- `safe_read_lines`: read a 1-based inclusive line range.
- `safe_replace_lines`: replace a 1-based inclusive line range.
- `safe_insert_after`: insert content after a line. Use line `0` to insert at the top.
- `safe_delete_lines`: delete a 1-based inclusive line range.
- `safe_apply_patch`: validate a unified diff with `git apply --check`, then apply it.
- `safe_verify_file`: read the full file or a selected range after editing.

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
