#!/usr/bin/env python3
"""Tests for the generic Gemma 4 tool-use training package."""

from __future__ import annotations

import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FORBIDDEN_LITE_TOKENS = [
    "safe_editor",
    "agent_contract",
    "web_check",
    "harness_sft",
    "accepted_trace",
    "corrected_failure",
]


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load module from {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


preflight = load_module("preflight", ROOT / "preflight.py")


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


class GlobalToolDatasetTests(unittest.TestCase):
    def test_builder_generates_expected_generic_rows(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "global_tool_sft_seed.jsonl"
            result = subprocess.run(
                [sys.executable, str(ROOT / "build_global_tool_dataset.py"), "--output", str(output)],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=True,
            )
            self.assertIn("wrote 66 rows", result.stdout)
            rows = read_jsonl(output)

        self.assertEqual(len(rows), 66)
        kinds = {row["metadata"]["kind"] for row in rows}
        self.assertEqual(kinds, {"targeted_programming_modification", "programming_creation", "loop_control", "corrected_target_failure"})
        scenarios = {row["metadata"]["scenario"] for row in rows}
        self.assertGreaterEqual(scenarios, {"python", "javascript", "typescript", "go", "rust", "java", "php", "csharp", "generic"})

    def test_default_dataset_has_no_lite_specific_training_tokens(self) -> None:
        rows = read_jsonl(ROOT / "data" / "global_tool_sft_seed.jsonl")
        dataset_text = "\n".join(json.dumps(row, ensure_ascii=False) for row in rows)
        for token in FORBIDDEN_LITE_TOKENS:
            self.assertNotIn(token, dataset_text)

    def test_default_dataset_targets_structured_opencode_like_programming_behavior(self) -> None:
        rows = read_jsonl(ROOT / "data" / "global_tool_sft_seed.jsonl")
        dataset_text = "\n".join(json.dumps(row, ensure_ascii=False) for row in rows)
        required_phrases = [
            "OpenCode-like tool environment",
            "fake tool",
            "Do not loop indefinitely",
            "Final response",
            "Changed files",
            "Verification",
            "Remaining risk",
        ]
        for phrase in required_phrases:
            self.assertIn(phrase, dataset_text)

    def test_preflight_accepts_default_dataset_and_eval_cases(self) -> None:
        errors, summary = preflight.validate_dataset(ROOT / "data" / "global_tool_sft_seed.jsonl")
        self.assertEqual(errors, [])
        self.assertEqual(summary["rows"], 66)
        self.assertEqual(summary["sources"], {"synthetic_global_tool_invariant": 37, "real_trace_rewrite": 29})

        eval_errors, eval_summary = preflight.validate_eval_cases(ROOT / "eval_cases.jsonl")
        self.assertEqual(eval_errors, [])
        self.assertEqual(eval_summary["rows"], 5)

    def test_preflight_rejects_visible_pseudo_tool_markup(self) -> None:
        bad_row = {
            "id": "bad_pseudo_tool",
            "messages": [
                {"role": "system", "content": "You are a programming agent."},
                {"role": "user", "content": "Fix the file."},
                {"role": "assistant", "content": "Plan:\n<|tool_call|>\nDo not do this."},
            ],
            "metadata": {"kind": "negative_test", "scenario": "generic", "source": "test"},
        }
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bad.jsonl"
            path.write_text(json.dumps(bad_row) + "\n", encoding="utf-8")
            errors, _ = preflight.validate_dataset(path)

        self.assertTrue(any("visible pseudo-tool syntax" in error for error in errors))

    def test_preflight_rejects_bad_message_role_order(self) -> None:
        bad_row = {
            "id": "bad_roles",
            "messages": [
                {"role": "user", "content": "Fix the file."},
                {"role": "system", "content": "You are a programming agent."},
                {"role": "assistant", "content": "Final response:\nDo not loop."},
            ],
            "metadata": {"kind": "negative_test", "scenario": "generic", "source": "test"},
        }
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bad.jsonl"
            path.write_text(json.dumps(bad_row) + "\n", encoding="utf-8")
            errors, _ = preflight.validate_dataset(path)

        self.assertTrue(any("expected ['system', 'user', 'assistant']" in error for error in errors))

    def test_generic_task_bank_covers_programming_languages_and_loop_control(self) -> None:
        tasks = read_jsonl(ROOT / "tasks" / "generic_programming_tasks.jsonl")
        self.assertEqual(len(tasks), 33)
        scenarios = {task["scenario"] for task in tasks}
        self.assertGreaterEqual(scenarios, {"python", "javascript", "typescript", "go", "rust", "java", "php", "csharp", "swift", "generic"})
        kinds = {task["kind"] for task in tasks}
        self.assertEqual(kinds, {"targeted_programming_modification", "programming_creation", "loop_control"})
        for task in tasks:
            self.assertTrue(task["prompt"].strip())
            self.assertTrue(task["files"])
            self.assertIsInstance(task.get("verify", []), list)
            self.assertTrue(task["expect"])

    def test_fixture_materializer_creates_isolated_project(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp) / "fixtures"
            result = subprocess.run(
                [
                    sys.executable,
                    str(ROOT / "create_generic_task_fixtures.py"),
                    "--tasks",
                    str(ROOT / "tasks" / "generic_programming_tasks.jsonl"),
                    "--output-dir",
                    str(output_dir),
                    "--id",
                    "python_inventory_missing_key",
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=True,
            )
            fixture_dir = Path(result.stdout.strip())
            self.assertEqual(fixture_dir.name, "python_inventory_missing_key")
            self.assertTrue((fixture_dir / "src" / "inventory.py").exists())
            self.assertTrue((fixture_dir / "tests" / "test_inventory.py").exists())
            metadata = json.loads((fixture_dir / "task.json").read_text(encoding="utf-8"))
            self.assertEqual(metadata["id"], "python_inventory_missing_key")
            self.assertIn("Changed files", (fixture_dir / "AGENTS.md").read_text(encoding="utf-8"))

    def test_collector_dry_run_writes_manifest_and_log(self) -> None:
        if shutil.which("node") is None:
            self.skipTest("node is required for collector dry-run")
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp) / "traces"
            result = subprocess.run(
                [
                    "node",
                    str(ROOT / "collect_generic_traces.js"),
                    "--tasks",
                    str(ROOT / "tasks" / "generic_programming_tasks.jsonl"),
                    "--output-dir",
                    str(output_dir),
                    "--id",
                    "python_inventory_missing_key",
                    "--source-label=test",
                    "--endpoint=http://127.0.0.1:8002/v1",
                    "--model=vram16-vllm/active-model",
                    "--dry-run",
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=True,
            )
            line = json.loads(result.stdout.strip())
            manifests = sorted(output_dir.glob("manifest_test_*.jsonl"))
            self.assertEqual(line["task_id"], "python_inventory_missing_key")
            self.assertEqual(line["status"], "completed")
            self.assertTrue(manifests)
            manifest_row = read_jsonl(manifests[0])[0]
            self.assertTrue(manifest_row["accepted"])
            self.assertTrue(Path(manifest_row["log_file"]).exists())
            self.assertEqual(manifest_row["source_label"], "test")
            self.assertEqual(manifest_row["classification"]["forbidden"], [])


if __name__ == "__main__":
    unittest.main()
