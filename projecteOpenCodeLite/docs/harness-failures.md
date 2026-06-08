# Harness Failure Examples

Compact invalid and corrected traces for small local models.

Use these examples to recognize invalid action sequences. They are examples of observable workflow errors, not project memory.

## Missing edit action

invalid_trace:
- User asks to create `webs/snake.html`.
- Agent replies that the file was created.
- No `safe_edit_safe_create_file` or other safe_edit write call occurred.

why_invalid:
- Final state was claimed without an edit action.

correct_trace:
- Call `safe_editor` with `file: webs/snake.html`.
- `safe_editor` calls `safe_edit_safe_create_file`.
- `safe_editor` calls `safe_edit_safe_verify_file`.
- Coordinator reads or globs the expected file before final.

## Missing web check

invalid_trace:
- User asks to run the web checker.
- Agent edits an HTML file and returns final.
- No `web_check_check_web` call occurred.

why_invalid:
- Required final validator was skipped.

correct_trace:
- Verify edited files through safe_edit.
- Coordinator calls `web_check_check_web` on the HTML entry file.
- Final response states the web check result.

## Empty subagent result

invalid_trace:
- `task` returns an empty `<task_result></task_result>`.
- Coordinator continues as if the edit succeeded.

why_invalid:
- Empty subagent output gives no file, action, or verification state.

correct_trace:
- Treat empty result as invalid state feedback.
- Make one direct scoped editor call only if the exact edit is already known.
- Otherwise stop with `Blocker: empty subagent result`.

## Wrong target file

invalid_trace:
- User asks for `webs/paint.js`.
- Editor writes `webs/paint.html` because it noticed an HTML entry file.

why_invalid:
- The action effect occurred on a different state object than requested.

correct_trace:
- Every editor prompt starts with the exact target path.
- Every safe_edit call uses exactly that same file path.
- Coordinator verifies the requested file exists and has the expected kind.

## Wrong file kind

invalid_trace:
- User asks for separate `game.html`, `game.css`, and `game.js`.
- Agent writes JavaScript into `game.html` and leaves `game.js` empty or missing.

why_invalid:
- File-kind invariant failed.

correct_trace:
- Create HTML first with markup and links.
- Create CSS second with CSS rules.
- Create JS third with JavaScript code.
- Re-read or glob each requested file before `web_check_check_web`.

## Over-broad repair

invalid_trace:
- A validator reports one missing button.
- Agent rewrites the whole app.

why_invalid:
- Repair did not target the failed invariant and risks unrelated regressions.

correct_trace:
- Identify the failed invariant.
- Make one smallest repair.
- Verify again.
- If the same invariant fails twice, stop with a blocker.

## Planner claims edits

invalid_trace:
- `code_planner` says it fixed a bug.
- No editor subagent or safe_edit write tool was used.

why_invalid:
- Planner is read-only and cannot change file state.

correct_trace:
- `code_planner` returns target file, target unit, preconditions, edit tasks, expected result, and verification.
- Coordinator passes that plan to `function_editor` or `code_editor`.

## Image tool misuse

invalid_trace:
- User asks for polished animation or better colors.
- Agent calls `image_vision_describe` even though no local image path was provided.

why_invalid:
- Image inspection is only applicable when an explicit local image file is named.

correct_trace:
- Use normal file reads and web validation for visual/style requests.
- Call `image_vision_describe` only for explicit local image paths such as `calculator.png`.

## Visible pseudo-channel text

invalid_trace:
- Model emits `<|channel>thought`, `<channel|>`, `<|tool_call>`, or `call:task` as visible assistant text.
- The rest of the run may still include real tool calls.

why_invalid:
- Protocol-like text in visible output means the model confused hidden/tool syntax with user-facing prose.
- Sanitizing the display does not prove the run followed the intended tool protocol.

correct_trace:
- Use real tool calls only.
- Return plain final text without pseudo-channel or fake tool-call syntax.
- Harness rejects the run with `clean_visible_transcript` so it can be retried or analyzed.
