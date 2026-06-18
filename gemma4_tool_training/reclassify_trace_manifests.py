#!/usr/bin/env python3
"""Reclassify existing trace manifests by parsing stored OpenCode logs.

The script is non-destructive: it mirrors manifest rows into a separate output
directory and enriches each row with the newer tool-use taxonomy.
"""

from __future__ import annotations

import argparse
import glob
import json
import re
from pathlib import Path
from typing import Any


FORBIDDEN_PATTERNS = [
    re.compile(pattern, re.I)
    for pattern in [
        r"<\|tool_call",
        r"<tool_call\|>",
        r"<\|channel",
        r"<channel\|>",
        r"call:task",
        r"safe_editor",
        r"agent_contract",
    ]
]
FINAL_MARKERS = ["Changed files", "Verification", "Remaining risk"]
TOOL_DISCIPLINE_TAGS = {
    "fake_tool_call",
    "tool_result_ignored",
    "verification_missing",
    "final_without_evidence",
    "unbounded_tool_loop",
    "premature_final",
    "wrong_file_or_context",
    "no_recovery_after_tool_failure",
    "web_tool_missing",
    "subagent_tool_missing",
    "unneeded_subagent",
    "harness_command_missing",
}


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


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


def parse_log(log_file: str | None) -> tuple[list[dict[str, Any]], str, str]:
    if not log_file:
        return [], "", ""
    path = Path(log_file)
    if not path.exists():
        return [], "", ""
    text = path.read_text(encoding="utf-8", errors="replace")
    stdout = text.split("\n\nSTDERR\n", 1)[0].removeprefix("STDOUT\n")
    events: list[dict[str, Any]] = []
    assistant_parts: list[str] = []
    for line in stdout.splitlines():
        if not line.strip():
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(event, dict):
            events.append(event)
            part = event.get("part") or {}
            if event.get("type") == "text" and isinstance(part.get("text"), str):
                assistant_parts.append(part["text"])
    return events, "\n".join(assistant_parts), text


def normalize_command(command: str) -> str:
    return " ".join(str(command or "").split())


def relative_tool_path(file_path: str | None) -> str:
    text = str(file_path or "")
    for marker in ["/src/", "/tests/", "/test/", "/scripts/"]:
        if marker in text:
            return marker.strip("/") + "/" + text.split(marker, 1)[1]
    return text


def repeated_empty_tool_results(calls: list[dict[str, Any]]) -> int:
    streak = 0
    max_streak = 0
    for call in calls:
        if call.get("emptyOutput"):
            streak += 1
            max_streak = max(max_streak, streak)
        else:
            streak = 0
    return max_streak


def summarize_tool_use(events: list[dict[str, Any]], row: dict[str, Any]) -> dict[str, Any]:
    calls: list[dict[str, Any]] = []
    counts: dict[str, int] = {}
    for event in events:
        if event.get("type") != "tool_use":
            continue
        part = event.get("part") or {}
        tool = str(part.get("tool") or "unknown")
        counts[tool] = counts.get(tool, 0) + 1
        state = part.get("state") or {}
        input_data = state.get("input") or {}
        output = state.get("output") if isinstance(state.get("output"), str) else ""
        calls.append(
            {
                "tool": tool,
                "status": state.get("status"),
                "filePath": input_data.get("filePath") or input_data.get("path"),
                "command": input_data.get("command") or input_data.get("cmd"),
                "outputChars": len(output),
                "emptyOutput": not output.strip() or bool(re.search(r"No files found", output, re.I)),
            }
        )
    verify_commands = row.get("verify") or []
    bash_commands = [str(call.get("command") or "") for call in calls if call.get("tool") == "bash"]
    verification_run = any(
        normalize_command(verify) and any(normalize_command(verify) in normalize_command(command) for command in bash_commands)
        for verify in verify_commands
    )
    expected_files = {
        str(item)
        for item in (row.get("expect") or [])
        if "/" in str(item)
    }
    read_files = {relative_tool_path(call.get("filePath")) for call in calls if call.get("tool") == "read" and call.get("filePath")}
    edited_files = {relative_tool_path(call.get("filePath")) for call in calls if call.get("tool") == "edit" and call.get("filePath")}
    return {
        "counts": counts,
        "totalCalls": len(calls),
        "verificationRun": verification_run,
        "expectedVerify": verify_commands,
        "readExpectedFile": bool(expected_files & read_files),
        "editedExpectedFile": bool(expected_files & edited_files),
        "emptyToolResults": sum(1 for call in calls if call.get("emptyOutput")),
        "repeatedEmptyToolResults": repeated_empty_tool_results(calls),
        "calls": calls[:30],
    }


def issue_tags(
    row: dict[str, Any],
    forbidden: list[str],
    missing_final_markers: list[str],
    missing_expectations: list[str],
    tool_use: dict[str, Any],
    visible_text: str,
) -> list[str]:
    tags: list[str] = []
    if row.get("status") == "timeout":
        tags.extend(["timeout_or_loop", "unbounded_tool_loop"])
    if forbidden:
        tags.extend(["visible_pseudo_tool_or_hidden_channel", "fake_tool_call"])
    if missing_final_markers:
        tags.append("missing_final_markers")
    if missing_expectations:
        tags.append("missed_required_task_context")
    if (row.get("verify") or []) and not tool_use.get("verificationRun"):
        tags.append("verification_missing")
    if tool_use.get("totalCalls", 0) > 0 and not tool_use.get("verificationRun") and not missing_final_markers:
        tags.append("final_without_evidence")
    if "programming" in str(row.get("kind") or "") and not tool_use.get("editedExpectedFile"):
        tags.append("wrong_file_or_context")
    if tool_use.get("repeatedEmptyToolResults", 0) >= 2:
        tags.append("no_recovery_after_tool_failure")
    if tool_use.get("totalCalls", 0) == 0 and re.search(r"Changed files|Verification|Remaining risk", visible_text, re.I):
        tags.append("premature_final")
    if tool_use.get("totalCalls", 0) > 0 and missing_expectations:
        tags.append("tool_result_ignored")
    focus = set(row.get("tool_focus") or [])
    counts = tool_use.get("counts") or {}
    if "web" in focus and not (counts.get("webfetch", 0) + counts.get("websearch", 0)):
        tags.append("web_tool_missing")
    if "subagent" in focus and not counts.get("task", 0):
        tags.append("subagent_tool_missing")
    if "no_subagent" in focus and counts.get("task", 0):
        tags.append("unneeded_subagent")
    if "harness" in focus and not counts.get("bash", 0):
        tags.append("harness_command_missing")
    if not tags:
        tags.append("accepted_trace_pattern" if row.get("accepted") else "uncategorized_trace_rewrite")
    return sorted(set(tags))


def reclassify_row(row: dict[str, Any]) -> dict[str, Any]:
    events, assistant_text, full_text = parse_log(row.get("log_file"))
    visible_text = assistant_text or full_text
    forbidden = [pattern.pattern for pattern in FORBIDDEN_PATTERNS if pattern.search(visible_text)]
    missing_final_markers = [marker for marker in FINAL_MARKERS if marker not in visible_text]
    missing_expectations = [
        str(expected)
        for expected in (row.get("expect") or [])
        if str(expected).lower() not in full_text.lower()
    ]
    tool_use = summarize_tool_use(events, row)
    tags = issue_tags(row, forbidden, missing_final_markers, missing_expectations, tool_use, visible_text)
    accepted = (
        row.get("status") == "completed"
        and not forbidden
        and not missing_final_markers
        and not missing_expectations
        and not any(tag in TOOL_DISCIPLINE_TAGS for tag in tags)
    )
    updated = dict(row)
    classification = dict(row.get("classification") or {})
    classification.update(
        {
            "forbidden": forbidden,
            "missingFinalMarkers": missing_final_markers,
            "missingExpectations": missing_expectations,
            "issueTags": tags,
            "toolUse": tool_use,
            "assistantTextChars": len(assistant_text),
            "reclassified": True,
        }
    )
    updated["classification"] = classification
    updated["accepted"] = accepted
    updated["reclassified_at"] = "offline"
    return updated


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", action="append", default=["traces/central/**/manifest_*.jsonl"])
    parser.add_argument("--output-dir", type=Path, default=Path("traces/reclassified/central"))
    parser.add_argument("--combined", type=Path, default=Path("traces/reclassified/central/manifest_reclassified_all.jsonl"))
    args = parser.parse_args()

    manifests = manifest_paths(args.manifest)
    all_rows: list[dict[str, Any]] = []
    for manifest in manifests:
        rows = [reclassify_row(row) for row in read_jsonl(manifest)]
        relative_name = "__".join(manifest.parts[-2:])
        output = args.output_dir / relative_name
        write_jsonl(output, rows)
        all_rows.extend(rows)
    write_jsonl(args.combined, all_rows)
    report = {
        "manifests": len(manifests),
        "rows": len(all_rows),
        "output_dir": str(args.output_dir),
        "combined": str(args.combined),
    }
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
