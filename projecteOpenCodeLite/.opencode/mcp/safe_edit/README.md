# safe_edit MCP

Small line-based file editor for OpenCode agents.

Backups go to `.opencode/mcp/safe_edit/backups`.

## Tools

- `safe_create_file`: create a file from one complete `content` string.
- `safe_create_file_from_lines`: create a short file from `lines`.
- `safe_read_lines`: read inclusive 1-based `start`-`end`.
- `safe_replace_lines`: replace inclusive 1-based `start`-`end`.
- `safe_insert_after`: insert after `line`; use `0` for top.
- `safe_delete_lines`: delete inclusive 1-based `start`-`end`.
- `safe_verify_file`: read all or optional `start`-`end`.
- `safe_apply_patch`: validate and apply a unified diff.

Use project-relative paths. Paths outside the project are rejected.

## Pattern

```text
read lines -> edit one small range -> verify -> re-read before next edit
```

Prefer complete language units: HTML element, CSS rule, JS statement/function, or any small block.

## Test

```sh
npm --prefix .opencode/mcp/safe_edit test
```
