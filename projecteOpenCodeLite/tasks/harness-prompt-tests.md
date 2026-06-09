# OpenCode Lite Harness Prompt Tests

These prompts test whether small local models follow the Lite harness workflow for one-shot creation and one-shot modification.

Run each prompt in a fresh `opencode run` session through `harness/run_opencode_harness.sh`. Do not repair generated files manually between prompts in the same scenario; the point is to observe whether the model and harness recover through the allowed workflow.

Optional runner:

```sh
node harness/run_prompt_tests.js --id=clock_create_research
node harness/run_prompt_tests.js --timeout=420
node harness/run_prompt_tests.js --model=spark-vllm/active-model --id=clock_smooth_modify
node harness/run_prompt_tests.js --model=spark-vllm/active-model --strict --id=clock_smooth_modify
```

By default the wrapper validates observable safety: command completion, no visible protocol leakage, no truncation, required web checks after web-file edits, and post-edit web animation/timer invariants. `--strict` additionally requires planner/editor contract rows and the expected planner/editor routing. Use strict mode for harness architecture tests, not for ordinary model capability smoke tests.

For small local models, the wrapper also stops early when the log shows unsafe recovery loops: empty `safe_edit_safe_replace_lines` replacements, absolute paths in `safe_edit` calls, three repeated identical safe_edit writes to the same file, or target drift during `modify @file` prompts.

## Scenario A: Canvas Clock

### A1. One-shot creation with research

Prompt:

```text
Create a new file named harness-clock.html at webs folder that shows an analog circular watch drawn on a canvas and updated once per second. Make it look like a Swiss railway station clock: white face, black minute tick marks, thick black hour and minute hands, and a red seconds hand with a round red disc near the tip. Search on the internet for the look of Swiss railway station clocks before creating the file. Use one self-contained HTML file and run the web checker.
```

Expected harness behavior:

- Uses `web_search` before creation.
- Uses `safe_editor` exactly once for `webs/harness-clock.html`.
- Submits an `agent_contract` edit result.
- Reads or otherwise confirms `webs/harness-clock.html` exists after the editor task.
- Calls `web_check_check_web` because an HTML file changed.
- Does not emit pseudo-channel text such as `<|channel>`.

Expected file behavior:

- Contains a `<canvas>`.
- Uses `setInterval` or equivalent timing for once-per-second updates.
- Does not use duplicate timers.
- Does not place `requestAnimationFrame` inside a `draw*` or `render*` function.

### A2. Behavioral modification

Prompt:

```text
modify @webs/harness-clock.html so the seconds hand moves smoothly at 30fps instead of jumping once per second. Preserve the Swiss railway clock appearance and avoid creating duplicate animation loops or timers.
```

Expected harness behavior:

- Reads `webs/harness-clock.html`.
- Uses `code_planner` first because this is a behavioral timing change.
- Uses `code_editor` or `function_editor`, not `safe_editor`.
- Submits both a planner contract and an editor contract.
- Calls `web_check_check_web` because an HTML file changed.
- Passes the post-edit animation/timer checker.

Expected file behavior:

- Uses one animation loop or one 30fps timer.
- Does not keep the old once-per-second timer active.
- Does not create nested or duplicate `requestAnimationFrame` loops.

### A3. Trivial style modification

Prompt:

```text
modify @webs/harness-clock.html so the seconds hand is green instead of red. Preserve all timing behavior and run the web checker.
```

Expected harness behavior:

- Reads `webs/harness-clock.html`.
- May use `safe_editor` because this is a trivial style/color replacement.
- Uses `safe_editor` at most once for `webs/harness-clock.html`.
- Submits an editor contract.
- Calls `web_check_check_web`.
- Does not introduce animation/timer regressions.

Expected file behavior:

- Seconds hand color changes to green.
- Existing timer or animation logic remains unchanged.

## Scenario B: Slider Movement

### B1. One-shot creation

Prompt:

```text
Create a new file named harness-slider.html at webs folder with a playable 3x3 sliding puzzle. Use only HTML, CSS, and JavaScript in one self-contained file. The pieces must be div elements with large numbers from 1 to 8, the empty space starts at the bottom right, clicking a neighboring tile moves it into the empty space, and the puzzle reports solved only when the numbers are sorted and the empty space is bottom right. Run the web checker.
```

Expected harness behavior:

- Uses `safe_editor` exactly once for `webs/harness-slider.html`.
- Submits an editor contract.
- Reads or confirms the created file.
- Calls `web_check_check_web`.

Expected file behavior:

- Uses div tiles, not canvas.
- Contains adjacency logic for legal moves.
- Contains solved-state logic.

### B2. Behavioral/CSS modification

Prompt:

```text
modify @webs/harness-slider.html so tile movement animates smoothly when a clicked tile moves into the empty space. Do not rewrite the puzzle. Preserve the existing move validation and solved-state logic.
```

Expected harness behavior:

- Uses `code_planner` first.
- Uses `code_editor` because this is an existing-file behavior/style interaction.
- Does not use `safe_editor`.
- Submits planner and editor contracts.
- Calls `web_check_check_web`.

Expected file behavior:

- Adds transition or transform-based movement without replacing core puzzle logic.

## Scenario C: Contract Failure Probe

### C1. Must reject prose-only success

Prompt:

```text
modify @webs/harness-clock.html by changing only the document title to Harness Clock Test. Use the required editing tools and verification; do not just describe the change.
```

Expected harness behavior:

- Fails if no new `agent_contract` edit result is written.
- Fails if no changed-file verification is visible.
- Fails if the model returns prose-only success.
