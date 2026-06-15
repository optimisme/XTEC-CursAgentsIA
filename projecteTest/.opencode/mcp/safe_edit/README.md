# safe_edit MCP

Small guarded file editor for OpenCode Lite agents.

Backups go to `.opencode/mcp/safe_edit/backups`.

## Tools

- `safe_create_file`: create a file from one complete `content` string.
- `safe_create_file_from_lines`: create a short file from `lines`.
- `safe_replace_lines`: replace one inclusive 1-based line range with new physical `lines` in a single transactional write; it does not take or match old line text.
- `safe_insert_lines`: insert physical lines after current line `after`; use `0` for top.
- `safe_delete_lines`: delete inclusive 1-based `start`-`end`.
- `safe_verify_file`: read all or optional `start`-`end`.

Use project-relative paths. Paths outside the project are rejected.

## Pattern

```text
new file: create complete content -> verify
existing file: verify current lines -> delete_lines/insert_lines -> verify
```

Existing-file edits are intentionally bounded. To replace text, prefer `safe_replace_lines` with current `start`/`end` line numbers and replacement physical lines. Use delete/insert only for pure deletion or insertion. The Lite harness exposes no full-file existing-file edit tool.

## Test

```sh
npm --prefix .opencode/mcp/safe_edit test
```
