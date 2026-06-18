#!/usr/bin/env python3
"""Convert raw trace manifests into corrected SFT rows.

The generated assistant targets are corrected behavioral targets, not copies of
the raw model output. Raw failed transcripts should remain analysis material.
"""

from __future__ import annotations

import argparse
import glob
import hashlib
import json
from pathlib import Path
from typing import Any


SYSTEM = """You are a programming agent using an OpenCode-like tool environment.
Use real tool calls when tools are needed; never print fake tool syntax.
Keep work bounded: inspect only relevant files, make targeted edits, verify, and stop.
If a tool result is missing, malformed, or contradictory, recover once with a smaller action.
Do not loop indefinitely. Return a concise structured final answer.
"""

FINAL_MARKERS = ["Changed files", "Verification", "Remaining risk"]


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise ValueError(f"{path}:{line_number}: invalid JSON: {exc}") from exc
    return rows


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8")


def manifest_paths(patterns: list[str]) -> list[Path]:
    paths: list[Path] = []
    for pattern in patterns:
        matches = glob.glob(pattern, recursive=True)
        if matches:
            paths.extend(Path(match) for match in matches)
        else:
            candidate = Path(pattern)
            if candidate.exists():
                paths.append(candidate)
    return sorted(set(paths))


def stable_id(prefix: str, *parts: object) -> str:
    digest = hashlib.sha1(
        "\n".join(json.dumps(part, sort_keys=True, default=str) for part in parts).encode("utf-8")
    ).hexdigest()[:12]
    return f"{prefix}_{digest}"


def path_expectations(row: dict[str, Any]) -> list[str]:
    candidates: list[str] = []
    for item in row.get("expect", []):
        text = str(item)
        if "/" in text or "." in Path(text).name:
            candidates.append(text)
    return candidates


def issue_tags(row: dict[str, Any]) -> list[str]:
    classification = row.get("classification") or {}
    collector_tags = classification.get("issueTags") or classification.get("issue_tags") or []
    if collector_tags:
        return sorted(set(str(tag) for tag in collector_tags))
    tags: list[str] = []
    if row.get("status") == "timeout":
        tags.append("timeout_or_loop")
    if classification.get("forbidden"):
        tags.append("visible_pseudo_tool_or_hidden_channel")
    missing_final = classification.get("missingFinalMarkers") or []
    if missing_final:
        tags.append("missing_final_markers")
    missing_expectations = classification.get("missingExpectations") or []
    if missing_expectations:
        tags.append("missed_required_task_context")
    if not tags and row.get("accepted"):
        tags.append("accepted_trace_pattern")
    if not tags:
        tags.append("uncategorized_trace_rewrite")
    return tags


def issue_instruction(row: dict[str, Any]) -> str:
    tags = set(issue_tags(row))
    lines: list[str] = []
    if "visible_pseudo_tool_or_hidden_channel" in tags:
        lines.append("Do not print JSON, Markdown, XML, or hidden-channel text that pretends to be a tool call.")
    if "missing_final_markers" in tags:
        missing = ", ".join((row.get("classification") or {}).get("missingFinalMarkers") or FINAL_MARKERS)
        lines.append(f"Do not omit the final sections; this trace was missing: {missing}.")
    if "missed_required_task_context" in tags:
        missing = ", ".join((row.get("classification") or {}).get("missingExpectations") or [])
        if missing:
            lines.append(f"Make sure the final answer mentions the required task context: {missing}.")
    if "timeout_or_loop" in tags:
        lines.append("If a command or tool path fails repeatedly, stop with a bounded blocker instead of looping.")
    if "fake_tool_call" in tags:
        lines.append("Use actual tool calls only; never narrate a pretend tool call in the visible answer.")
    if "verification_missing" in tags:
        lines.append("Run the focused verification command from the task metadata after editing, or report why it could not run.")
    if "final_without_evidence" in tags:
        lines.append("Do not claim verification success unless the relevant command or check actually ran.")
    if "tool_result_ignored" in tags:
        lines.append("Use the observed tool results in the final answer; do not omit required files, expectations, or verification evidence.")
    if "wrong_file_or_context" in tags:
        lines.append("Before editing, read the directly requested source/test files and keep edits limited to the expected path.")
    if "no_recovery_after_tool_failure" in tags:
        lines.append("After an empty or failed tool result, try one smaller relevant recovery action, then stop with a blocker if it still fails.")
    if "premature_final" in tags:
        lines.append("Do not produce the final response before the requested repository work and verification are complete.")
    if "unbounded_tool_loop" in tags:
        lines.append("Avoid repeated broad searches or repeated failed commands; use one bounded recovery attempt and stop.")
    if "web_tool_missing" in tags:
        lines.append("When the task requires current external information and web tools are available, use webfetch or websearch; if unavailable, report a bounded blocker instead of inventing facts.")
    if "subagent_tool_missing" in tags:
        lines.append("When the task explicitly asks for a subagent and the task tool is available, delegate once with a narrow brief, then continue from the result.")
    if "unneeded_subagent" in tags:
        lines.append("Do not delegate tiny local edits to a subagent when direct file reads and one edit are sufficient.")
    if "harness_command_missing" in tags:
        lines.append("When a local harness command is provided, run that exact command and use its result as verification evidence.")
    if "accepted_trace_pattern" in tags:
        lines.append("After the focused verification passes, stop; do not run redundant searches or repeated checks.")
    if not lines:
        lines.append("Keep the work bounded and return the required final sections.")
    return " ".join(lines)


def verification(row: dict[str, Any]) -> str:
    verify = row.get("verify") or []
    if verify:
        return str(verify[0])
    if row.get("kind") == "loop_control":
        return "not run; blocker/control-flow response only"
    return "focused verification command from task metadata"


def changed_files(row: dict[str, Any]) -> str:
    paths = path_expectations(row)
    if paths:
        return ", ".join(paths[:3])
    if row.get("kind") == "loop_control":
        return "none"
    return "the directly requested task file"


def assistant_target(row: dict[str, Any]) -> str:
    verify = verification(row)
    files = changed_files(row)
    if row.get("kind") == "loop_control":
        action = "Stop after one bounded recovery attempt and report the blocker without inventing file contents."
    elif row.get("kind") == "programming_creation":
        action = "Create only the requested file or directly related test/support file, then verify once."
    else:
        action = "Read the directly relevant source and test files, make one targeted edit, then verify once."
    return "\n".join(
        [
            "Plan:",
            f"1. {action}",
            "2. Use real OpenCode tool calls for repository work; never print fake tool-call syntax in the visible answer.",
            f"3. Run or report the focused verification: {verify}.",
            "4. Stop after success or one bounded recovery attempt.",
            "Final response:",
            f"- Changed files: {files}.",
            f"- Verification: {verify} passed, or a bounded blocker was reported if the tool/runtime was unavailable.",
            "- Remaining risk: none unless verification could not run.",
            issue_instruction(row),
        ]
    )


def corrected_row(row: dict[str, Any], manifest: Path) -> dict[str, Any]:
    source = "real_trace_template_rewrite"
    kind = "accepted_target_trace" if row.get("accepted") else "corrected_target_failure"
    tags = issue_tags(row)
    user = str(row.get("prompt", "")).strip()
    return {
        "id": stable_id("trace_rewrite", row.get("task_id"), user, tags, row.get("source_label"), row.get("started_at")),
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": user},
            {"role": "assistant", "content": assistant_target(row)},
        ],
        "metadata": {
            "kind": kind,
            "scenario": row.get("scenario", "generic"),
            "source": source,
            "task_id": row.get("task_id"),
            "source_label": row.get("source_label"),
            "trace_status": row.get("status"),
            "trace_accepted": bool(row.get("accepted")),
            "issue_tags": tags,
            "manifest": str(manifest),
            "log_file": row.get("log_file"),
        },
    }


def build_rows(manifests: list[Path], include_accepted: bool, include_rejected: bool) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for manifest in manifests:
        for trace_row in read_jsonl(manifest):
            accepted = bool(trace_row.get("accepted"))
            if accepted and not include_accepted:
                continue
            if not accepted and not include_rejected:
                continue
            row = corrected_row(trace_row, manifest)
            if row["id"] in seen_ids:
                continue
            seen_ids.add(row["id"])
            rows.append(row)
    return rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", action="append", default=[], help="Manifest path or glob. Can be repeated.")
    parser.add_argument("--output", type=Path, default=Path("data/trace_rewrites.autocurated.jsonl"))
    parser.add_argument("--seed", type=Path, help="Optional existing dataset to prepend.")
    parser.add_argument("--accepted", action="store_true", help="Include accepted traces as corrected positive patterns.")
    parser.add_argument("--rejected", action="store_true", help="Include rejected traces as corrected failure targets.")
    args = parser.parse_args()

    include_accepted = args.accepted
    include_rejected = args.rejected or not args.accepted
    manifests = manifest_paths(args.manifest or ["traces/**/manifest_*.jsonl"])
    if not manifests:
        raise SystemExit("no manifests matched")

    rows: list[dict[str, Any]] = []
    if args.seed:
        rows.extend(read_jsonl(args.seed))
    generated = build_rows(manifests, include_accepted=include_accepted, include_rejected=include_rejected)
    rows.extend(generated)
    write_jsonl(args.output, rows)
    print(
        json.dumps(
            {
                "output": str(args.output),
                "seed_rows": len(rows) - len(generated),
                "generated_rows": len(generated),
                "total_rows": len(rows),
                "manifests": len(manifests),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
