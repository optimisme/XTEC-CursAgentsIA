#!/usr/bin/env python3
"""Generate additional generic programming fixtures for tool-data collection."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


WORDS = [
    "alpha",
    "bravo",
    "charlie",
    "delta",
    "echo",
    "foxtrot",
    "golf",
    "hotel",
    "india",
    "juliet",
    "kilo",
    "lima",
    "mike",
    "november",
    "oscar",
    "papa",
    "quebec",
    "romeo",
    "sierra",
    "tango",
    "uniform",
    "victor",
    "whiskey",
    "xray",
    "yankee",
]


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row, separators=(",", ":")) + "\n" for row in rows), encoding="utf-8")


def py_task(task_id: str, prompt: str, source_path: str, source: str, test_path: str, test: str, expect: list[str]) -> dict:
    return {
        "id": task_id,
        "scenario": "python",
        "kind": "targeted_programming_modification",
        "prompt": prompt,
        "files": [
            {"path": source_path, "content": source},
            {"path": test_path, "content": test},
        ],
        "verify": [f"PYTHONPATH=. python {test_path}"],
        "expect": [source_path, test_path, *expect],
    }


def js_task(task_id: str, prompt: str, source_path: str, source: str, test_path: str, test: str, expect: list[str]) -> dict:
    return {
        "id": task_id,
        "scenario": "javascript",
        "kind": "targeted_programming_modification",
        "prompt": prompt,
        "files": [
            {"path": source_path, "content": source},
            {"path": test_path, "content": test},
        ],
        "verify": [f"node {test_path}"],
        "expect": [source_path, test_path, *expect],
    }


def python_rows() -> list[dict]:
    rows: list[dict] = []
    for index, word in enumerate(WORDS, start=1):
        source_path = f"src/{word}_bounds.py"
        test_path = f"tests/test_{word}_bounds.py"
        rows.append(
            py_task(
                f"python_{word}_clamp_bounds",
                f"Fix {source_path} so clamp_{word} clamps values below {index} to {index} and above {index + 40} to {index + 40}. Preserve in-range values and verify with the focused tests.",
                source_path,
                f"def clamp_{word}(value):\n    return value\n",
                test_path,
                "\n".join(
                    [
                        f"from src.{word}_bounds import clamp_{word}",
                        "",
                        f"assert clamp_{word}({index - 5}) == {index}",
                        f"assert clamp_{word}({index}) == {index}",
                        f"assert clamp_{word}({index + 20}) == {index + 20}",
                        f"assert clamp_{word}({index + 60}) == {index + 40}",
                        "",
                    ]
                ),
                ["clamp", str(index), str(index + 40)],
            )
        )

        source_path = f"src/{word}_tokens.py"
        test_path = f"tests/test_{word}_tokens.py"
        rows.append(
            py_task(
                f"python_{word}_split_tokens",
                f"Fix {source_path} so split_{word}_tokens splits on commas, strips whitespace, skips empty tokens, and preserves token order.",
                source_path,
                f"def split_{word}_tokens(text):\n    return text.split(',')\n",
                test_path,
                "\n".join(
                    [
                        f"from src.{word}_tokens import split_{word}_tokens",
                        "",
                        f"assert split_{word}_tokens(' a, b,, c ') == ['a', 'b', 'c']",
                        f"assert split_{word}_tokens('') == []",
                        f"assert split_{word}_tokens(' one ') == ['one']",
                        "",
                    ]
                ),
                ["strip", "empty", "order"],
            )
        )

        source_path = f"src/{word}_kv.py"
        test_path = f"tests/test_{word}_kv.py"
        rows.append(
            py_task(
                f"python_{word}_parse_key_values",
                f"Fix {source_path} so parse_{word}_pairs parses KEY=value lines, trims keys and values, skips blank and # comment lines, and ignores malformed lines.",
                source_path,
                f"def parse_{word}_pairs(text):\n    result = {{}}\n    for line in text.splitlines():\n        key, value = line.split('=')\n        result[key] = value\n    return result\n",
                test_path,
                "\n".join(
                    [
                        f"from src.{word}_kv import parse_{word}_pairs",
                        "",
                        "sample = ' host = local\\n# comment\\n\\nport=8000\\ninvalid\\n'",
                        f"assert parse_{word}_pairs(sample) == {{'host': 'local', 'port': '8000'}}",
                        "",
                    ]
                ),
                ["blank", "comment", "malformed"],
            )
        )

        source_path = f"src/{word}_unique.py"
        test_path = f"tests/test_{word}_unique.py"
        rows.append(
            py_task(
                f"python_{word}_unique_normalized",
                f"Fix {source_path} so unique_{word}_names strips whitespace, lowercases names, drops blanks, and preserves first-seen order.",
                source_path,
                f"def unique_{word}_names(names):\n    return list(set(names))\n",
                test_path,
                "\n".join(
                    [
                        f"from src.{word}_unique import unique_{word}_names",
                        "",
                        f"assert unique_{word}_names([' Alice ', 'bob', 'ALICE', '', ' Bob ']) == ['alice', 'bob']",
                        f"assert unique_{word}_names([]) == []",
                        "",
                    ]
                ),
                ["lowercase", "order", "blank"],
            )
        )

        source_path = f"src/{word}_defaults.py"
        test_path = f"tests/test_{word}_defaults.py"
        rows.append(
            py_task(
                f"python_{word}_apply_defaults",
                f"Fix {source_path} so apply_{word}_defaults returns a new dict with defaults filled only when a key is missing, without mutating inputs.",
                source_path,
                f"def apply_{word}_defaults(config, defaults):\n    defaults.update(config)\n    return defaults\n",
                test_path,
                "\n".join(
                    [
                        f"from src.{word}_defaults import apply_{word}_defaults",
                        "",
                        "config = {'host': 'remote'}",
                        "defaults = {'host': 'local', 'port': 8000}",
                        f"result = apply_{word}_defaults(config, defaults)",
                        "assert result == {'host': 'remote', 'port': 8000}",
                        "assert config == {'host': 'remote'}",
                        "assert defaults == {'host': 'local', 'port': 8000}",
                        "",
                    ]
                ),
                ["new dict", "missing", "mutating"],
            )
        )
    return rows


def javascript_rows() -> list[dict]:
    rows: list[dict] = []
    for index, word in enumerate(WORDS, start=1):
        camel = word.replace("-", "_")
        source_path = f"src/{word}Range.js"
        test_path = f"test/{word}Range.test.js"
        rows.append(
            js_task(
                f"javascript_{word}_clamp_range",
                f"Fix {source_path} so clamp{camel.title()} clamps values below {index} to {index} and values above {index + 50} to {index + 50}. Preserve in-range values.",
                source_path,
                f"function clamp{camel.title()}(value) {{\n  return value;\n}}\n\nmodule.exports = {{ clamp{camel.title()} }};\n",
                test_path,
                "\n".join(
                    [
                        "const assert = require('node:assert/strict');",
                        f"const {{ clamp{camel.title()} }} = require('../src/{word}Range.js');",
                        "",
                        f"assert.equal(clamp{camel.title()}({index - 3}), {index});",
                        f"assert.equal(clamp{camel.title()}({index + 25}), {index + 25});",
                        f"assert.equal(clamp{camel.title()}({index + 80}), {index + 50});",
                        "",
                    ]
                ),
                ["clamp", str(index), str(index + 50)],
            )
        )

        source_path = f"src/{word}List.js"
        test_path = f"test/{word}List.test.js"
        rows.append(
            js_task(
                f"javascript_{word}_clean_list",
                f"Fix {source_path} so clean{camel.title()}List trims strings, lowercases them, removes empty entries, and preserves duplicates.",
                source_path,
                f"function clean{camel.title()}List(items) {{\n  return items.map(String);\n}}\n\nmodule.exports = {{ clean{camel.title()}List }};\n",
                test_path,
                "\n".join(
                    [
                        "const assert = require('node:assert/strict');",
                        f"const {{ clean{camel.title()}List }} = require('../src/{word}List.js');",
                        "",
                        f"assert.deepEqual(clean{camel.title()}List([' A ', '', 'b', ' A ']), ['a', 'b', 'a']);",
                        f"assert.deepEqual(clean{camel.title()}List([]), []);",
                        "",
                    ]
                ),
                ["trim", "lowercase", "duplicates"],
            )
        )

        source_path = f"src/{word}Params.js"
        test_path = f"test/{word}Params.test.js"
        rows.append(
            js_task(
                f"javascript_{word}_parse_params",
                f"Fix {source_path} so parse{camel.title()}Params parses ampersand-separated key=value pairs, decodes URI components, and skips malformed pairs.",
                source_path,
                f"function parse{camel.title()}Params(text) {{\n  return Object.fromEntries(text.split('&').map(part => part.split('=')));\n}}\n\nmodule.exports = {{ parse{camel.title()}Params }};\n",
                test_path,
                "\n".join(
                    [
                        "const assert = require('node:assert/strict');",
                        f"const {{ parse{camel.title()}Params }} = require('../src/{word}Params.js');",
                        "",
                        f"assert.deepEqual(parse{camel.title()}Params('name=Alice%20A&mode=fast&broken'), {{ name: 'Alice A', mode: 'fast' }});",
                        f"assert.deepEqual(parse{camel.title()}Params(''), {{}});",
                        "",
                    ]
                ),
                ["decode", "malformed", "key=value"],
            )
        )

        source_path = f"src/{word}Counts.js"
        test_path = f"test/{word}Counts.test.js"
        rows.append(
            js_task(
                f"javascript_{word}_count_by_status",
                f"Fix {source_path} so count{camel.title()}Statuses counts objects by their status property while ignoring missing or blank statuses.",
                source_path,
                f"function count{camel.title()}Statuses(items) {{\n  return items.length;\n}}\n\nmodule.exports = {{ count{camel.title()}Statuses }};\n",
                test_path,
                "\n".join(
                    [
                        "const assert = require('node:assert/strict');",
                        f"const {{ count{camel.title()}Statuses }} = require('../src/{word}Counts.js');",
                        "",
                        f"assert.deepEqual(count{camel.title()}Statuses([{{status: 'open'}}, {{status: 'closed'}}, {{status: 'open'}}, {{}}, {{status: ' '}}]), {{ open: 2, closed: 1 }});",
                        f"assert.deepEqual(count{camel.title()}Statuses([]), {{}});",
                        "",
                    ]
                ),
                ["status", "count", "blank"],
            )
        )

        source_path = f"src/{word}Flags.js"
        test_path = f"test/{word}Flags.test.js"
        rows.append(
            js_task(
                f"javascript_{word}_parse_flag",
                f"Fix {source_path} so parse{camel.title()}Flag accepts true/false, yes/no, and 1/0 strings case-insensitively, returning the fallback for unknown values.",
                source_path,
                f"function parse{camel.title()}Flag(value, fallback = false) {{\n  return Boolean(value);\n}}\n\nmodule.exports = {{ parse{camel.title()}Flag }};\n",
                test_path,
                "\n".join(
                    [
                        "const assert = require('node:assert/strict');",
                        f"const {{ parse{camel.title()}Flag }} = require('../src/{word}Flags.js');",
                        "",
                        f"assert.equal(parse{camel.title()}Flag(' YES '), true);",
                        f"assert.equal(parse{camel.title()}Flag('0'), false);",
                        f"assert.equal(parse{camel.title()}Flag('maybe', true), true);",
                        "",
                    ]
                ),
                ["true", "false", "fallback"],
            )
        )
    return rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("tasks/generated_250_programming_tasks.jsonl"))
    args = parser.parse_args()

    rows = python_rows() + javascript_rows()
    if len(rows) != 250:
        raise SystemExit(f"expected 250 rows, got {len(rows)}")
    write_jsonl(args.output, rows)
    print(f"wrote {len(rows)} tasks to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
