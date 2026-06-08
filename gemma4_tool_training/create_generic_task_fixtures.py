#!/usr/bin/env python3
"""Materialize generic programming tasks into isolated project fixtures."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path
from typing import Iterable


DEFAULT_TASKS = Path("tasks/generic_programming_tasks.jsonl")
AGENTS_MD = """You are working in an isolated programming fixture.

Use the available OpenCode tools for repository work. Inspect the relevant files
before editing, make a targeted change, and run the focused verification command
when the required runtime is available.

Do not print fake tool-call markup, hidden-channel text, XML-like tool tags, or
raw JSON tool-call simulations. If a tool result is empty or fails twice, stop
and report the blocker instead of looping.

Final response:
- Changed files: exact paths only.
- Verification: command/check and result.
- Remaining risk: none or one concrete risk.
"""


def read_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise ValueError(f"{path}:{line_number}: invalid JSON: {exc}") from exc
    return rows


def validate_task(task: dict) -> list[str]:
    errors: list[str] = []
    for field in ["id", "scenario", "kind", "prompt", "files", "expect"]:
        if field not in task:
            errors.append(f"missing {field}")
    if not isinstance(task.get("files"), list) or not task.get("files"):
        errors.append("files must be a non-empty list")
    for file_entry in task.get("files", []):
        if not isinstance(file_entry.get("path"), str) or not file_entry["path"].strip():
            errors.append("file entry has empty path")
        if ".." in Path(file_entry.get("path", "")).parts:
            errors.append(f"unsafe relative path: {file_entry.get('path')}")
        if not isinstance(file_entry.get("content"), str):
            errors.append(f"{file_entry.get('path')}: content must be a string")
    if not isinstance(task.get("verify", []), list):
        errors.append("verify must be a list when present")
    if not isinstance(task.get("expect", []), list):
        errors.append("expect must be a list")
    return errors


def select_tasks(tasks: Iterable[dict], task_id: str | None) -> list[dict]:
    selected = [task for task in tasks if task_id is None or task["id"] == task_id]
    if task_id and not selected:
        raise ValueError(f"unknown task id: {task_id}")
    return selected


def materialize_task(task: dict, output_root: Path, force: bool = False) -> Path:
    errors = validate_task(task)
    if errors:
        raise ValueError(f"{task.get('id', '<unknown>')}: {'; '.join(errors)}")

    fixture_dir = output_root / task["id"]
    if fixture_dir.exists():
        if not force:
            raise FileExistsError(f"{fixture_dir} already exists; use --force to replace it")
        shutil.rmtree(fixture_dir)
    fixture_dir.mkdir(parents=True, exist_ok=False)

    for file_entry in task["files"]:
        destination = fixture_dir / file_entry["path"]
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(file_entry["content"], encoding="utf-8")

    metadata = {
        "id": task["id"],
        "scenario": task["scenario"],
        "kind": task["kind"],
        "prompt": task["prompt"],
        "verify": task.get("verify", []),
        "expect": task.get("expect", []),
    }
    (fixture_dir / "task.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    (fixture_dir / "AGENTS.md").write_text(AGENTS_MD, encoding="utf-8")
    return fixture_dir


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tasks", type=Path, default=DEFAULT_TASKS)
    parser.add_argument("--output-dir", type=Path, default=Path("fixtures/generic"))
    parser.add_argument("--id", dest="task_id")
    parser.add_argument("--list", action="store_true", help="list task ids instead of materializing fixtures")
    parser.add_argument("--force", action="store_true", help="replace existing fixture directories")
    args = parser.parse_args()

    tasks = read_jsonl(args.tasks)
    selected = select_tasks(tasks, args.task_id)
    all_errors: list[str] = []
    for task in selected:
        for error in validate_task(task):
            all_errors.append(f"{task.get('id', '<unknown>')}: {error}")
    if all_errors:
        raise SystemExit("\n".join(all_errors))

    if args.list:
        for task in selected:
            print(f"{task['id']}\t{task['scenario']}\t{task['kind']}")
        return 0

    args.output_dir.mkdir(parents=True, exist_ok=True)
    for task in selected:
        fixture_dir = materialize_task(task, args.output_dir, force=args.force)
        print(fixture_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
