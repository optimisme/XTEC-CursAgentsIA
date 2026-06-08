# Dataset Card: Gemma 4 12B Global Tool-Use Seed

## Purpose

This dataset teaches generic programming-agent tool discipline for Gemma 4 12B.
It is intended to train a LoRA adapter that reduces malformed structured
responses during programming work in OpenCode-like environments. It is not tied
to any one project, harness, MCP server, or tool name.

Target behaviors:

- invoke tools instead of printing fake tool-call syntax
- avoid hidden-channel and pseudo-XML leakage
- inspect relevant files before editing
- keep edits localized
- verify with focused checks
- recover once from malformed or empty tool results
- stop with a concrete blocker instead of looping indefinitely
- return structured final answers

The dataset is not meant to broadly improve coding knowledge. It targets
structured-response reliability: valid tool-use plans, bounded recovery, and
consistent final answer shape.

## Current Data

Default dataset:

```text
data/global_tool_sft_seed.jsonl
```

Current seed size:

- 66 rows
- 24 targeted programming modification rows
- 8 programming creation rows
- 5 loop-control rows
- 29 corrected target failures from real trace rewrites
- languages: Python, JavaScript, TypeScript, Go, Rust, Java, PHP, C#, Swift

Generic collection task bank:

```text
tasks/generic_programming_tasks.jsonl
```

The task bank is used to collect raw OpenCode-like traces from isolated
multi-language fixtures. These traces are not automatically part of the
training dataset. Accepted traces still need review, and failed traces must be
rewritten into corrected assistant targets before training.

Current task bank size: 33 prompts.

## Quality Level

This is a seed dataset for pipeline validation. It is not enough for a robust
adapter. For a meaningful model improvement, collect at least hundreds of
high-quality examples and preferably thousands.

## Exclusions

Legacy Lite harness data was removed from this package. Raw failed traces should
not be included unless rewritten into corrected assistant targets.

## Pre-Training Checks

```sh
python preflight.py --dataset data/global_tool_sft_seed.jsonl
```
