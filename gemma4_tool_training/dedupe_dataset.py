#!/usr/bin/env python3
"""Deduplicate and optionally balance an SFT JSONL dataset."""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8")


def normalize_text(text: str) -> str:
    return " ".join(text.lower().split())


def row_key(row: dict[str, Any]) -> str:
    messages = row.get("messages") or []
    user = messages[1].get("content", "") if len(messages) > 1 else ""
    assistant = messages[-1].get("content", "") if messages else ""
    metadata = row.get("metadata") or {}
    semantic = {
        "user": normalize_text(user),
        "assistant": normalize_text(assistant),
        "kind": metadata.get("kind"),
        "scenario": metadata.get("scenario"),
        "task_id": metadata.get("task_id"),
    }
    return hashlib.sha1(json.dumps(semantic, sort_keys=True).encode("utf-8")).hexdigest()


def bucket_key(row: dict[str, Any]) -> tuple[str, str, str]:
    metadata = row.get("metadata") or {}
    tags = metadata.get("issue_tags") or []
    tag = ",".join(tags) if isinstance(tags, list) and tags else "no_issue_tag"
    return (str(metadata.get("kind", "unknown")), str(metadata.get("scenario", "unknown")), tag)


def summarize(rows: list[dict[str, Any]]) -> dict[str, Any]:
    kinds: Counter[str] = Counter()
    scenarios: Counter[str] = Counter()
    sources: Counter[str] = Counter()
    tags: Counter[str] = Counter()
    for row in rows:
        metadata = row.get("metadata") or {}
        kinds[str(metadata.get("kind", "unknown"))] += 1
        scenarios[str(metadata.get("scenario", "unknown"))] += 1
        sources[str(metadata.get("source", "unknown"))] += 1
        issue_tags = metadata.get("issue_tags") or []
        if not isinstance(issue_tags, list) or not issue_tags:
            tags["no_issue_tag"] += 1
        else:
            for tag in issue_tags:
                tags[str(tag)] += 1
    return {
        "rows": len(rows),
        "kinds": dict(kinds),
        "scenarios": dict(scenarios),
        "sources": dict(sources),
        "issue_tags": dict(tags),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--max-per-bucket", type=int, default=0)
    parser.add_argument("--target", type=int, default=0, help="Stop after this many rows after dedupe/balance.")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()

    rows = read_jsonl(args.input)
    deduped: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in rows:
        key = row_key(row)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)

    selected: list[dict[str, Any]] = []
    if args.max_per_bucket > 0:
        buckets: dict[tuple[str, str, str], list[dict[str, Any]]] = defaultdict(list)
        for row in deduped:
            buckets[bucket_key(row)].append(row)
        for key in sorted(buckets):
            selected.extend(buckets[key][: args.max_per_bucket])
    else:
        selected = deduped

    if args.target > 0:
        selected = selected[: args.target]

    write_jsonl(args.output, selected)
    report = {
        "input": str(args.input),
        "output": str(args.output),
        "input_rows": len(rows),
        "deduped_rows": len(deduped),
        "output_rows": len(selected),
        "summary": summarize(selected),
    }
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
