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
train_lora = load_module("train_lora", ROOT / "train_lora.py")


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

    def test_lora_tokenization_masks_non_assistant_tokens(self) -> None:
        class TinyTokenizer:
            eos_token = "<eos>"
            pad_token = "<eos>"

            def apply_chat_template(self, messages, tokenize=False, add_generation_prompt=False):
                assert tokenize is False
                assert add_generation_prompt is False
                return "".join(f"<{message['role']}>{message['content']}" for message in messages)

            def __call__(self, text, **kwargs):
                return {"input_ids": [ord(char) for char in text]}

        messages = [
            {"role": "system", "content": "rules"},
            {"role": "user", "content": "fix"},
            {"role": "assistant", "content": "Changed files\nVerification\nRemaining risk"},
        ]
        encoded = train_lora.assistant_loss_labels(messages, TinyTokenizer(), 256)
        labels = encoded["labels"]
        unmasked = [index for index, label in enumerate(labels) if label != -100]
        assistant_start = train_lora._find_subsequence(
            encoded["input_ids"],
            [ord(char) for char in messages[-1]["content"]],
        )

        self.assertGreaterEqual(assistant_start, 0)
        self.assertEqual(unmasked[0], assistant_start)
        self.assertEqual(unmasked[-1], assistant_start + len(messages[-1]["content"]) - 1)
        self.assertTrue(all(label == -100 for label in labels[:assistant_start]))

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
                    "--model=vram16-local/active-model",
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

    def test_collector_resume_manifest_skips_completed_task(self) -> None:
        if shutil.which("node") is None:
            self.skipTest("node is required for collector dry-run")
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp) / "traces"
            resume_manifest = Path(tmp) / "existing.jsonl"
            resume_manifest.write_text(
                json.dumps({"task_id": "python_inventory_missing_key"}) + "\n",
                encoding="utf-8",
            )
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
                    "--model=vram16-local/active-model",
                    "--resume-manifest",
                    str(resume_manifest),
                    "--dry-run",
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=True,
            )
            self.assertIn("resume complete", result.stderr)
            self.assertFalse(list(output_dir.glob("manifest_test_*.jsonl")))

    def test_task_expander_writes_prompt_variants(self) -> None:
        if shutil.which("node") is None:
            self.skipTest("node is required for task expansion")
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "expanded.jsonl"
            subprocess.run(
                [
                    "node",
                    str(ROOT / "expand_task_prompts.js"),
                    "--input",
                    str(ROOT / "tasks" / "generic_programming_tasks.jsonl"),
                    "--output",
                    str(output),
                    "--variants",
                    "3",
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=True,
            )
            rows = read_jsonl(output)
        self.assertEqual(len(rows), 99)
        self.assertIn("base_id", rows[0])
        self.assertIn("__p01", rows[0]["id"])
        self.assertIn("__p03", rows[2]["id"])

    def test_task_expander_can_write_later_variant_window(self) -> None:
        if shutil.which("node") is None:
            self.skipTest("node is required for task expansion")
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "expanded_late.jsonl"
            subprocess.run(
                [
                    "node",
                    str(ROOT / "expand_task_prompts.js"),
                    "--input",
                    str(ROOT / "tasks" / "generic_programming_tasks.jsonl"),
                    "--output",
                    str(output),
                    "--variants",
                    "16",
                    "--start-variant",
                    "9",
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=True,
            )
            rows = read_jsonl(output)
        self.assertEqual(len(rows), 264)
        self.assertIn("__p09", rows[0]["id"])
        self.assertIn("__p16", rows[7]["id"])

    def test_extra_task_generator_creates_250_fixture_backed_tasks(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "generated.jsonl"
            subprocess.run(
                [
                    sys.executable,
                    str(ROOT / "generate_extra_task_bank.py"),
                    "--output",
                    str(output),
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=True,
            )
            rows = read_jsonl(output)

        self.assertEqual(len(rows), 250)
        scenarios = {row["scenario"] for row in rows}
        self.assertEqual(scenarios, {"python", "javascript"})
        self.assertEqual({row["kind"] for row in rows}, {"targeted_programming_modification"})
        for row in rows:
            self.assertTrue(row["prompt"].strip())
            self.assertEqual(len(row["files"]), 2)
            self.assertTrue(row["verify"])
            self.assertTrue(row["expect"])

    def test_tool_discipline_generator_marks_tool_focus(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "tool_discipline.jsonl"
            subprocess.run(
                [
                    sys.executable,
                    str(ROOT / "generate_tool_discipline_task_bank.py"),
                    "--output",
                    str(output),
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=True,
            )
            rows = read_jsonl(output)

        self.assertEqual(len(rows), 48)
        focus = {tag for row in rows for tag in row.get("tool_focus", [])}
        self.assertGreaterEqual(
            focus,
            {"file_edit", "verification", "final_evidence", "harness", "bounded_recovery", "web", "subagent", "no_subagent"},
        )
        self.assertTrue(all(row["verify"] for row in rows))
        self.assertTrue(all(row["expect"] for row in rows))

    def test_temp_cleaner_reports_stale_candidates_in_dry_run(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            stale = Path(tmp) / "gemma4-tool-unit-old"
            stale.mkdir()
            result = subprocess.run(
                [
                    sys.executable,
                    str(ROOT / "clean_temp_workdirs.py"),
                    "--tmp-dir",
                    tmp,
                    "--older-than-minutes",
                    "0",
                    "--dry-run",
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=True,
            )
            report = json.loads(result.stdout)
        self.assertEqual(report["candidates"], 1)
        self.assertEqual(report["removed"], 0)

    def test_corrected_row_builder_converts_manifest_without_raw_bad_output(self) -> None:
        manifest_row = {
            "task_id": "javascript_env_parser_crlf",
            "scenario": "javascript",
            "kind": "targeted_programming_modification",
            "source_label": "unit",
            "prompt": "Fix src/env.js so parseEnv handles CRLF lines.",
            "verify": ["node test/env.test.js"],
            "expect": ["src/env.js", "CRLF"],
            "status": "completed",
            "accepted": False,
            "classification": {
                "forbidden": [],
                "missingFinalMarkers": ["Changed files", "Verification", "Remaining risk"],
                "missingExpectations": ["CRLF"],
                "issueTags": ["missing_final_markers", "missed_required_task_context", "verification_missing"],
            },
            "started_at": "2026-06-17T00:00:00Z",
            "log_file": "/tmp/raw.log",
        }
        with tempfile.TemporaryDirectory() as tmp:
            manifest = Path(tmp) / "manifest_unit.jsonl"
            output = Path(tmp) / "rows.jsonl"
            manifest.write_text(json.dumps(manifest_row) + "\n", encoding="utf-8")
            subprocess.run(
                [
                    sys.executable,
                    str(ROOT / "build_corrected_rows.py"),
                    "--manifest",
                    str(manifest),
                    "--output",
                    str(output),
                    "--rejected",
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=True,
            )
            rows = read_jsonl(output)

        self.assertEqual(len(rows), 1)
        row = rows[0]
        self.assertEqual(row["metadata"]["kind"], "corrected_target_failure")
        self.assertEqual(row["metadata"]["source"], "real_trace_template_rewrite")
        self.assertIn("verification_missing", row["metadata"]["issue_tags"])
        self.assertIn("Changed files", row["messages"][-1]["content"])
        self.assertIn("node test/env.test.js", row["messages"][-1]["content"])
        self.assertNotIn("[read](", row["messages"][-1]["content"])

    def test_dedupe_dataset_removes_duplicate_semantic_rows(self) -> None:
        row = {
            "id": "one",
            "messages": [
                {"role": "system", "content": "You are a programming agent."},
                {"role": "user", "content": "Fix src/a.py"},
                {"role": "assistant", "content": "Final response:\n- Changed files: src/a.py\n- Verification: passed\n- Remaining risk: none\nDo not loop."},
            ],
            "metadata": {"kind": "corrected_target_failure", "scenario": "python", "source": "test", "issue_tags": ["missing_final_markers"]},
        }
        duplicate = {**row, "id": "two"}
        with tempfile.TemporaryDirectory() as tmp:
            input_path = Path(tmp) / "input.jsonl"
            output_path = Path(tmp) / "output.jsonl"
            input_path.write_text(json.dumps(row) + "\n" + json.dumps(duplicate) + "\n", encoding="utf-8")
            subprocess.run(
                [
                    sys.executable,
                    str(ROOT / "dedupe_dataset.py"),
                    "--input",
                    str(input_path),
                    "--output",
                    str(output_path),
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=True,
            )
            rows = read_jsonl(output_path)
        self.assertEqual(len(rows), 1)


if __name__ == "__main__":
    unittest.main()
