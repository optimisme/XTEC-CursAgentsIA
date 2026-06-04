# safe_edit MCP

Small guarded file editor for OpenCode Lite agents.

Backups go to `.opencode/mcp/safe_edit/backups`.

## Tools

- `safe_create_file`: create a file from one complete `content` string.
- `safe_create_file_from_lines`: create a short file from `lines`.
- `safe_overwrite_file`: overwrite an existing file from one complete `content` string.
- `safe_overwrite_file_from_lines`: overwrite an existing file from `lines`.
- `safe_insert_lines`: insert physical lines after current line `after`; use `0` for top.
- `safe_delete_lines`: delete inclusive 1-based `start`-`end`.
- `safe_verify_file`: read all or optional `start`-`end`.

Use project-relative paths. Paths outside the project are rejected.

## Pattern

```text
new file: create complete content -> verify
existing file: verify/read current content -> overwrite complete content -> verify
large/surgical existing file: verify -> insert_lines/delete_lines -> verify
```

`safe_overwrite_file` creates a backup, writes the replacement to a temporary copy, validates the temporary content, and replaces the original only if validation passes.

## Test

```sh
npm --prefix .opencode/mcp/safe_edit test
```
