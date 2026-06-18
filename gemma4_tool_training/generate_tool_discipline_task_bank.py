#!/usr/bin/env python3
"""Generate OpenCode-focused tool-discipline fixtures.

These tasks complement the broad programming bank. They deliberately stress
file editing, exact verification, bounded recovery, harness commands, and
optional task/web tool behavior.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


WORDS = [
    "amber",
    "basil",
    "cedar",
    "dahlia",
    "ember",
    "fennel",
    "ginger",
    "harbor",
    "iris",
    "juniper",
    "kelp",
    "laurel",
]

SPARK_EXTRA_WORDS = [
    "marigold",
    "nickel",
    "onyx",
    "poppy",
    "quartz",
    "raven",
    "saffron",
    "thistle",
    "umber",
    "violet",
    "willow",
    "zircon",
]

VRAM_EXTRA_WORDS = [
    "acacia",
    "brindle",
    "cobalt",
    "drift",
    "elm",
    "flint",
    "garnet",
    "heather",
    "indigo",
    "jasper",
    "lichen",
    "moss",
]


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row, separators=(",", ":")) + "\n" for row in rows), encoding="utf-8")


def py_file_task(word: str, index: int) -> dict:
    source = f"src/{word}_rules.py"
    test = f"tests/test_{word}_rules.py"
    verify = f"PYTHONPATH=. python {test}"
    return {
        "id": f"tool_python_{word}_file_verify",
        "scenario": "python",
        "kind": "targeted_programming_modification",
        "tool_focus": ["file_edit", "verification", "final_evidence", "no_subagent"],
        "prompt": (
            f"Fix {source}. Inspect the implementation and focused test, edit only the source file, "
            f"then run exactly `{verify}`. Do not use a subagent for this small local change. "
            "Final answer must cite the changed file and verification result."
        ),
        "files": [
            {
                "path": source,
                "content": (
                    f"def normalize_{word}(items):\n"
                    "    result = []\n"
                    "    for item in items:\n"
                    "        result.append(str(item))\n"
                    "    return result\n"
                ),
            },
            {
                "path": test,
                "content": (
                    f"from src.{word}_rules import normalize_{word}\n\n"
                    f"assert normalize_{word}([' A ', '', 'b', ' A ']) == ['a', 'b', 'a']\n"
                    f"assert normalize_{word}([]) == []\n"
                ),
            },
            {
                "path": "NOTES.md",
                "content": "Distractor: do not edit this note. The expected source file is in src/.\n",
            },
        ],
        "verify": [verify],
        "expect": [source, test, verify, "Changed files", "Verification", "Remaining risk"],
    }


def js_harness_task(word: str, index: int) -> dict:
    source = f"src/{word}Harness.js"
    test = f"test/{word}Harness.test.js"
    harness = "scripts/check.sh"
    verify = f"bash {harness}"
    fn = f"parse{word.title()}Limit"
    return {
        "id": f"tool_javascript_{word}_harness_verify",
        "scenario": "javascript",
        "kind": "targeted_programming_modification",
        "tool_focus": ["file_edit", "verification", "harness", "final_evidence"],
        "prompt": (
            f"Fix {source} and verify through the local harness by running exactly `{verify}`. "
            "Use real file reads, edit the implementation, and do not claim success unless the harness runs."
        ),
        "files": [
            {
                "path": source,
                "content": (
                    f"function {fn}(value, fallback = {index}) {{\n"
                    "  const parsed = Number(value);\n"
                    "  return parsed || fallback;\n"
                    "}\n\n"
                    f"module.exports = {{ {fn} }};\n"
                ),
            },
            {
                "path": test,
                "content": (
                    "const assert = require('node:assert/strict');\n"
                    f"const {{ {fn} }} = require('../{source}');\n\n"
                    f"assert.equal({fn}(' 12 '), 12);\n"
                    f"assert.equal({fn}('0'), 0);\n"
                    f"assert.equal({fn}('bad', {index + 3}), {index + 3});\n"
                ),
            },
            {
                "path": harness,
                "content": f"#!/usr/bin/env bash\nset -euo pipefail\nnode {test}\n",
            },
        ],
        "verify": [verify],
        "expect": [source, test, harness, verify, "harness", "Verification"],
    }


def bounded_recovery_task(word: str, index: int) -> dict:
    source = f"src/{word}_fallback.py"
    verify = "PYTHONPATH=. python tests/test_fallback.py"
    return {
        "id": f"tool_python_{word}_bounded_recovery",
        "scenario": "python",
        "kind": "loop_control",
        "tool_focus": ["bounded_recovery", "verification", "no_subagent"],
        "prompt": (
            f"Fix {source}. If a broad search or command returns nothing, recover once with a narrower read of "
            f"`{source}` and continue. Do not loop over repeated empty searches. Run `{verify}` after editing."
        ),
        "files": [
            {
                "path": source,
                "content": (
                    "def choose_value(config, key, fallback):\n"
                    "    if key in config:\n"
                    "        return config[key] or fallback\n"
                    "    return None\n"
                ),
            },
            {
                "path": "tests/test_fallback.py",
                "content": (
                    f"from src.{word}_fallback import choose_value\n\n"
                    "assert choose_value({'port': 0}, 'port', 8080) == 0\n"
                    "assert choose_value({'host': ''}, 'host', 'localhost') == ''\n"
                    "assert choose_value({}, 'host', 'localhost') == 'localhost'\n"
                ),
            },
        ],
        "verify": [verify],
        "expect": [source, "tests/test_fallback.py", verify, "bounded", "Remaining risk"],
    }


def web_summary_task(word: str, index: int) -> dict:
    source = f"src/{word}_web_note.py"
    verify = f"PYTHONPATH=. python -m py_compile {source}"
    return {
        "id": f"tool_python_{word}_web_fetch_note",
        "scenario": "python",
        "kind": "targeted_programming_modification",
        "tool_focus": ["web", "file_edit", "verification"],
        "prompt": (
            "Use webfetch or websearch to check the current Python documentation page for `str.removeprefix`, "
            f"then update {source} to include a short constant DOC_TOPIC = 'str.removeprefix'. "
            f"Run `{verify}`. If web tools are unavailable, report a bounded blocker instead of inventing a source."
        ),
        "files": [
            {"path": source, "content": "DOC_TOPIC = ''\n"},
        ],
        "verify": [verify],
        "expect": [source, verify, "str.removeprefix", "web"],
    }


def subagent_triage_task(word: str, index: int) -> dict:
    source = f"src/{word}_triage.py"
    test = f"tests/test_{word}_triage.py"
    verify = f"PYTHONPATH=. python {test}"
    return {
        "id": f"tool_python_{word}_subagent_triage",
        "scenario": "python",
        "kind": "targeted_programming_modification",
        "tool_focus": ["subagent", "file_edit", "verification"],
        "prompt": (
            "Use the task/subagent tool once to inspect the likely bug location, then make the edit yourself. "
            f"Fix {source} so the focused test passes, and run `{verify}`. If the task tool is unavailable, "
            "continue with direct file reads and report that bounded fallback."
        ),
        "files": [
            {
                "path": source,
                "content": "def merge_flags(base, override):\n    base.update(override)\n    return base\n",
            },
            {
                "path": test,
                "content": (
                    f"from src.{word}_triage import merge_flags\n\n"
                    "base = {'debug': False, 'port': 8000}\n"
                    "override = {'debug': True}\n"
                    "result = merge_flags(base, override)\n"
                    "assert result == {'debug': True, 'port': 8000}\n"
                    "assert base == {'debug': False, 'port': 8000}\n"
                ),
            },
        ],
        "verify": [verify],
        "expect": [source, test, verify, "task", "fallback"],
    }


def rows(words: list[str]) -> list[dict]:
    output: list[dict] = []
    for index, word in enumerate(words, start=1):
        output.append(py_file_task(word, index))
        output.append(js_harness_task(word, index))
        output.append(bounded_recovery_task(word, index))
        if index <= 6:
            output.append(web_summary_task(word, index))
        if index <= 6:
            output.append(subagent_triage_task(word, index))
    return output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("tasks/tool_discipline_tasks.jsonl"))
    parser.add_argument(
        "--word-set",
        choices=["default", "spark-extra", "vram-extra"],
        default="default",
        help="Fixture word set to generate. Use spark-extra for additional non-duplicate overnight tasks.",
    )
    args = parser.parse_args()
    if args.word_set == "spark-extra":
        words = SPARK_EXTRA_WORDS
    elif args.word_set == "vram-extra":
        words = VRAM_EXTRA_WORDS
    else:
        words = WORDS
    task_rows = rows(words)
    write_jsonl(args.output, task_rows)
    print(f"wrote {len(task_rows)} tasks to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
