#!/usr/bin/env python3
"""Pre-training checks for the generic programming tool-use LoRA dataset."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path


PSEUDO_TOOL_RE = re.compile(r"<\|tool_call|<tool_call\|>|<\|channel>|<channel\|>|call:task")
REQUIRED_ROLES = ["system", "user", "assistant"]


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


def validate_dataset(path: Path) -> tuple[list[str], dict]:
    errors: list[str] = []
    rows = read_jsonl(path)
    kinds: Counter[str] = Counter()
    scenarios: Counter[str] = Counter()
    sources: Counter[str] = Counter()

    if not rows:
        errors.append("dataset is empty")

    for index, row in enumerate(rows, start=1):
        messages = row.get("messages")
        if not isinstance(messages, list) or len(messages) < 3:
            errors.append(f"row {index}: messages must contain system/user/assistant turns")
            continue

        roles = [message.get("role") for message in messages[:3]]
        if roles != REQUIRED_ROLES:
            errors.append(f"row {index}: first three roles are {roles}, expected {REQUIRED_ROLES}")

        for message_index, message in enumerate(messages, start=1):
            content = message.get("content")
            if not isinstance(content, str) or not content.strip():
                errors.append(f"row {index} message {message_index}: empty content")

        assistant = messages[-1].get("content", "")
        if PSEUDO_TOOL_RE.search(assistant):
            errors.append(f"row {index}: assistant target contains visible pseudo-tool syntax")
        if "Do not" not in assistant and "Final response" not in assistant:
            errors.append(f"row {index}: assistant target does not teach a tool-formatting or structured-final invariant")

        metadata = row.get("metadata", {})
        kinds[str(metadata.get("kind", "unknown"))] += 1
        scenarios[str(metadata.get("scenario", "unknown"))] += 1
        sources[str(metadata.get("source", "unknown"))] += 1

    summary = {
        "rows": len(rows),
        "kinds": dict(kinds),
        "scenarios": dict(scenarios),
        "sources": dict(sources),
    }
    return errors, summary


def validate_eval_cases(path: Path) -> tuple[list[str], dict]:
    errors: list[str] = []
    rows = read_jsonl(path)
    for index, row in enumerate(rows, start=1):
        for field in ["id", "prompt", "must_not_match", "must_mention"]:
            if field not in row:
                errors.append(f"eval row {index}: missing {field}")
        if not isinstance(row.get("must_not_match", []), list):
            errors.append(f"eval row {index}: must_not_match must be a list")
        if not isinstance(row.get("must_mention", []), list):
            errors.append(f"eval row {index}: must_mention must be a list")
    return errors, {"rows": len(rows)}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=Path, default=Path("data/global_tool_sft_seed.jsonl"))
    parser.add_argument("--eval-cases", type=Path, default=Path("eval_cases.jsonl"))
    parser.add_argument("--report", type=Path, default=Path("preflight_report.json"))
    args = parser.parse_args()

    dataset_errors, dataset_summary = validate_dataset(args.dataset)
    eval_errors, eval_summary = validate_eval_cases(args.eval_cases)
    errors = dataset_errors + eval_errors
    report = {
        "ok": not errors,
        "dataset": dataset_summary,
        "eval_cases": eval_summary,
        "errors": errors,
        "training_readiness": (
            "pipeline smoke-test only; collect hundreds or thousands of diverse traces before claiming adapter quality"
            if dataset_summary.get("rows", 0) < 100
            else "enough rows for an initial synthetic adapter experiment; still validate on real accepted traces"
        ),
    }
    args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
