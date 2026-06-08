# Gemma 4 12B Global Tool-Use LoRA

This folder contains a QLoRA training scaffold for producing a Gemma 4 12B LoRA
adapter that reduces malformed structured responses during programming work in
OpenCode-like tool environments.

The target is generic, not tied to the Lite harness. The adapter should improve
structured programming-agent behavior:

- use real tool calls instead of fake tool-call text
- avoid hidden-channel or pseudo-XML leakage
- inspect relevant files before editing
- make targeted programming edits
- verify edits with focused checks
- stop boundedly when tools fail instead of looping forever
- return concise structured final answers

It is not intended to be a broad coding-knowledge finetune. The measurable goal
is fewer malformed structured responses, fewer fake tool-call outputs, fewer
runaway loops, and more consistent final answer structure while programming
with tools.

The default dataset is:

```text
data/global_tool_sft_seed.jsonl
```

It is a small seed dataset for pipeline validation. It is not enough to claim a
robust adapter. A useful adapter should add hundreds or thousands of diverse
examples from real OpenCode-like projects and corrected failure traces.

## Build And Check Data

```sh
python build_global_tool_dataset.py
python preflight.py --dataset data/global_tool_sft_seed.jsonl
```

The legacy Lite harness traces are intentionally not included.

## Trace Collection

Generic task definitions live in:

```text
tasks/generic_programming_tasks.jsonl
```

Materialize disposable fixtures:

```sh
python create_generic_task_fixtures.py \
  --tasks tasks/generic_programming_tasks.jsonl \
  --output-dir fixtures/generic \
  --force
```

Collect raw OpenCode traces from the 16GB endpoint:

```sh
node collect_generic_traces.js \
  --tasks tasks/generic_programming_tasks.jsonl \
  --output-dir traces/generic/vram16 \
  --source-label vram16 \
  --endpoint http://127.0.0.1:8002/v1 \
  --model vram16-vllm/active-model \
  --limit 3
```

Collect raw OpenCode traces from the Spark endpoint:

```sh
node collect_generic_traces.js \
  --tasks tasks/generic_programming_tasks.jsonl \
  --output-dir traces/generic/spark \
  --source-label spark \
  --endpoint http://127.0.0.1:8001/v1 \
  --model spark-vllm/active-model \
  --limit 3
```

Each run writes a manifest row with status, log path, acceptance diagnostics,
and missing formatting markers. Raw failures are analysis material only; rewrite
them into corrected assistant targets before adding them to SFT data.

## Data Policy

Use these categories, labeled in metadata:

- `accepted_target_trace`: the target Gemma 4 12B model completed a real
  OpenCode-like task successfully.
- `corrected_target_failure`: a target-model failure rewritten into the correct
  assistant behavior.
- `teacher_trace`: a stronger model generated a clean solution pattern.
- `synthetic_global_tool_invariant`: template or manually authored rows that
  teach generic tool-use discipline.

Do not train on raw failed transcripts. Convert them into corrected assistant
targets first.

## Train

```sh
python train_lora.py \
  --base-model google/gemma-4-12B-it \
  --dataset data/global_tool_sft_seed.jsonl \
  --output-dir outputs/gemma4-12b-global-tool-lora \
  --epochs 3 \
  --batch-size 1 \
  --grad-accum 16
```

Remote Docker training:

```sh
./run_remote_training.sh
```

The Docker compose default dataset and output directory match the generic
adapter target.

## Evaluation

Evaluate on projects outside the Lite harness. The eval prompts should check:

- no fake tool-call or hidden-channel text
- bounded recovery after empty or failed tool results
- targeted edits rather than broad rewrites
- structured final answer with changed files, verification, and remaining risk
- fewer timeouts or repeated planner/editor loops

Primary success metrics:

- malformed structured-output rate
- fake tool-call / hidden-channel leakage rate
- repeated-loop or timeout rate
- structured-final compliance rate
- task completion rate on focused programming edits
