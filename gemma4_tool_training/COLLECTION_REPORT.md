# Collection Report

## 2026-06-08 Local OpenCode Collection

OpenCode was run locally against forwarded vLLM endpoints:

- Spark endpoint: `http://127.0.0.1:8001/v1`
- 16GB endpoint: `http://127.0.0.1:8002/v1`
- Model served by both: `google/gemma-4-12B-it-qat-w4a16-ct`

Raw logs are stored under `traces/generic/` and are intentionally ignored by
git. They are analysis material only.

Collected traces:

- `spark/python_inventory_missing_key`: completed, failed acceptance because
  final sections were missing. First run was noisy because the original fixture
  depended on missing `pytest`.
- `vram16/python_inventory_missing_key`: first run timed out around repeated
  missing-`pytest` verification. After fixture repair, it edited and verified
  successfully but leaked hidden-channel markers and missed final sections.
- `spark/javascript_slugify_blank`: edited and verified successfully, then ran
  extra verification and missed final sections.
- `vram16/javascript_slugify_blank`: edited and verified successfully, then
  continued with unnecessary file operations and missed final sections.

Curated rows added:

- `corrected_vram16_python_inventory_hidden_channel_1`
- `corrected_javascript_slugify_missing_final_after_verify_1`
- `corrected_python_tags_missing_final_after_verify_1`
- `corrected_javascript_parse_bool_missing_final_after_verify_1`
- `corrected_javascript_group_by_invalid_tool_recovery_1`
- `corrected_swift_title_slug_wrong_verify_timeout_1`
- `corrected_python_csv_extra_probing_after_pass_1`
- `corrected_javascript_group_by_hidden_channel_parallel_1`
- `corrected_python_csv_do_not_edit_tests_after_pass_1`
- `corrected_javascript_parse_bool_repeat_verify_single_4060ti_1`
- `corrected_javascript_group_by_extra_probe_after_pass_1`
- `corrected_rust_ini_missing_final_after_cargo_test_1`
- `corrected_csharp_password_bounded_verification_1`
- `corrected_go_parse_port_missing_runtime_bounded_1`
- `corrected_rust_boolish_avoid_broad_glob_after_pass_1`
- `corrected_php_query_missing_runtime_bounded_1`
- `corrected_java_clamp_wrong_verify_then_pass_no_final_1`
- `corrected_python_json_config_hidden_channel_path_typo_1`
- `corrected_python_toml_boolean_port_missing_final_1`
- `corrected_javascript_package_json_recover_invalid_json_1`
- `corrected_python_frontmatter_verify_repair_missing_final_1`
- `corrected_python_report_wrong_verify_recovery_extra_probe_1`
- `corrected_php_money_edit_verify_finalize_1`
- `corrected_java_email_trim_wrong_verify_extra_probe_1`
- `corrected_python_ttl_cache_read_tests_before_create_1`
- `corrected_javascript_settings_json_verify_then_final_1`
- `corrected_javascript_deep_get_hidden_channel_repeat_verify_1`
- `corrected_csharp_password_test_first_repair_missing_final_1`
- `corrected_javascript_manifest_classifier_false_positive_extra_read_1`

Observed failure classes:

- hidden-channel leakage in visible text
- no `Changed files` / `Verification` / `Remaining risk` final response
- unnecessary extra tool calls after successful focused verification
- loop/timeout risk when verification tooling is unavailable

Next collection changes:

- Keep using local OpenCode against the forwarded endpoints.
- Use isolated OpenCode state directories for each collector task. Parallel
  Spark collection with `--parallel 2` completed without database locking.
- Prefer fixtures with standard-library or already-available verification
  commands, so failures reflect model behavior rather than missing dependencies.

## 2026-06-08 Spark Parallel Batch

Command shape:

```sh
node collect_generic_traces.js \
  --source-label spark_parallel \
  --endpoint http://127.0.0.1:8001/v1 \
  --model spark-vllm/active-model \
  --ids python_normalize_tags_unique,javascript_parse_bool_defaults,javascript_group_by_key \
  --parallel 2
```

Results:

- `python_normalize_tags_unique`: edited and verified successfully, then missed
  final sections.
- `javascript_parse_bool_defaults`: edited and verified successfully, then
  missed final sections.
- `javascript_group_by_key`: attempted unavailable `ls` tool, recovered with
  valid tools, created and verified the file, then missed final sections.

## 2026-06-08 Spark Parallel 3 Batch

Command shape:

```sh
node collect_generic_traces.js \
  --source-label spark_parallel3 \
  --endpoint http://127.0.0.1:8001/v1 \
  --model spark-vllm/active-model \
  --ids swift_slug_title_empty_words,python_csv_skip_blank,python_create_ttl_cache,javascript_parse_bool_defaults,javascript_group_by_key \
  --parallel 3
```

Results:

- `python_create_ttl_cache`: failed early after a malformed path caused an
  external-directory permission rejection. Not added as a curated row.
- `javascript_parse_bool_defaults`: edited and verified; a previous equivalent
  corrected row already covers this failure class.
- `python_csv_skip_blank`: focused verification passed, then the model kept
  probing extra CSV cases until timeout.
- `javascript_group_by_key`: leaked hidden-channel markers, created and
  verified the file, then missed final sections.
- `swift_slug_title_empty_words`: Swift fixture added. The model inspected and
  edited correctly, but ran the wrong one-file Swift command, failed to recover
  to the provided two-file verification command, and timed out.

Parallelism 3 completed without OpenCode database locking.

## 2026-06-08 Dual Remote Parallel 5 Batch

Two local collector batches were run concurrently:

- Spark endpoint `8001`, `--parallel 5`
- 4060 Ti / 16GB endpoint `8002`, `--parallel 5`

This collected traces from both remotes, but the useful-example rate was poor:

- Spark: 4 completed traces, 5 timeouts
- 4060 Ti / 16GB: 1 completed trace, 8 timeouts

No OpenCode database locking was observed because each task has isolated
OpenCode state. However, parallelism 5 overloads useful throughput for this
model/runner setup: it creates many timeout traces and few clean protocol
failures. Use parallelism 3 for regular collection unless the endpoint is made
faster or timeout budgets are increased.

Curated row added from this batch:

- `corrected_python_csv_do_not_edit_tests_after_pass_1`

Rejected as low-value:

- generic loop-control traces that emitted only a step-start event and no
  assistant/tool content
- timeout traces with no meaningful visible assistant or tool behavior

## 2026-06-08 Corrected Spark 4 / 4060 Ti 1 Batch

The collector was rerun with the user-requested caps:

- Spark endpoint `8001`, `--parallel 4`
- 4060 Ti / 16GB endpoint `8002`, `--parallel 1`

This fixed the 4060 Ti overload from the previous batch. Spark parallelism 4
still produced several low-signal timeouts, so the batch was reviewed manually
before adding any rows.

Useful traces converted into corrected targets:

- `vram16_single_b/javascript_parse_bool_defaults`: edited correctly and the
  focused test passed, but the model reran the same passing test and never
  returned the final structured sections.
- `spark_p4b/javascript_group_by_key`: created and verified the module, then
  reran verification and kept probing unrelated project/config files instead
  of stopping with a final answer.

Curated rows added from this batch:

- `corrected_javascript_parse_bool_repeat_verify_single_4060ti_1`
- `corrected_javascript_group_by_extra_probe_after_pass_1`

Rejected as low-value:

- Spark and 4060 Ti timeout traces that only read files and did not reach an
  edit, verification, or visible final-answer failure.
- Swift timeout traces that mostly repeated the already-covered wrong
  verification-command failure class.

Recommended collection settings after this run:

- 4060 Ti / 16GB: keep `--parallel 1`.
- Spark: use `--parallel 4` only when faster collection is more important than
  useful-example rate; otherwise `--parallel 3` remains cleaner.

## 2026-06-08 Language-Diversity Batch

The next collector run kept the same caps while biasing toward non-Python and
non-JavaScript tasks:

- Spark endpoint `8001`, `--parallel 4`, tasks: TypeScript, Go, Rust, Java.
- 4060 Ti / 16GB endpoint `8002`, `--parallel 1`, tasks: PHP, C#, Swift.

Results:

- `rust_ini_semicolon_comments`: edited `src/ini.rs`, verified with
  `cargo test`, then missed the final structured sections.
- `csharp_password_symbol`: edited `PasswordPolicy.cs` correctly and compiled
  with `csc`, but then kept probing runtime execution after the local
  executable/runtime path was blocked instead of returning a bounded
  verification result.
- `php_money_negative_parentheses`: accepted by the collector. Kept as raw
  collection signal, not converted into a corrected-failure row.

Curated rows added from this batch:

- `corrected_rust_ini_missing_final_after_cargo_test_1`
- `corrected_csharp_password_bounded_verification_1`

Rejected as low-value:

- TypeScript and Go traces where path hallucinations created external-directory
  permission rejections before a meaningful edit/verification sequence.
- Java and Swift timeout traces that did not add a new failure class beyond
  missing final sections or already-covered verification-command loops.

## 2026-06-08 Expanded Task Bank Batch

Six new collection prompts were added to broaden the fixture bank:

- `python_parse_duration_units`
- `javascript_deep_get_default`
- `go_parse_port_range`
- `rust_parse_bool_yes_no`
- `php_query_parse_repeated`
- `java_clamp_score`

The collector was run with the current caps:

- Spark endpoint `8001`, `--parallel 4`, tasks: Python, JavaScript, Go, Rust.
- 4060 Ti / 16GB endpoint `8002`, `--parallel 1`, tasks: PHP, Java.

Useful traces converted into corrected targets:

- `go_parse_port_range`: edited the parser correctly, then hit missing `go`
  runtime and continued into a hallucinated temp-directory path probe instead
  of stopping with a bounded verification blocker.
- `rust_parse_bool_yes_no`: used a broad `src/**/*.rs` glob that returned a
  truncated result set even though the target file was named, then edited and
  verified successfully with `cargo test` but missed the final sections.
- `php_query_parse_repeated`: edited correctly, then kept probing for `php`,
  `composer`, and multiple binary locations after the runtime was unavailable.
- `java_clamp_score`: edited correctly, recovered from wrong classpath
  commands to a passing Java run, then performed extra cleanup/check commands
  and missed the final sections.

Curated rows added from this batch:

- `corrected_go_parse_port_missing_runtime_bounded_1`
- `corrected_rust_boolish_avoid_broad_glob_after_pass_1`
- `corrected_php_query_missing_runtime_bounded_1`
- `corrected_java_clamp_wrong_verify_then_pass_no_final_1`

Rejected as low-value:

- `javascript_deep_get_default`: changed underscores to hyphens in the temp
  workspace path and hit an external-directory rejection before a useful edit.
- `python_parse_duration_units`: timed out after locating files and tests
  without reaching a distinct edit or verification outcome.

## 2026-06-08 Structured-File Real-Failure Batch

Six new collection prompts were added for structured-file and newline-sensitive
cases:

- `python_envfile_crlf_comments`
- `python_json_config_numbers`
- `javascript_package_type_module`
- `javascript_json_no_trailing_comments`
- `python_toml_boolean_port`
- `java_properties_trim_blank`

The collector was run with the current caps:

- Spark endpoint `8001`, `--parallel 4`, tasks: Python CRLF, Python JSON,
  JavaScript package JSON, JavaScript JSON settings.
- 4060 Ti / 16GB endpoint `8002`, `--parallel 1`, tasks: TOML, Java
  properties parser.

Useful traces converted into corrected targets:

- `python_json_config_numbers`: leaked visible hidden-channel markers, then
  used a typoed temp workspace path after already discovering the correct file.
- `python_toml_boolean_port`: edited TOML correctly, verified with the focused
  Python check, then missed required final sections.
- `javascript_package_type_module`: first produced invalid JSON with a trailing
  comma and dropped an existing field, recovered to a valid package file, passed
  the focused import test, then continued reading files instead of finalizing.

Curated rows added from this batch:

- `corrected_python_json_config_hidden_channel_path_typo_1`
- `corrected_python_toml_boolean_port_missing_final_1`
- `corrected_javascript_package_json_recover_invalid_json_1`

Rejected as low-value:

- `javascript_json_no_trailing_comments`: changed underscores to hyphens in the
  temporary workspace path and hit an external-directory rejection before any
  meaningful edit.
- `java_properties_trim_blank`: hallucinated a different temp root and hit an
  external-directory rejection before reading or editing the target file.
- `python_envfile_crlf_comments`: timed out after reading source and tests but
  did not reach a distinct edit or verification result.

## 2026-06-08 CRLF and Schema Real-Failure Batch

Six new collection prompts were added for Markdown frontmatter, manifest arrays,
CSV CRLF parsing, env-file CRLF parsing, JSON-shaped final responses, and Java
JSON string escaping:

- `python_markdown_frontmatter_bool`
- `javascript_manifest_array_strings`
- `python_csv_crlf_header_trim`
- `javascript_env_parser_crlf`
- `python_final_json_schema`
- `java_json_escape_string`

The collector was run with the current caps:

- Spark endpoint `8001`, `--parallel 4`, tasks: Markdown frontmatter,
  JavaScript manifest, Python CSV CRLF, JavaScript env CRLF.
- 4060 Ti / 16GB endpoint `8002`, `--parallel 1`, tasks: Python report schema,
  Java JSON escaping.

Useful traces converted into corrected targets:

- `python_markdown_frontmatter_bool`: repaired the frontmatter correctly and
  passed the focused check, then failed to return the required final sections.
- `python_final_json_schema`: made the correct dictionary-return edit, first
  ran a Python test command that failed with `ModuleNotFoundError`, recovered
  with `PYTHONPATH=.`, passed, then continued reading unrelated files instead
  of stopping.

Curated rows added from this batch:

- `corrected_python_frontmatter_verify_repair_missing_final_1`
- `corrected_python_report_wrong_verify_recovery_extra_probe_1`

Rejected as low-value:

- `javascript_manifest_array_strings`: accepted by the collector; kept as raw
  signal only.
- `javascript_env_parser_crlf`: changed one character in a temporary workspace
  path and hit an external-directory rejection before a useful edit.
- `python_csv_crlf_header_trim`: timed out after reading source and tests
  without reaching a distinct edit or verification outcome.
- `java_json_escape_string`: timed out after a wrong Java verification command
  and did not reach a useful edit.

## 2026-06-08 Mixed-Language Real-Failure Batch

The next collection pass used existing task-bank prompts to collect more real
programming-agent failures without adding synthetic examples:

- Spark endpoint `8001`, `--parallel 4`, tasks: TypeScript median, Java email,
  PHP money formatting, Python TTL cache creation.
- 4060 Ti / 16GB endpoint `8002`, `--parallel 1`, task: Go limiter.

Useful traces converted into corrected targets:

- `php_money_negative_parentheses`: edited `src/Money.php` correctly, then
  stopped before running the focused PHP test or returning final sections.
- `java_email_trim`: edited correctly, probed unrelated build metadata, ran a
  wrong Java source-file command, recovered to a passing compiled run, then
  timed out without final sections.
- `python_create_ttl_cache`: wrote `src/cache.py` before reading the focused
  tests, mismatched the expected constructor and `set` signatures, then got
  stuck in partial repair.

Curated rows added from this batch:

- `corrected_php_money_edit_verify_finalize_1`
- `corrected_java_email_trim_wrong_verify_extra_probe_1`
- `corrected_python_ttl_cache_read_tests_before_create_1`

Rejected as low-value or already-covered:

- `typescript_median_no_mutation`: changed an underscore to a hyphen in the
  temporary workspace path and hit an external-directory rejection before
  reading or editing the target file.
- `go_limiter_zero_limit`: edited correctly, then hit the missing Go runtime
  and probed extra paths. This overlaps the existing bounded missing-runtime Go
  row, so it was kept as raw evidence rather than added as a duplicate.

## 2026-06-08 Structured JSON and Path-Stability Batch

Another real collection pass targeted tasks that had previously produced path
or structured-file failures:

- Spark endpoint `8001`, `--parallel 4`, tasks: JavaScript deep-get,
  Java properties parser, Python duration parser, JavaScript settings JSON.
- 4060 Ti / 16GB endpoint `8002`, `--parallel 1`, task: Python env-file CRLF.

Useful traces converted into corrected targets:

- `javascript_json_no_trailing_comments`: read the JSON and focused check,
  edited the config into valid JSON with correct primitive types, verified with
  `node test/check-settings.js`, then omitted the required final sections.
- `javascript_deep_get_default`: leaked visible hidden-channel markers, edited
  `src/deepGet.js` correctly, passed the focused test, reran the same passing
  test, and timed out without a final response.

Curated rows added from this batch:

- `corrected_javascript_settings_json_verify_then_final_1`
- `corrected_javascript_deep_get_hidden_channel_repeat_verify_1`

Rejected as low-value:

- `java_properties_trim_blank`: mutated the temporary path and hit an
  external-directory rejection before reading the target file.
- `python_parse_duration_units`: read the target file, then mutated the
  temporary path before reading tests.
- `python_envfile_crlf_comments`: dropped the task directory segment from the
  temporary path and hit an external-directory rejection before a useful edit.

## 2026-06-08 Mixed Runtime Retry Batch

The next pass targeted language/runtime diversity and one structured manifest
case:

- Spark endpoint `8001`, `--parallel 4`, tasks: Swift title slug, C# password
  policy, Rust INI parser, TypeScript median.
- 4060 Ti / 16GB endpoint `8002`, `--parallel 1`, task: JavaScript manifest.

Useful traces converted into corrected targets:

- `csharp_password_symbol`: read source and tests, ran the focused C# command
  to observe the expected failure, edited the production file correctly, reran
  the same command successfully, then omitted the final sections.
- `javascript_manifest_array_strings`: edited and verified correctly, then
  re-read files instead of finalizing. The collector marked it accepted because
  instruction-file text contained final-section marker words, so this was
  manually curated as a classifier false positive.

Curated rows added from this batch:

- `corrected_csharp_password_test_first_repair_missing_final_1`
- `corrected_javascript_manifest_classifier_false_positive_extra_read_1`

Rejected as duplicate or low-value:

- `rust_ini_semicolon_comments`: useful edit and successful `cargo test`, but
  duplicates an existing Rust missing-final corrected row.
- `swift_slug_title_empty_words`: mutated the temporary path before reading the
  file.
- `typescript_median_no_mutation`: read source, then mutated the temporary path
  before reading tests.
