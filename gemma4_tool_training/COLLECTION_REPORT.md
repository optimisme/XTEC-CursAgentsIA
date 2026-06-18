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

## 2026-06-17 16GB MTP OpenCode Calculator Website Prompt

OpenCode was run locally in `projecteTest` against the 16GB MTP vLLM endpoint:

- Endpoint: `http://127.0.0.1:8002/v1`
- Model: `vram16-vllm/active-model`
- Served checkpoint: `google/gemma-4-12B-it-qat-w4a16-ct`
- Prompt: create `webs/calculator.html`, `webs/calculator.css`, and
  `webs/calculator.js` matching `@calculator.png` with a light red display and
  rounded keys.

Result: failed; no requested files were created.

Observed behavior:

- Initial run failed before model work because the project default agent
  `guided-teacher` is missing.
- After using a minimal primary agent, the model globbed `webs`, failed to
  notice the existing empty directory, then recovered by running `ls -F`.
- The model read `calculator.png`, then stated it could not see images and
  stopped to ask whether it should proceed, instead of using the available
  image-vision tool or proceeding from the textual requirements.
- A continued run accepted "proceed", ran `mkdir -p webs`, then printed HTML/CSS
  content in the assistant message rather than writing files.
- The model later claimed `webs/calculator.html` had been created, but a read
  failed with `File not found`, and `glob webs/*` still returned no files.
- Both runs repeatedly hit the 8k context boundary after verbose progress
  summaries. The local `vram16-vllm` OpenCode config had to be reduced from
  8192 output tokens to 1024 output tokens to keep sessions from failing before
  any useful work.

MTP status during the run:

- The vLLM endpoint remained healthy.
- Speculative decoding metrics increased during the test, confirming MTP was
  active during OpenCode usage.

Failure classes to keep for later training:

- Missing or invalid default-agent setup can mask model behavior.
- Do not stop for clarification when the user already requested creation and
  textual visual requirements are sufficient.
- Use project-relative paths in file tools, never absolute paths.
- Do not print intended file contents instead of calling write/edit tools.
- Do not claim files were created before verifying they exist.
- Keep progress summaries compact on 8k-context local endpoints.

## 2026-06-17 16GB E4B MTP 32k OpenCode Calculator Website Prompt

OpenCode was rerun locally in `projecteTest` against the 16GB MTP vLLM endpoint
after switching the 16GB profile from 12B to E4B and raising the advertised
OpenCode context to 32k:

- Endpoint: `http://127.0.0.1:8002/v1`
- Model: `vram16-vllm/active-model`
- Served checkpoint: `google/gemma-4-E4B-it-qat-w4a16-ct`
- MTP assistant checkpoint: `google/gemma-4-E4B-it-qat-q4_0-unquantized-assistant`
- OpenCode context/output config: `context: 32768`, `output: 4096`,
  `max_tokens: 4096`
- Generation defaults: `temperature=1.0`, `top_p=0.95`, `top_k=64`
- Prompt: create `webs/calculator.html`, `webs/calculator.css`, and
  `webs/calculator.js` matching `@calculator.png` with a light red display and
  rounded keys.

Result: failed/partial. The model improved over the 12B MTP run by creating
some files, but it did not complete the requested website and had to be
interrupted after repeatedly looping on CSS creation.

Observed behavior:

- The model first attempted an unavailable tool, `image_vision_describe`, even
  though the OpenCode tool list only exposed `glob`, `grep`, `invalid`, `read`,
  `task`, and `web_check_check_web`.
- It recovered from the invalid image tool instead of stopping for
  clarification and proceeded from the text description.
- It created `webs/calculator.html` and `webs/calculator.css`.
- It repeatedly launched safe-editor subagent tasks for CSS creation and did
  not progress to creating `webs/calculator.js` before manual interruption.
- The generated HTML linked assets as `webs/calculator.css` and
  `webs/calculator.js` from inside the `webs/` directory, so both links would
  resolve incorrectly in a browser.
- The generated HTML used `<div class="buttons">`, while the generated CSS
  styled `.buttons-grid`, so the button grid styles would not apply.
- The button layout contained repeated division operator buttons and omitted a
  complete normal operator set.

MTP status during the run:

- The vLLM endpoint remained healthy.
- Speculative decoding metrics increased during the test. After interruption,
  `vllm:spec_decode_num_drafts_total` was `25822` and
  `vllm:spec_decode_num_accepted_tokens_total` was `20886`, confirming MTP was
  active during OpenCode usage.

Failure classes to keep for later training:

- Do not call unavailable tools after OpenCode reports the available tool list.
- Recovering from an invalid tool is useful, but the model must continue to all
  required deliverables rather than looping on a completed subtask.
- Track requested files explicitly and verify each required file exists before
  finishing.
- Use paths relative to the file being generated for browser asset links.
- Keep HTML and CSS selectors synchronized.
- Validate generated app structure before using `web_check_check_web`.

## 2026-06-17 16GB E4B MTP 32k Generic Trace Batch

A small isolated-fixture collection pass was run against the same E4B MTP
endpoint to get real OpenCode programming traces beyond the website prompt:

- Endpoint: `http://127.0.0.1:8002/v1`
- Model: `vram16-vllm/active-model`
- Source label: `vram16-e4b-mtp-32k`
- Output directory: `traces/generic/vram16-e4b-mtp-32k`
- Tasks: `python_inventory_missing_key`, `javascript_slugify_blank`,
  `python_normalize_tags_unique`

Manifest:

- `traces/generic/vram16-e4b-mtp-32k/manifest_vram16-e4b-mtp-32k_2026-06-17T07-40-27-482Z.jsonl`

Results:

- `javascript_slugify_blank`: accepted candidate trace. The model read the
  target file, made the correct edit, found the focused test, ran
  `node test/slugify.test.js` successfully, and produced the required final
  sections. It redundantly ran the same test twice.
- `python_inventory_missing_key`: useful corrected-failure candidate. The model
  read and edited `src/inventory.py` correctly, but searched the wrong test path
  (`src/test_inventory.py`), missed the provided focused test at
  `tests/test_inventory.py`, and finalized with inspection-only verification.
- `python_normalize_tags_unique`: useful corrected-failure candidate. The model
  made the correct edit, then wrongly believed the edit had failed, retried
  using an absolute temporary path with a mutated directory segment, hit an
  external-directory permission rejection, and ended without the required final
  sections.

Failure classes to keep for later training:

- Use the provided task verification command or inspect `task.json` before
  inventing/searching a different test path.
- Treat a successful edit result as authoritative unless a later read proves
  otherwise.
- Keep using project-relative paths after a tool shows absolute temporary paths.
- Do not retry a completed edit with a copied absolute path.
- Avoid redundant verification commands when one focused passing run is enough.

## 2026-06-17 16GB E4B MTP 32k Generic Trace Batch 2

A second isolated-fixture pass was run against the same E4B MTP endpoint:

- Endpoint: `http://127.0.0.1:8002/v1`
- Model: `vram16-vllm/active-model`
- Source label: `vram16-e4b-mtp-32k`
- Output directory: `traces/generic/vram16-e4b-mtp-32k`
- Tasks: `python_csv_skip_blank`, `javascript_parse_bool_defaults`,
  `javascript_group_by_key`

Manifest:

- `traces/generic/vram16-e4b-mtp-32k/manifest_vram16-e4b-mtp-32k_2026-06-17T07-43-37-097Z.jsonl`

Results:

- `python_csv_skip_blank`: useful near-success trace. The model eventually
  found `task.json`, ran the provided focused command
  `PYTHONPATH=. python tests/test_csv_rows.py` successfully, and made a
  plausible correct edit. The classifier rejected it because the final answer
  omitted the exact `Changed files` marker. The trace also includes repeated
  file reads and repeated verification.
- `javascript_parse_bool_defaults`: raw failure. The model emitted visible
  Markdown pseudo-tool syntax, `[read](src/parseBool.js)`, and stopped without
  using the tool or editing the file.
- `javascript_group_by_key`: raw failure. The model described a plan, then
  printed a fake `glob` JSON block in assistant text instead of making a real
  tool call, and stopped without creating `src/groupBy.js`.

Failure classes to keep for later training:

- Use actual OpenCode tool calls, not Markdown links or JSON examples that look
  like tool calls.
- Do not stop after describing the intended tool call.
- Preserve the required final marker labels exactly.
- Avoid repeated verification when the focused command has already passed.

## 2026-06-17 E4B MTP OpenCode Reasoning Flag A/B

A matched six-task A/B test was run against the 16GB E4B MTP endpoint to test
whether disabling OpenCode's model `reasoning` flag lowers tool mistakes.

Shared settings:

- Endpoint: `http://127.0.0.1:8002/v1`
- Model: `vram16-vllm/active-model`
- Served checkpoint: `google/gemma-4-E4B-it-qat-w4a16-ct`
- Output tokens: `4096`
- Tasks: `python_inventory_missing_key`, `javascript_slugify_blank`,
  `python_normalize_tags_unique`, `python_csv_skip_blank`,
  `javascript_parse_bool_defaults`, `javascript_group_by_key`

Manifests:

- Off: `traces/ab/reasoning-off/manifest_e4b-mtp-reasoning-off_2026-06-17T07-52-59-508Z.jsonl`
- On: `traces/ab/reasoning-on/manifest_e4b-mtp-reasoning-on_2026-06-17T07-58-01-073Z.jsonl`

Headline result:

- `reasoning=false`: 2 accepted / 6 completed.
- `reasoning=true`: 4 accepted / 6 completed.

Per-task result:

| Task | reasoning=false | reasoning=true |
| --- | --- | --- |
| `python_inventory_missing_key` | accepted | rejected |
| `javascript_slugify_blank` | accepted | accepted |
| `python_csv_skip_blank` | rejected | rejected |
| `python_normalize_tags_unique` | rejected | accepted by classifier |
| `javascript_parse_bool_defaults` | rejected | accepted |
| `javascript_group_by_key` | rejected | accepted |

Observed failure modes with `reasoning=false`:

- `python_csv_skip_blank`: printed pseudo-tool text (`[glob: ...]`,
  `[read: ...]`) and stopped without real tool calls.
- `python_normalize_tags_unique`: printed Markdown pseudo-tool syntax
  (`[read](src/tags.py)`) and stopped.
- `javascript_parse_bool_defaults`: made a correct-looking edit and ran tests,
  but produced a long trace with repeated edit errors and omitted the required
  final markers.
- `javascript_group_by_key`: used tools but had repeated write/edit errors and
  omitted the required final markers.

Observed failure modes with `reasoning=true`:

- `python_inventory_missing_key`: printed pseudo-tool syntax
  (`[glob{pattern: "**/*"}]`) and stopped without real tool calls.
- `python_csv_skip_blank`: useful near-success trace with real tools and tests,
  but omitted final markers.
- `python_normalize_tags_unique`: classifier accepted it, but the trace did not
  run the provided focused test command. It should be treated as a
  corrected-failure candidate, not a clean accepted trace.

Caveat:

- OpenCode event token counters still reported `reasoning: 0` in these traces.
  This A/B result tests the OpenCode `reasoning` configuration flag, not a
  confirmed separate hidden-thinking token stream from vLLM.

Conclusion:

- In this small matched run, disabling `reasoning` did not lower the observed
  error rate. The `reasoning=true` configuration produced more classifier
  accepts and fewer fake-tool stops overall, though one accepted row exposed a
  classifier weakness around claimed verification.
- The result is not statistically strong enough to treat as final policy, but
  it argues against assuming `reasoning=false` is automatically safer for Gemma
  4 E4B MTP tool use.

Recommended next test:

- Repeat this A/B on at least 20-30 tasks and tighten the classifier so
  accepted traces require a real verification tool call when a focused command
  is present.

## 2026-06-17 Central E4B MTP Capture From Albert And Super

Gemma 4 E4B MTP was deployed on both available remotes and traces were captured
centrally under the local `gemma4_tool_training/traces/central` directory.

Deployment:

- `albert@localhost -p 2223`: already running
  `compose-gemma4-e4b-qat-w4a16-mtp-it-vllm-16gb.yml`.
- `super@localhost -p 2225`: created and synced
  `compose-gemma4-e4b-qat-w4a16-mtp-it-vllm-spark.yml`, then started
  container `gemma4_e4b_qat_w4a16_spark_mtp_vllm`.
- Super initially failed with the 16GB-named compose due to cache/DNS timing,
  then the Spark-named compose downloaded the E4B target checkpoint and MTP
  assistant successfully.

Super load confirmation:

- Served checkpoint: `google/gemma-4-E4B-it-qat-w4a16-ct`
- MTP assistant: `google/gemma-4-E4B-it-qat-q4_0-unquantized-assistant`
- `max_model_len`: `32768`
- Model loading memory: `9.36 GiB`
- Available KV cache memory: `95.48 GiB`
- GPU KV cache size: `9,242,714 tokens`
- Maximum concurrency for 32,768-token requests: `282.07x`

Central local capture folders:

- `traces/central/albert-e4b-mtp-20260617`
- `traces/central/super-e4b-mtp-20260617`

Manifests:

- `traces/central/albert-e4b-mtp-20260617/manifest_albert-e4b-mtp_2026-06-17T08-11-59-352Z.jsonl`
- `traces/central/albert-e4b-mtp-20260617/manifest_albert-e4b-mtp-b2_2026-06-17T08-24-49-289Z.jsonl`
- `traces/central/super-e4b-mtp-20260617/manifest_super-e4b-mtp_2026-06-17T08-21-01-352Z.jsonl`
- `traces/central/super-e4b-mtp-20260617/manifest_super-e4b-mtp-b2_2026-06-17T08-24-49-289Z.jsonl`

Results:

- Total: 5 accepted / 16 completed.
- Albert batch 1: 3 accepted / 4 completed.
- Albert batch 2: 0 accepted / 4 completed.
- Super batch 1: 1 accepted / 4 completed.
- Super batch 2: 1 accepted / 4 completed.

Accepted candidate traces:

- `albert-e4b-mtp/java_email_trim`
- `albert-e4b-mtp/javascript_manifest_array_strings`
- `albert-e4b-mtp/javascript_env_parser_crlf`
- `super-e4b-mtp/python_toml_boolean_port`
- `super-e4b-mtp-b2/javascript_parse_bool_defaults`

Useful failure/correction candidates:

- `albert-e4b-mtp/python_json_config_numbers`: made useful edits but omitted
  required final markers.
- `albert-e4b-mtp-b2/python_parse_duration_units`: used tools and tests, but
  omitted `Verification` and `Remaining risk`.
- `albert-e4b-mtp-b2/javascript_deep_get_default`: used tools and verification
  but omitted all final markers.
- `albert-e4b-mtp-b2/python_envfile_crlf_comments`: used tools and tests but
  omitted `Changed files` and `Remaining risk`.
- `albert-e4b-mtp-b2/python_csv_crlf_header_trim`: used tools and tests but
  omitted all final markers.
- `super-e4b-mtp/javascript_package_type_module`: performed useful tool work
  but omitted final markers after write/edit retries.
- `super-e4b-mtp/python_markdown_frontmatter_bool`: made useful edits and ran
  checks but had repeated edit errors and omitted final markers.
- `super-e4b-mtp-b2/java_json_escape_string`: used tools and tests but omitted
  final markers.

Raw failure patterns:

- `super-e4b-mtp/java_clamp_score`: printed a fake JSON tool call after saying
  it would use grep.
- `super-e4b-mtp-b2/php_query_parse_repeated`: printed pseudo-tool syntax
  `[glob{pattern:<|"|>src/Query.php<|"|>}]` and stopped.
- `super-e4b-mtp-b2/python_final_json_schema`: printed pseudo-tool syntax
  `[glob{pattern: "src/report.py"}]` and stopped.

MTP status after central capture:

- Super endpoint: `vllm:spec_decode_num_drafts_total=11747`,
  `vllm:spec_decode_num_accepted_tokens_total=8268`.
- Albert endpoint: `vllm:spec_decode_num_drafts_total=73912`,
  `vllm:spec_decode_num_accepted_tokens_total=56322`.

Training notes:

- The central capture produced enough fresh E4B-specific evidence to start
  writing corrected examples, but it is still too small for final training.
- The strongest correction targets are not general coding fixes; they are
  protocol fixes: real tool calls, exact final markers, no fake JSON/Markdown
  tool syntax, stop after passing verification, and do not retry successful
  edits with mutated paths.

## 2026-06-17 VibeThinker 3B 16GB Probe

`WeiboAI/VibeThinker-3B` was added as a local source-of-truth compose profile
and deployed on `albert@localhost -p 2223`.

Local files:

- `docker/compose-vibethinker-3b-reasoning-base-vllm-16gb.yml`
- `docker/models.json` entry `vibethinker-3b-reasoning-base-vllm-16gb`

Remote deployment:

- Synced to `/home/albert/Documents/vLLM/docker/`.
- Stopped the previous 16GB endpoint container to free port `8000`.
- Started `vibethinker_3b_vllm_16gb`.
- Served locally through the existing `8002 -> remote 8000` tunnel.

Serving notes:

- Initial profile using `cu129-nightly`, `--max-model-len 32768`, and FP8 KV
  cache stalled during startup while Hugging Face cache downloads were still
  incomplete.
- The working profile uses `vllm/vllm-openai:latest`, `--max-model-len 8192`,
  BF16 weights, eager execution, and vLLM's Hermes tool parser.
- `/v1/models` reports root `WeiboAI/VibeThinker-3B` and `max_model_len 8192`.

Upstream warning:

- The Hugging Face model card explicitly says VibeThinker-3B was not trained on
  tool-calling or agent-based programming data and does not recommend it for
  function calling, API orchestration, or autonomous coding agents.

Behavior tests:

- Direct exact-output sanity prompt `Return exactly: ok` failed: the model
  emitted visible `<think>` reasoning instead of the requested exact output.
- Direct OpenAI-compatible tool-call probe with a `get_weather` tool failed:
  finish reason was `length`, no `tool_calls` were returned, and the visible
  response was `<think>` text speculating about XML/tool-call formatting.
- OpenCode collection with `reasoning=false` completed 3/3 tasks but accepted
  0/3.
- OpenCode collection with `reasoning=true` completed 1/1 comparison task but
  accepted 0/1.

Central local capture folders:

- `traces/central/vibethinker-3b-16gb-20260617`
- `traces/central/vibethinker-3b-16gb-reasoning-20260617`

Failure shape:

- The model did not make real OpenCode tool calls.
- It spent the entire response budget reasoning about tool-call formats,
  usually beginning with visible `<think>`.
- It hit the 2048-token output cap and stopped with finish reason `length`.
- The traces are useful as negative evidence, but they are poor LoRA training
  material unless rewritten into corrected examples from scratch.

Conclusion:

- VibeThinker-3B can run on the 16GB machine, but this deployment should not be
  used as a primary tool-behavior data collector.
- For tool behavior, Gemma 4 E4B MTP is still materially better on this setup:
  it at least reaches real tool use and produces curatable protocol failures.

## 2026-06-17 E4B MTP Temperature 0.25 Probe

The 16GB endpoint on `albert@localhost -p 2223` was restored from
`VibeThinker-3B` back to the local source-of-truth compose:

- `docker/compose-gemma4-e4b-qat-w4a16-mtp-it-vllm-16gb.yml`

Only the generation override was changed:

- Previous: `{"temperature": 1.0, "top_p": 0.95, "top_k": 64}`
- Current: `{"temperature": 0.25, "top_p": 0.95, "top_k": 64}`

Deployment:

- Synced the updated local compose to
  `/home/albert/Documents/vLLM/docker/compose-gemma4-e4b-qat-w4a16-mtp-it-vllm-16gb.yml`.
- Stopped `vibethinker_3b_vllm_16gb`.
- Started `gemma4_e4b_qat_w4a16_vllm_mtp_16gb`.
- `/v1/models` reports root `google/gemma-4-E4B-it-qat-w4a16-ct` and
  `max_model_len 32768`.
- vLLM startup logs confirm `override_generation_config` contains
  `temperature: 0.25`, MTP is enabled, and the Gemma4 tool parser is enabled.

Direct tool-call probe:

- Prompt: use a `get_weather` tool for Barcelona and do not answer from memory.
- Result: success. The response finished with `finish_reason: tool_calls` and
  returned a real tool call:
  `get_weather({"city": "Barcelona"})`.

OpenCode trace batch:

- Endpoint: `http://127.0.0.1:8002/v1`
- Model: `vram16-vllm/active-model`
- Source label: `e4b-mtp-temp025`
- Output directory: `traces/ab/e4b-mtp-temp025-20260617`
- Tasks: `python_inventory_missing_key`, `javascript_slugify_blank`,
  `python_normalize_tags_unique`

Manifest:

- `traces/ab/e4b-mtp-temp025-20260617/manifest_e4b-mtp-temp025_2026-06-17T09-00-52-897Z.jsonl`

Results:

- `python_inventory_missing_key`: accepted.
- `javascript_slugify_blank`: rejected, but it did use real tools. The failure
  was repeated/duplicated edits, searching the wrong test location, not using
  the provided focused verification command, and missing final markers.
- `python_normalize_tags_unique`: accepted.

MTP status:

- `vllm:spec_decode_num_drafts_total=8811`
- `vllm:spec_decode_num_accepted_tokens_total=7076`

Initial conclusion:

- Lowering temperature to `0.25` appears beneficial for basic tool-call
  reliability in this small probe: the direct OpenAI-compatible tool-call test
  succeeded, and the OpenCode batch accepted 2/3 tasks.
- The remaining failure class is not fake tool syntax; it is over-editing,
  poor verification-command discovery, and missing final answer protocol.
- This is only a small sample. Run a matched 20-30 task A/B against
  `temperature=1.0` before treating `0.25` as the default collection setting.

## 2026-06-17 Spark E4B MTP Temperature 1.0 vs 0.1 A/B

A matched 20-task OpenCode A/B test was run on the Spark remote
`super@localhost -p 2225` for Gemma 4 E4B MTP.

Shared settings:

- Endpoint: `http://127.0.0.1:8001/v1`
- Model: `spark-vllm/active-model`
- Served checkpoint: `google/gemma-4-E4B-it-qat-w4a16-ct`
- MTP assistant: `google/gemma-4-E4B-it-qat-q4_0-unquantized-assistant`
- `top_p=0.95`
- `top_k=64`
- `reasoning=true`
- Output tokens: `4096`
- Parallelism: `4`
- Timeout: `720000 ms`

Temperature setup:

- A-side used the already-running Spark compose at `temperature=1.0`.
- B-side changed the local source-of-truth compose
  `docker/compose-gemma4-e4b-qat-w4a16-mtp-it-vllm-spark.yml` to
  `temperature=0.1`, synced it to
  `/home/super/Documents/vLLM/docker/compose-gemma4-e4b-qat-w4a16-mtp-it-vllm-spark.yml`,
  and recreated container `gemma4_e4b_qat_w4a16_spark_mtp_vllm`.
- Remote and local compose hashes matched after sync.
- vLLM logs confirmed `override_generation_config` contained
  `temperature: 0.1`.

Task set:

- `python_inventory_missing_key`
- `javascript_slugify_blank`
- `typescript_median_no_mutation`
- `go_limiter_zero_limit`
- `rust_ini_semicolon_comments`
- `java_email_trim`
- `php_money_negative_parentheses`
- `csharp_password_symbol`
- `python_create_ttl_cache`
- `python_csv_skip_blank`
- `python_normalize_tags_unique`
- `javascript_parse_bool_defaults`
- `javascript_group_by_key`
- `swift_slug_title_empty_words`
- `generic_repeated_empty_tool_result`
- `python_parse_duration_units`
- `javascript_deep_get_default`
- `go_parse_port_range`
- `rust_parse_bool_yes_no`
- `php_query_parse_repeated`

Manifests:

- `temperature=1.0`:
  `traces/ab/spark-e4b-mtp-temp100-vs-temp010-20260617/temp100/manifest_spark-e4b-mtp-temp100_2026-06-17T09-07-50-426Z.jsonl`
- `temperature=0.1`:
  `traces/ab/spark-e4b-mtp-temp100-vs-temp010-20260617/temp010/manifest_spark-e4b-mtp-temp010_2026-06-17T09-20-23-552Z.jsonl`

Headline result:

- `temperature=1.0`: 8 accepted / 20 completed, 0 timeouts.
- `temperature=0.1`: 8 accepted / 19 completed, 1 timeout.

Paired result:

- Wins for `0.1`: `go_limiter_zero_limit`,
  `python_inventory_missing_key`, `php_query_parse_repeated`.
- Regressions for `0.1`: `java_email_trim`,
  `javascript_slugify_blank`, `python_create_ttl_cache`.
- Accepted by both: `rust_ini_semicolon_comments`,
  `csharp_password_symbol`, `php_money_negative_parentheses`,
  `python_csv_skip_blank`, `rust_parse_bool_yes_no`.
- Rejected by both: `typescript_median_no_mutation`,
  `python_normalize_tags_unique`, `javascript_parse_bool_defaults`,
  `generic_repeated_empty_tool_result`, `python_parse_duration_units`,
  `go_parse_port_range`, `javascript_group_by_key`,
  `swift_slug_title_empty_words`, `javascript_deep_get_default`.

Observed differences:

- `0.1` fixed some final-marker/protocol misses from `1.0`.
- `0.1` also introduced or worsened over-edit loops. The clearest case was
  `typescript_median_no_mutation`, where the model made an initial edit, then
  repeatedly retried the same already-applied edit until timeout.
- `0.1` still emitted fake/pseudo tool syntax in at least one low-level
  control task: `generic_repeated_empty_tool_result` produced
  `[glob{pattern: "**/*"}]`.
- Several `0.1` rejections used real tools but failed final response markers
  or verification discovery, so the issue is not only tool-call selection.

MTP status after the B-side run:

- `vllm:spec_decode_num_drafts_total=65735`
- `vllm:spec_decode_num_accepted_tokens_total=56860`

Conclusion:

- `temperature=0.1` did not improve the 20-task OpenCode acceptance rate on
  Spark. It tied `temperature=1.0` at 8/20 accepted and added one timeout.
- The lower temperature made some tasks more deterministic, but not more
  reliably correct; it appears to increase perseveration after an edit or tool
  error.
- Do not switch the Spark E4B MTP collection default to `0.1` based on this
  result. Prefer `0.25` for the next matched larger run, because the smaller
  16GB probe at `0.25` improved direct tool calls without showing this strong
  timeout signal.

## 2026-06-17 Spark E4B MTP LoRA Discipline Batch

This run collected generic OpenCode-style traces only. It did not use the
`projecteTest` harness or project-specific fixtures.

Runtime:

- Remote: `ssh super@localhost -p 2225`
- Endpoint: `http://127.0.0.1:8001/v1`
- Container: `gemma4_e4b_qat_w4a16_mtp_it_vllm_spark`
- Model: `google/gemma-4-E4B-it-qat-w4a16-ct`
- Assistant/MTP model:
  `google/gemma-4-E4B-it-qat-q4_0-unquantized-assistant`
- Settings: `temperature=1.0`, `top_p=0.95`, `top_k=64`,
  `enable_thinking=true`
- Collector: `collect_generic_traces.js`
- Task file: `tasks/generic_programming_tasks.jsonl`
- Parallelism: `--parallel 4`

Trace output:

- Folder:
  `traces/central/spark-e4b-mtp-lora-discipline-20260617/`
- Manifest:
  `traces/central/spark-e4b-mtp-lora-discipline-20260617/manifest_spark-e4b-mtp-lora-discipline_2026-06-17T09-57-03-417Z.jsonl`

Result:

- Total tasks: 33
- Accepted: 15
- Rejected: 18
- Timeouts: 0

Accepted trace candidates:

- `javascript_slugify_blank`
- `go_limiter_zero_limit`
- `typescript_median_no_mutation`
- `javascript_parse_bool_defaults`
- `python_csv_skip_blank`
- `swift_slug_title_empty_words`
- `python_normalize_tags_unique`
- `javascript_deep_get_default`
- `java_clamp_score`
- `python_envfile_crlf_comments`
- `javascript_package_type_module`
- `python_toml_boolean_port`
- `python_csv_crlf_header_trim`
- `python_final_json_schema`
- `java_json_escape_string`

Raw correction candidates:

- `python_inventory_missing_key`
- `rust_ini_semicolon_comments`
- `java_email_trim`
- `python_create_ttl_cache`
- `csharp_password_symbol`
- `php_money_negative_parentheses`
- `javascript_group_by_key`
- `generic_repeated_empty_tool_result`
- `go_parse_port_range`
- `python_parse_duration_units`
- `rust_parse_bool_yes_no`
- `php_query_parse_repeated`
- `javascript_json_no_trailing_comments`
- `python_json_config_numbers`
- `javascript_manifest_array_strings`
- `javascript_env_parser_crlf`
- `python_markdown_frontmatter_bool`
- `java_properties_trim_blank`

Observed failure classes:

- Fake or pseudo tool-call syntax in visible text, for example JSON or
  Markdown-link shaped tool calls instead of real OpenCode tool calls.
- Missing final response markers: rejected rows missed `Remaining risk` 18
  times, `Changed files` 17 times, and `Verification` 13 times.
- Some traces completed the edit and focused verification but should still be
  rewritten before training because they repeated verification or included
  excessive visible reasoning.
- The loop-control prompt produced a bounded blocker-style response, but it
  missed the required structured final markers and explicit no-fake-tool
  wording.

Training use:

- Use accepted rows as candidate positive examples only after manual inspection.
- Use rejected rows as raw material for corrected target responses; do not train
  directly on the raw assistant output.
- Next data improvement should add paraphrased prompt variants and more
  explicit low-level tool-failure recovery cases, while keeping the default
  OpenCode configuration.

## 2026-06-17 Dataset Scaling Pipeline

New local tooling was added to move from raw traces toward a 1,000-row training
set:

- `expand_task_prompts.js`: creates deterministic prompt variants from the
  generic task bank.
- `build_corrected_rows.py`: converts trace manifest rows into corrected SFT
  targets without copying raw failed assistant output.
- `dedupe_dataset.py`: removes semantic duplicates and reports row balance.

Generated artifacts:

- `tasks/generic_programming_tasks.expanded.jsonl`: 264 prompts from 33 base
  fixtures and 8 prompt variants.
- `data/global_tool_sft_autocurated.raw.jsonl`: 534 rows before dedupe.
- `data/global_tool_sft_autocurated.deduped.jsonl`: 467 rows after dedupe.
- `data/global_tool_sft_autocurated.report.json`: balance report.
- `preflight_autocurated.json`: validation report.

Current trainable counts:

- Seed dataset: 66 rows.
- Real-trace rewrites already in seed: 29 rows.
- Autocurated deduped dataset: 467 rows.
- Autocurated real-trace template rewrites: 401 rows.

Preflight result:

- `python preflight.py --dataset data/global_tool_sft_autocurated.deduped.jsonl
  --report preflight_autocurated.json` passed with 0 errors.

Path to 1,000 rows:

- Use `tasks/generic_programming_tasks.expanded.jsonl` for the next default
  OpenCode collection runs.
- A full Spark E4B MTP expanded-bank pass completed after this tooling was
  added:
  `traces/central/spark-e4b-mtp-expanded-20260617/manifest_spark-e4b-mtp-expanded_2026-06-17T10-15-54-323Z.jsonl`.
- Expanded pass result: 264 total traces, 140 accepted, 124 rejected, 0
  timeouts.
- With the current 467 trainable rows, about 533 more deduped rows are needed.
- Because dedupe removes repeated task/failure patterns, collect roughly
  700-900 additional raw traces before expecting a 1,000-row trainable
  dataset.
- Add new base fixtures if the dataset becomes dominated by missing final
  markers, Python, or JavaScript.

## 2026-06-17 Large Task-Bank Expansion

The next data-growth step adds a larger generated task bank:

- `generate_extra_task_bank.py`: deterministic generator for additional
  fixture-backed programming tasks.
- `tasks/generated_250_programming_tasks.jsonl`: 250 new base tasks.
- `tasks/generated_250_programming_tasks.expanded-p01-p08.jsonl`: 2,000 prompt
  variants from those base tasks.

The generated tasks currently focus on Python and JavaScript because their
verification commands use standard runtimes already exercised by the collector.
This is intended to provide volume for LoRA training while keeping trace
quality high and avoiding missing-runtime noise.

Cleanup changes:

- `collect_generic_traces.js` now deletes each task's `gemma4-tool-*` workspace
  and `gemma4-opencode-state-*` directory after the log and manifest row are
  written.
- `--keep-temp` preserves those directories only for debugging.
- `clean_temp_workdirs.py` safely removes stale generated temp directories
  while preserving any path referenced by a live `opencode run`.

Local cleanup performed:

- Removed 936 stale `gemma4-*` temp directories from previous runs.
- Removed another 230 stale `gemma4-*` temp directories after adding the
  cleanup utility.
- Remaining temp directories after cleanup: 46, corresponding to recent or
  active collection work.
