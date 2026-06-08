#!/usr/bin/env python3
"""Build generic tool-use SFT rows for programming agents."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


SYSTEM = """You are a programming agent using an OpenCode-like tool environment.
Use real tool calls when tools are needed; never print fake tool syntax.
Keep work bounded: inspect only relevant files, make targeted edits, verify, and stop.
If a tool result is missing, malformed, or contradictory, recover once with a smaller action.
Do not loop indefinitely. Return a concise structured final answer.
"""


SCENARIOS = [
    {
        "scenario": "python",
        "file": "src/inventory.py",
        "task": "fix remove_item so it raises KeyError when the item is absent",
        "verify": "run or describe the focused inventory tests",
    },
    {
        "scenario": "javascript",
        "file": "src/slugify.js",
        "task": "make slugify return an empty string for null, undefined, and blank input",
        "verify": "run or describe the focused slugify tests",
    },
    {
        "scenario": "typescript",
        "file": "src/stats.ts",
        "task": "make median avoid mutating the input array",
        "verify": "run or describe the focused median tests",
    },
    {
        "scenario": "go",
        "file": "limiter/limiter.go",
        "task": "make Allow return false when Limit is zero or negative",
        "verify": "run or describe the focused Go tests",
    },
    {
        "scenario": "rust",
        "file": "src/ini.rs",
        "task": "make parse_ini ignore semicolon comment lines",
        "verify": "run or describe the focused Rust tests",
    },
    {
        "scenario": "java",
        "file": "src/main/java/EmailValidator.java",
        "task": "trim surrounding whitespace before validating email addresses",
        "verify": "run or describe the focused validator tests",
    },
    {
        "scenario": "php",
        "file": "src/Money.php",
        "task": "format negative amounts with parentheses",
        "verify": "run or describe the focused money-format tests",
    },
    {
        "scenario": "csharp",
        "file": "PasswordPolicy.cs",
        "task": "require at least one symbol for strong passwords",
        "verify": "run or describe the focused password-policy tests",
    },
]


TASK_VARIANTS = [
    "modify @{file} to {task}. Preserve unrelated behavior.",
    "In @{file}, {task}. Keep the patch minimal and verify it.",
    "Fix the bug in @{file}: {task}. Do not rewrite the whole file.",
]


CREATION_SCENARIOS = [
    ("python", "src/cache.py", "create a small TTLCache class with get, set, delete, and expired-entry cleanup"),
    ("javascript", "src/debounce.js", "create a debounce function that preserves this binding and forwards arguments"),
    ("typescript", "src/result.ts", "create Result, ok, err, isOk, and isErr helpers with typed exports"),
    ("go", "retry/retry.go", "create a Retry function with max attempts and context cancellation"),
    ("rust", "src/ring_buffer.rs", "create a fixed-capacity RingBuffer with push and pop"),
    ("java", "src/main/java/RateLimiter.java", "create a simple token bucket rate limiter"),
    ("php", "src/CsvReader.php", "create a CSV reader that skips blank lines and returns associative rows"),
    ("csharp", "RetryPolicy.cs", "create a retry policy with max attempts and delay"),
]


CORRECTED_FAILURES = [
    {
        "row_id": "corrected_vram16_python_inventory_hidden_channel_1",
        "scenario": "python",
        "user": (
            "Fix src/inventory.py so remove_item raises KeyError when the item is absent. "
            "Preserve existing behavior for present items and verify with the focused tests."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read src/inventory.py and tests/test_inventory.py.",
            "2. Run the focused test command once to confirm the failing behavior.",
            "3. Edit remove_item so missing names use normal dictionary lookup semantics and raise KeyError.",
            "4. Verify with PYTHONPATH=. python tests/test_inventory.py.",
            "5. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: src/inventory.py.",
            "- Verification: PYTHONPATH=. python tests/test_inventory.py passed.",
            "- Remaining risk: none.",
            "Do not print hidden-channel markers, mixed-language reasoning text, fake tool-call syntax, or another tool step after verification has passed.",
        ]),
        "issue": "real_trace_hidden_channel_leak_and_missing_final_after_successful_edit",
    },
    {
        "row_id": "corrected_javascript_slugify_missing_final_after_verify_1",
        "scenario": "javascript",
        "user": (
            "Fix src/slugify.js so slugify returns an empty string for null, undefined, "
            "and blank input. Keep existing slug behavior and verify with the focused tests."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read src/slugify.js and test/slugify.test.js.",
            "2. Edit slugify so null and undefined return an empty string while blank strings still trim to an empty string.",
            "3. Verify with node test/slugify.test.js.",
            "4. Stop after the verification passes; do not search for unrelated files or perform extra writes.",
            "Final response:",
            "- Changed files: src/slugify.js.",
            "- Verification: node test/slugify.test.js passed.",
            "- Remaining risk: none.",
            "Do not continue calling tools after a successful focused verification, and do not omit the final response sections.",
        ]),
        "issue": "real_trace_missing_final_and_extra_tool_calls_after_successful_verification",
    },
    {
        "row_id": "corrected_python_tags_missing_final_after_verify_1",
        "scenario": "python",
        "user": (
            "Fix src/tags.py so normalize_tags strips whitespace, lowercases tags, removes blanks, "
            "and preserves first-seen order while removing duplicates. Verify with the focused tests."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read src/tags.py and tests/test_tags.py.",
            "2. Edit normalize_tags to strip, lowercase, skip blank tags, and preserve first-seen unique order.",
            "3. Verify with PYTHONPATH=. python tests/test_tags.py.",
            "4. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: src/tags.py.",
            "- Verification: PYTHONPATH=. python tests/test_tags.py passed.",
            "- Remaining risk: none.",
            "Do not repeat the verification after it passes, and do not omit the final response sections.",
        ]),
        "issue": "real_trace_missing_final_after_successful_python_verification",
    },
    {
        "row_id": "corrected_javascript_parse_bool_missing_final_after_verify_1",
        "scenario": "javascript",
        "user": (
            "Fix src/parseBool.js so parseBool accepts true/false strings case-insensitively, "
            "trims whitespace, and returns the provided default for null, undefined, or unrecognized values. "
            "Verify with the focused tests."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read src/parseBool.js and test/parseBool.test.js.",
            "2. Edit parseBool to trim and lowercase string input, handle boolean input, and return fallback for null, undefined, or unknown values.",
            "3. Verify with node test/parseBool.test.js.",
            "4. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: src/parseBool.js.",
            "- Verification: node test/parseBool.test.js passed.",
            "- Remaining risk: none.",
            "Do not continue calling tools after the focused verification passes, and do not omit the final response sections.",
        ]),
        "issue": "real_trace_missing_final_after_successful_javascript_verification",
    },
    {
        "row_id": "corrected_javascript_group_by_invalid_tool_recovery_1",
        "scenario": "javascript",
        "user": (
            "Create src/groupBy.js exporting groupBy(items, key). It should group objects by a property name "
            "or selector function, preserve item order within each group, and verify with the focused tests."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read test/groupBy.test.js and task.json to understand the expected module.",
            "2. If an unavailable tool is attempted or rejected, recover by using an available tool such as bash, glob, read, write, or edit.",
            "3. Create src/groupBy.js with a small implementation that accepts either a property name or selector function.",
            "4. Verify with node test/groupBy.test.js.",
            "5. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: src/groupBy.js.",
            "- Verification: node test/groupBy.test.js passed.",
            "- Remaining risk: none.",
            "Do not retry an unavailable tool repeatedly, and do not omit the final response sections after verification passes.",
        ]),
        "issue": "real_trace_invalid_tool_recovery_then_missing_final_after_successful_verification",
    },
    {
        "row_id": "corrected_swift_title_slug_wrong_verify_timeout_1",
        "scenario": "swift",
        "user": (
            "Fix Sources/Title.swift so titleSlug removes empty words caused by repeated whitespace, "
            "lowercases words, and joins them with single hyphens. Preserve existing simple title behavior "
            "and verify with the focused Swift test script."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read Sources/Title.swift and Tests/test_title.swift.",
            "2. Edit titleSlug to split on whitespace, lowercase each word, and join with hyphens.",
            "3. Verify with swift Sources/Title.swift Tests/test_title.swift.",
            "4. If running only the test file fails because titleSlug is not in scope, do not repeat that command; use the two-file command from the task metadata.",
            "5. Stop after one successful focused verification and return the required final sections.",
            "Final response:",
            "- Changed files: Sources/Title.swift.",
            "- Verification: swift Sources/Title.swift Tests/test_title.swift passed.",
            "- Remaining risk: none.",
            "Do not loop after a wrong verification command, and do not omit the final response sections.",
        ]),
        "issue": "real_trace_wrong_swift_verification_command_then_timeout",
    },
    {
        "row_id": "corrected_python_csv_extra_probing_after_pass_1",
        "scenario": "python",
        "user": (
            "Fix src/csv_rows.py so parse_rows skips blank lines and keeps the original header mapping. "
            "Preserve existing CSV behavior and verify with the focused tests."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read src/csv_rows.py and tests/test_csv_rows.py.",
            "2. Run PYTHONPATH=. python tests/test_csv_rows.py.",
            "3. If the focused test already passes, do not invent a broader issue or keep probing unrelated CSV variants.",
            "4. Stop and return the required final sections.",
            "Final response:",
            "- Changed files: none.",
            "- Verification: PYTHONPATH=. python tests/test_csv_rows.py passed.",
            "- Remaining risk: none.",
            "Do not continue exploratory tool calls after the requested focused verification passes.",
        ]),
        "issue": "real_trace_extra_probing_and_timeout_after_focused_verification_passed",
    },
    {
        "row_id": "corrected_python_csv_do_not_edit_tests_after_pass_1",
        "scenario": "python",
        "user": (
            "Fix src/csv_rows.py so parse_rows skips blank lines and keeps the original header mapping. "
            "Preserve existing CSV behavior and verify with the focused tests."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read src/csv_rows.py and tests/test_csv_rows.py.",
            "2. Make the smallest production-code edit needed in src/csv_rows.py.",
            "3. Verify with PYTHONPATH=. python tests/test_csv_rows.py.",
            "4. Do not edit the test file just to print a success message or create extra confirmation output.",
            "5. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: src/csv_rows.py.",
            "- Verification: PYTHONPATH=. python tests/test_csv_rows.py passed.",
            "- Remaining risk: none.",
            "Do not modify tests unless the user asked for test changes, and do not keep calling tools after verification passes.",
        ]),
        "issue": "real_trace_unnecessary_test_edit_and_extra_verification_after_success",
    },
    {
        "row_id": "corrected_javascript_group_by_hidden_channel_parallel_1",
        "scenario": "javascript",
        "user": (
            "Create src/groupBy.js exporting groupBy(items, key). It should group objects by a property name "
            "or selector function, preserve item order within each group, and verify with the focused tests."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read test/groupBy.test.js.",
            "2. Create src/groupBy.js with groupBy(items, key), supporting a property name or selector function.",
            "3. Verify with node test/groupBy.test.js.",
            "4. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: src/groupBy.js.",
            "- Verification: node test/groupBy.test.js passed.",
            "- Remaining risk: none.",
            "Do not print hidden-channel markers and do not rerun the same passing verification unnecessarily.",
        ]),
        "issue": "real_trace_hidden_channel_leak_and_missing_final_after_successful_javascript_creation",
    },
    {
        "row_id": "corrected_javascript_parse_bool_repeat_verify_single_4060ti_1",
        "scenario": "javascript",
        "user": (
            "Fix src/parseBool.js so parseBool accepts true/false strings case-insensitively, "
            "trims whitespace, and returns the provided default for null, undefined, or unrecognized values. "
            "Verify with the focused tests."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read src/parseBool.js and test/parseBool.test.js.",
            "2. Edit parseBool so strings are trimmed and lowercased before comparing true or false.",
            "3. Preserve boolean input and return fallback for null, undefined, or unrecognized values.",
            "4. Verify once with node test/parseBool.test.js.",
            "5. After that command passes, stop tool use and return the required final sections.",
            "Final response:",
            "- Changed files: src/parseBool.js.",
            "- Verification: node test/parseBool.test.js passed.",
            "- Remaining risk: none.",
            "Do not rerun the same passing command, do not keep searching for package metadata, and do not omit the final response sections.",
        ]),
        "issue": "real_trace_repeated_verification_and_missing_final_after_successful_javascript_fix",
    },
    {
        "row_id": "corrected_javascript_group_by_extra_probe_after_pass_1",
        "scenario": "javascript",
        "user": (
            "Create src/groupBy.js exporting groupBy(items, key). It should group objects by a property name "
            "or selector function, preserve item order within each group, and verify with the focused tests."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read test/groupBy.test.js and any task metadata needed to confirm exports.",
            "2. Create src/groupBy.js with a minimal groupBy implementation that accepts a property name or selector function.",
            "3. Verify once with node test/groupBy.test.js.",
            "4. If verification passes, do not read unrelated config files, rerun the same test, or search for more project metadata.",
            "5. Stop and return the required final sections.",
            "Final response:",
            "- Changed files: src/groupBy.js.",
            "- Verification: node test/groupBy.test.js passed.",
            "- Remaining risk: none.",
            "Do not perform extra probing after successful focused verification, and do not omit the final response sections.",
        ]),
        "issue": "real_trace_extra_config_probing_and_missing_final_after_successful_javascript_creation",
    },
    {
        "row_id": "corrected_rust_ini_missing_final_after_cargo_test_1",
        "scenario": "rust",
        "user": (
            "Fix src/ini.rs so parse_ini ignores lines whose first non-whitespace character is a semicolon. "
            "Preserve hash comments and key parsing."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read src/ini.rs and confirm the existing comment handling.",
            "2. Make the smallest edit so trimmed lines starting with ';' are skipped like hash comments.",
            "3. Verify with cargo test.",
            "4. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: src/ini.rs.",
            "- Verification: cargo test passed.",
            "- Remaining risk: none.",
            "Do not continue with more tool calls after cargo test passes, and do not omit the final response sections.",
        ]),
        "issue": "real_trace_missing_final_after_successful_rust_edit_and_cargo_test",
    },
    {
        "row_id": "corrected_csharp_password_bounded_verification_1",
        "scenario": "csharp",
        "user": (
            "Fix PasswordPolicy.cs so IsStrong requires at least one symbol in addition to length, uppercase, "
            "lowercase, and digit requirements."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read PasswordPolicy.cs and PasswordPolicyTest.cs.",
            "2. Edit IsStrong to require at least one character where !char.IsLetterOrDigit(c).",
            "3. Verify with csc PasswordPolicy.cs PasswordPolicyTest.cs && mono PasswordPolicyTest.exe.",
            "4. If the compiler succeeds but the local runtime command is unavailable or cannot execute the produced file, stop instead of trying unrelated commands.",
            "Final response:",
            "- Changed files: PasswordPolicy.cs.",
            "- Verification: csc PasswordPolicy.cs PasswordPolicyTest.cs compiled successfully; runtime execution was blocked by the local executable/runtime environment.",
            "- Remaining risk: focused runtime test was not executed in this environment.",
            "Do not loop through unrelated runtime probes after a bounded verification blocker, and do not omit the final response sections.",
        ]),
        "issue": "real_trace_unbounded_csharp_runtime_probe_after_successful_edit_and_compile",
    },
    {
        "row_id": "corrected_go_parse_port_missing_runtime_bounded_1",
        "scenario": "go",
        "user": (
            "Fix ports/ports.go so ParsePort accepts integers from 1 through 65535 and rejects zero, "
            "negatives, non-numeric values, and values above 65535. Verify with the focused Go tests."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read ports/ports.go and ports/ports_test.go.",
            "2. Edit ParsePort to parse the integer, return the parse error for non-numeric input, and reject values outside 1..65535.",
            "3. Verify with go test ./ports.",
            "4. If the Go runtime is unavailable, do not keep probing unrelated paths or mutate the discovered workspace path.",
            "Final response:",
            "- Changed files: ports/ports.go.",
            "- Verification: go test ./ports could not run because go was not available in PATH.",
            "- Remaining risk: focused Go tests were not executed in this environment.",
            "Do not retry with hallucinated temporary-directory paths after a missing runtime, and do not omit the final response sections.",
        ]),
        "issue": "real_trace_successful_go_edit_then_missing_runtime_and_path_probe",
    },
    {
        "row_id": "corrected_rust_boolish_avoid_broad_glob_after_pass_1",
        "scenario": "rust",
        "user": (
            "Fix src/boolish.rs so parse_bool accepts true/false and yes/no case-insensitively "
            "after trimming whitespace, and returns None for unknown values. Verify with cargo test."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read the named target file src/boolish.rs directly instead of globbing every Rust file.",
            "2. Edit parse_bool to match on value.trim().to_lowercase().as_str().",
            "3. Preserve None for unknown values.",
            "4. Verify with cargo test.",
            "5. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: src/boolish.rs.",
            "- Verification: cargo test passed.",
            "- Remaining risk: none.",
            "Do not use broad globs that return truncated file lists when the prompt names the target file, and do not omit final sections after cargo test passes.",
        ]),
        "issue": "real_trace_broad_glob_truncation_then_successful_rust_edit_missing_final",
    },
    {
        "row_id": "corrected_php_query_missing_runtime_bounded_1",
        "scenario": "php",
        "user": (
            "Fix src/Query.php so parseQuery keeps repeated query parameters as arrays while preserving "
            "single-value parameters as strings. Verify with the focused PHP test."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read src/Query.php and tests/QueryTest.php.",
            "2. Edit parseQuery so the first occurrence stores a string and repeated occurrences promote the value to an array.",
            "3. Verify with php tests/QueryTest.php.",
            "4. If php is missing, stop after one confirmation instead of searching many binary locations.",
            "Final response:",
            "- Changed files: src/Query.php.",
            "- Verification: php tests/QueryTest.php could not run because php was not available in PATH.",
            "- Remaining risk: focused PHP test was not executed in this environment.",
            "Do not keep probing php, composer, and filesystem locations after the runtime is unavailable, and do not omit the final response sections.",
        ]),
        "issue": "real_trace_successful_php_edit_then_unbounded_missing_runtime_probe",
    },
    {
        "row_id": "corrected_java_clamp_wrong_verify_then_pass_no_final_1",
        "scenario": "java",
        "user": (
            "Fix src/main/java/Scores.java so clampScore returns 0 for negative scores, 100 for values above 100, "
            "and the original value for scores already in range. Verify with the focused Java test."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read src/main/java/Scores.java and src/test/java/ScoresTest.java.",
            "2. Edit clampScore with the three bounded cases: below 0, above 100, and in range.",
            "3. Verify using the provided command shape: javac -d build src/main/java/Scores.java src/test/java/ScoresTest.java && java -cp build ScoresTest.",
            "4. If a wrong Java classpath command fails, recover once with the provided command instead of copying class files around.",
            "5. Stop after the focused verification passes and return the final sections.",
            "Final response:",
            "- Changed files: src/main/java/Scores.java.",
            "- Verification: javac -d build src/main/java/Scores.java src/test/java/ScoresTest.java && java -cp build ScoresTest passed.",
            "- Remaining risk: none.",
            "Do not run cleanup or echo commands after a passing test, and do not omit the final response sections.",
        ]),
        "issue": "real_trace_wrong_java_verify_recovery_then_extra_commands_and_missing_final",
    },
    {
        "row_id": "corrected_python_json_config_hidden_channel_path_typo_1",
        "scenario": "python",
        "user": (
            "Update config/app.json so retries and timeout_ms are numbers, not strings, "
            "while preserving the existing service name. Verify with the focused JSON validation script."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read config/app.json and tests/check_config.py.",
            "2. Edit only config/app.json so retries is 3 and timeout_ms is 5000 as JSON numbers.",
            "3. Verify with python tests/check_config.py.",
            "4. If a discovered path has already been returned by a tool, reuse it exactly; do not retype a different temporary directory or project name.",
            "5. Stop after verification and return the required final sections.",
            "Final response:",
            "- Changed files: config/app.json.",
            "- Verification: python tests/check_config.py passed.",
            "- Remaining risk: none.",
            "Do not print hidden-channel markers, and do not continue with typoed paths after a valid tool result has identified the workspace.",
        ]),
        "issue": "real_trace_hidden_channel_leak_and_temp_path_typo_during_json_config_edit",
    },
    {
        "row_id": "corrected_python_toml_boolean_port_missing_final_1",
        "scenario": "python",
        "user": (
            "Fix pyproject.toml so tool.agent.enabled is a boolean true and port is the integer 8000. "
            "Preserve the existing project name and verify with the focused TOML check."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read pyproject.toml.",
            "2. Change enabled from the string \"true\" to the TOML boolean true.",
            "3. Change port from the string \"8000\" to the TOML integer 8000.",
            "4. Verify with python tests/check_toml.py.",
            "5. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: pyproject.toml.",
            "- Verification: python tests/check_toml.py passed.",
            "- Remaining risk: none.",
            "Do not inspect files again after the focused TOML check passes, and do not omit Changed files or Remaining risk.",
        ]),
        "issue": "real_trace_successful_toml_edit_and_verify_then_missing_final",
    },
    {
        "row_id": "corrected_javascript_package_json_recover_invalid_json_1",
        "scenario": "javascript",
        "user": (
            "Fix package.json so the project treats src/index.js as an ES module. "
            "Preserve the package name and verify with the focused import test."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read package.json and test/import.test.js.",
            "2. Add \"type\": \"module\" while preserving existing fields and valid JSON syntax.",
            "3. Verify with node test/import.test.js.",
            "4. If an edit creates invalid JSON, repair package.json once with a complete valid JSON object.",
            "5. Stop after the import test passes and return the final sections.",
            "Final response:",
            "- Changed files: package.json.",
            "- Verification: node test/import.test.js passed.",
            "- Remaining risk: none.",
            "Do not leave trailing commas in JSON, do not drop unrelated existing fields, and do not continue reading files after verification passes.",
        ]),
        "issue": "real_trace_invalid_package_json_recovery_then_extra_read_and_missing_final",
    },
    {
        "row_id": "corrected_python_frontmatter_verify_repair_missing_final_1",
        "scenario": "python",
        "user": (
            "Fix docs/page.md frontmatter so published is the boolean true and priority is the integer 2. "
            "Preserve the existing title and verify with the focused frontmatter check."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read docs/page.md and tests/check_frontmatter.py.",
            "2. Edit only docs/page.md so published is unquoted true and priority is unquoted 2.",
            "3. Verify with python tests/check_frontmatter.py.",
            "4. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: docs/page.md.",
            "- Verification: python tests/check_frontmatter.py passed.",
            "- Remaining risk: none.",
            "Do not omit final sections after the focused check passes, and do not keep probing unrelated Markdown or metadata files.",
        ]),
        "issue": "real_trace_successful_frontmatter_repair_then_missing_final",
    },
    {
        "row_id": "corrected_python_report_wrong_verify_recovery_extra_probe_1",
        "scenario": "python",
        "user": (
            "Fix src/report.py so build_report returns a JSON-serializable dictionary with status and "
            "changed_files. Verify with the focused Python test and do not print JSON as fake tool output."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read src/report.py and tests/test_report.py.",
            "2. Edit build_report to return {\"status\": \"ok\", \"changed_files\": files}.",
            "3. Verify with PYTHONPATH=. python tests/test_report.py.",
            "4. If plain python tests/test_report.py fails with ModuleNotFoundError for src, recover once with PYTHONPATH=. and then stop after the pass.",
            "Final response:",
            "- Changed files: src/report.py.",
            "- Verification: PYTHONPATH=. python tests/test_report.py passed.",
            "- Remaining risk: none.",
            "Do not read AGENTS.md, glob unrelated files, or continue probing after the focused verification passes; do not print JSON as fake tool syntax.",
        ]),
        "issue": "real_trace_wrong_python_verify_recovery_then_extra_probe_after_pass",
    },
    {
        "row_id": "corrected_php_money_edit_verify_finalize_1",
        "scenario": "php",
        "user": (
            "Fix src/Money.php so negative amounts are formatted with parentheses, for example "
            "-1234 cents becomes ($12.34). Preserve positive formatting and verify with the focused PHP test."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read src/Money.php and tests/MoneyTest.php.",
            "2. Edit formatCents to format the absolute cent value and wrap the result in parentheses when the input is negative.",
            "3. Verify with php tests/MoneyTest.php.",
            "4. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: src/Money.php.",
            "- Verification: php tests/MoneyTest.php passed.",
            "- Remaining risk: none.",
            "Do not stop after only editing the file; verify the focused test when the runtime is available and do not omit final sections.",
        ]),
        "issue": "real_trace_successful_php_edit_then_missing_verification_and_final",
    },
    {
        "row_id": "corrected_java_email_trim_wrong_verify_extra_probe_1",
        "scenario": "java",
        "user": (
            "Fix src/main/java/EmailValidator.java so validation trims surrounding whitespace before checking "
            "the email format. Preserve rejection of malformed addresses and verify with the focused Java test."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read src/main/java/EmailValidator.java and src/test/java/EmailValidatorTest.java.",
            "2. Edit isValid so it uses a trimmed local value for the email checks.",
            "3. Verify with javac -d build src/main/java/EmailValidator.java src/test/java/EmailValidatorTest.java && java -cp build EmailValidatorTest.",
            "4. If a direct java source-file run fails to resolve EmailValidator, recover once with the javac -d build command instead of probing build tools or AGENTS.md.",
            "5. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: src/main/java/EmailValidator.java.",
            "- Verification: javac -d build src/main/java/EmailValidator.java src/test/java/EmailValidatorTest.java && java -cp build EmailValidatorTest passed.",
            "- Remaining risk: none.",
            "Do not search for Maven or Gradle files when the focused command is already provided, and do not omit final sections after the Java test passes.",
        ]),
        "issue": "real_trace_java_extra_config_probe_and_wrong_verify_recovery_without_final",
    },
    {
        "row_id": "corrected_python_ttl_cache_read_tests_before_create_1",
        "scenario": "python",
        "user": (
            "Create src/cache.py with a small TTLCache class supporting set, get, delete, and cleanup of expired "
            "entries. Add or update focused tests if useful and verify."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read tests/test_cache.py before creating src/cache.py so the constructor and method signatures match the fixture.",
            "2. Create TTLCache with __init__(default_ttl, now), set(key, value, ttl=None), get(key), delete(key), and cleanup().",
            "3. Use the injected now callable for expiration checks and default_ttl when set is called without an explicit ttl.",
            "4. Verify with PYTHONPATH=. python tests/test_cache.py.",
            "5. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: src/cache.py.",
            "- Verification: PYTHONPATH=. python tests/test_cache.py passed.",
            "- Remaining risk: none.",
            "Do not write a new API before reading the focused tests, and do not continue repairing blindly after the expected signatures are visible.",
        ]),
        "issue": "real_trace_python_creation_before_reading_tests_then_api_mismatch_timeout",
    },
    {
        "row_id": "corrected_javascript_settings_json_verify_then_final_1",
        "scenario": "javascript",
        "user": (
            "Fix config/settings.json so it is valid JSON with enableTools true and maxSteps 8. "
            "Do not change the existing profile name. Verify with the focused Node JSON parse script."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read config/settings.json and test/check-settings.js.",
            "2. Edit config/settings.json into valid JSON with profile preserved, enableTools as boolean true, and maxSteps as number 8.",
            "3. Verify with node test/check-settings.js.",
            "4. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: config/settings.json.",
            "- Verification: node test/check-settings.js passed.",
            "- Remaining risk: none.",
            "Do not run unrelated probes after the focused JSON parse script passes, and do not omit the final response sections.",
        ]),
        "issue": "real_trace_successful_json_settings_edit_and_verify_then_missing_final",
    },
    {
        "row_id": "corrected_javascript_deep_get_hidden_channel_repeat_verify_1",
        "scenario": "javascript",
        "user": (
            "Fix src/deepGet.js so deepGet(obj, path, fallback) supports dot-separated paths and returns fallback "
            "when any segment is missing. Preserve falsy existing values and verify with the focused tests."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read src/deepGet.js and test/deepGet.test.js.",
            "2. Edit deepGet to split the path on dots, walk each segment, and return fallback only when a segment is missing.",
            "3. Preserve existing falsy values such as false and 0 by returning the resolved value directly.",
            "4. Verify once with node test/deepGet.test.js.",
            "5. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: src/deepGet.js.",
            "- Verification: node test/deepGet.test.js passed.",
            "- Remaining risk: none.",
            "Do not print hidden-channel markers, do not repeat the same passing verification, and do not keep searching for package metadata after the focused test passes.",
        ]),
        "issue": "real_trace_hidden_channel_leak_repeated_verification_and_missing_final_after_deep_get_fix",
    },
    {
        "row_id": "corrected_csharp_password_test_first_repair_missing_final_1",
        "scenario": "csharp",
        "user": (
            "Fix PasswordPolicy.cs so IsStrong requires at least one symbol in addition to length, uppercase, "
            "lowercase, and digit requirements. Verify with the focused C# test command."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read PasswordPolicy.cs and PasswordPolicyTest.cs.",
            "2. Run csc PasswordPolicy.cs PasswordPolicyTest.cs && mono PasswordPolicyTest.exe once if the expected failure is unclear.",
            "3. Edit IsStrong to require at least one non-letter, non-digit, non-whitespace symbol.",
            "4. Verify again with csc PasswordPolicy.cs PasswordPolicyTest.cs && mono PasswordPolicyTest.exe.",
            "5. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: PasswordPolicy.cs.",
            "- Verification: csc PasswordPolicy.cs PasswordPolicyTest.cs && mono PasswordPolicyTest.exe passed.",
            "- Remaining risk: none.",
            "Do not omit the final sections after the focused test passes, and do not continue probing after the repair is verified.",
        ]),
        "issue": "real_trace_csharp_test_first_failure_then_repair_and_missing_final_after_pass",
    },
    {
        "row_id": "corrected_javascript_manifest_classifier_false_positive_extra_read_1",
        "scenario": "javascript",
        "user": (
            "Fix manifest.json so tools is an array of strings [\"read\", \"edit\"] instead of a comma-separated "
            "string. Preserve name and verify with the focused Node check."
        ),
        "assistant": "\n".join([
            "Plan:",
            "1. Read manifest.json and test/check-manifest.js.",
            "2. Edit only manifest.json so tools is [\"read\", \"edit\"] while name remains unchanged.",
            "3. Verify with node test/check-manifest.js.",
            "4. Stop after successful verification and return the required final sections.",
            "Final response:",
            "- Changed files: manifest.json.",
            "- Verification: node test/check-manifest.js passed.",
            "- Remaining risk: none.",
            "Do not read AGENTS.md or re-read manifest.json after the focused Node check passes, and do not rely on instruction-file text as a substitute for a final response.",
        ]),
        "issue": "real_trace_manifest_passed_check_then_extra_read_and_classifier_false_positive",
    },
]


def row(row_id: str, user: str, assistant: str, kind: str, scenario: str, source: str = "synthetic_global_tool_invariant") -> dict:
    return {
        "id": row_id,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": user},
            {"role": "assistant", "content": assistant},
        ],
        "metadata": {
            "kind": kind,
            "scenario": scenario,
            "source": source,
        },
    }


def assistant_for_existing(file: str, verify: str) -> str:
    return "\n".join([
        "Plan:",
        f"1. Read {file} and only the directly related test or caller files.",
        "2. Identify the smallest function or block that must change.",
        "3. Apply one targeted edit using the available editing tool.",
        f"4. Verify the change: {verify}.",
        "5. If verification fails, make at most one focused repair based on the failure.",
        "Final response:",
        "- Changed files: list exact paths.",
        "- Verification: state the command/check result.",
        "- Remaining risk: state none or one concrete risk.",
        "Do not print fake tool-call markup, hidden-channel text, empty tool results, or repeated retry narration.",
    ])


def assistant_for_creation(file: str) -> str:
    return "\n".join([
        "Plan:",
        f"1. Create {file} with the complete requested implementation in one focused edit.",
        "2. Inspect the written file to catch syntax, export, or naming mistakes.",
        "3. Run or describe a focused verification for the new module.",
        "4. If a typo or syntax error is found, make one small repair and verify again.",
        "Final response:",
        "- Changed files: list exact paths.",
        "- Verification: state the command/check result.",
        "- Remaining risk: state none or one concrete risk.",
        "Do not print fake tool-call markup, hidden-channel text, empty tool results, or repeated retry narration.",
    ])


def assistant_for_loop_control() -> str:
    return "\n".join([
        "Plan:",
        "1. Stop expanding the search scope.",
        "2. Summarize the last concrete tool result.",
        "3. Choose one smaller action: read one file, edit one block, or report a blocker.",
        "4. If the same tool failure repeats once, stop and return a blocker with the exact failing command/result.",
        "Final response must be structured with Changed files, Verification, and Remaining risk.",
        "Do not retry indefinitely, invent successful verification, or print fake tool-call text.",
    ])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("data/global_tool_sft_seed.jsonl"))
    args = parser.parse_args()

    rows: list[dict] = []
    for scenario_index, case in enumerate(SCENARIOS, start=1):
        for variant_index, template in enumerate(TASK_VARIANTS, start=1):
            rows.append(row(
                f"modify_{scenario_index}_{variant_index}",
                template.format(**case),
                assistant_for_existing(case["file"], case["verify"]),
                "targeted_programming_modification",
                case["scenario"],
            ))

    for scenario_index, (scenario, file, task) in enumerate(CREATION_SCENARIOS, start=1):
        rows.append(row(
            f"create_{scenario_index}",
            f"Create {file}: {task}. Keep it self-contained and verify it.",
            assistant_for_creation(file),
            "programming_creation",
            scenario,
        ))

    for index, prompt in enumerate([
        "The previous tool call returned an empty result twice while editing a function. Continue safely.",
        "The model started printing fake tool-call markup instead of invoking tools. Recover and finish the task.",
        "A test command failed with a syntax error after an edit. Decide the next bounded step.",
        "A search over the whole repository is taking too long. Continue without looping.",
        "The same edit was attempted twice and produced no change. Continue safely.",
        ], start=1):
        rows.append(row(
            f"loop_control_{index}",
            prompt,
            assistant_for_loop_control(),
            "loop_control",
            "generic",
        ))

    for failure in CORRECTED_FAILURES:
        corrected = row(
            failure["row_id"],
            failure["user"],
            failure["assistant"],
            "corrected_target_failure",
            failure["scenario"],
            source="real_trace_rewrite",
        )
        corrected["metadata"]["issue"] = failure["issue"]
        rows.append(corrected)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as handle:
        for item in rows:
            handle.write(json.dumps(item, ensure_ascii=False) + "\n")
    print(f"wrote {len(rows)} rows to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
