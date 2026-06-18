#!/usr/bin/env python3
"""Safely clean stale gemma4 collector temp workdirs."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path


def active_temp_roots(tmp_dir: Path) -> tuple[set[Path], set[str]]:
    active_tool_roots: set[Path] = set()
    active_task_names: set[str] = set()
    try:
        output = subprocess.check_output(["ps", "-axo", "pid,command"], text=True)
    except Exception:
        return active_tool_roots, active_task_names
    escaped = re.escape(str(tmp_dir))
    pattern = re.compile(rf"--dir\s+({escaped}/gemma4-tool-[^/\s]+/([^/\s]+))")
    for line in output.splitlines():
        if "opencode run" not in line:
            continue
        match = pattern.search(line)
        if not match:
            continue
        project_dir = Path(match.group(1))
        active_tool_roots.add(project_dir.parent)
        active_task_names.add(match.group(2))
    return active_tool_roots, active_task_names


def is_gemma4_temp_dir(path: Path) -> bool:
    return path.is_dir() and (path.name.startswith("gemma4-tool-") or path.name.startswith("gemma4-opencode-state-"))


def should_keep(path: Path, active_tool_roots: set[Path], active_task_names: set[str]) -> bool:
    if path in active_tool_roots:
        return True
    if path.name.startswith("gemma4-opencode-state-"):
        return any(path.name.startswith(f"gemma4-opencode-state-{task}-") for task in active_task_names)
    return False


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tmp-dir", type=Path, default=Path(tempfile.gettempdir()))
    parser.add_argument("--older-than-minutes", type=float, default=30.0)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    cutoff = time.time() - args.older_than_minutes * 60
    active_tool_roots, active_task_names = active_temp_roots(args.tmp_dir)
    candidates: list[Path] = []
    for entry in args.tmp_dir.iterdir():
        if not is_gemma4_temp_dir(entry):
            continue
        if should_keep(entry, active_tool_roots, active_task_names):
            continue
        try:
            if entry.stat().st_mtime > cutoff:
                continue
        except FileNotFoundError:
            continue
        candidates.append(entry)

    removed = 0
    errors: list[str] = []
    if not args.dry_run:
        for entry in candidates:
            try:
                shutil.rmtree(entry)
                removed += 1
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{entry}: {exc}")

    remaining = sum(1 for entry in args.tmp_dir.iterdir() if is_gemma4_temp_dir(entry))
    report = {
        "tmp_dir": str(args.tmp_dir),
        "dry_run": args.dry_run,
        "older_than_minutes": args.older_than_minutes,
        "active_tool_roots_kept": len(active_tool_roots),
        "active_task_state_prefixes_kept": len(active_task_names),
        "candidates": len(candidates),
        "removed": removed,
        "remaining_gemma4_temp_dirs": remaining,
        "errors": errors[:20],
    }
    print(json.dumps(report, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
