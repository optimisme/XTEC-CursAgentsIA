# task-contract MCP Server

An MCP (Model Context Protocol) server for submitting task reports in Spec Driven Development projects.

## Features

- Exposes a single tool: `submit_task_report`
- Appends reports to a JSONL file for easy parsing and auditing
- Validates input schema before accepting reports
- Returns clear success or error messages

## Setup

```bash
cd .opencode/mcp/task-contract
npm install
```

## Running

```bash
npm start
```

## Tool: submit_task_report

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | The task identifier |
| `status` | string | Yes | Task status: `"done"` or `"blocked"` |
| `changedFiles` | string[] | Yes | Array of file paths that were changed |
| `verification` | string[] | Yes | Array of verification checks performed |
| `notes` | string | No | Optional notes about the report |

### Example

```json
{
  "taskId": "task-001",
  "status": "done",
  "changedFiles": ["webs/index.html", "webs/app.js"],
  "verification": ["HTML is semantic", "App loads correctly"],
  "notes": "All acceptance criteria met."
}
```

### Output

On success:
```
Task report submitted successfully.
Task: task-001
Status: done
Files: webs/index.html, webs/app.js
Checks: HTML is semantic, App loads correctly
Notes: All acceptance criteria met.
```

On invalid input:
```
Error: Invalid parameter: taskId is required
```

## Report Storage

Reports are appended to `.opencode/mcp/task-contract/reports.jsonl` as one JSON object per line.
