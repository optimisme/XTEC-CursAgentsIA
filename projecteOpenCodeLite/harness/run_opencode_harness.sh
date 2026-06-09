#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
KEYS_FILE="$PROJECT_DIR/keys.env"
EXAMPLE_FILE="$PROJECT_DIR/keys.env.example"

cd "$PROJECT_DIR"

CONTRACT_LOG=".opencode/mcp/agent_contract/contracts.jsonl"

snapshot_web_files() {
  local output_file="$1"
  : > "$output_file"
  find . -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' \) \
    ! -path './.opencode/*' \
    ! -path './node_modules/*' \
    -print0 \
    | while IFS= read -r -d '' file; do
        shasum "$file"
      done \
    | sort > "$output_file"
}

if [ ! -f "$KEYS_FILE" ]; then
  echo "Error: keys.env was not found."
  echo
  echo "Create it from the example file:"
  echo "  cp \"$EXAMPLE_FILE\" \"$KEYS_FILE\""
  echo
  echo "Then edit keys.env and fill in your API keys."
  exit 1
fi

set -a
source "$KEYS_FILE"
set +a

if [ "${1:-}" = "run" ]; then
  HARNESS_RUN_TIMEOUT_SECONDS="${HARNESS_RUN_TIMEOUT_SECONDS:-420}"
  HARNESS_REQUIRE_CONTRACTS="${HARNESS_REQUIRE_CONTRACTS:-0}"
  HARNESS_STRICT_ROUTING="${HARNESS_STRICT_ROUTING:-0}"
  PROMPT_TEXT="$*"
  LOG_FILE="$(mktemp "${TMPDIR:-/tmp}/opencode-run.XXXXXX")"
  WEB_SNAPSHOT_BEFORE="$(mktemp "${TMPDIR:-/tmp}/opencode-web-before.XXXXXX")"
  WEB_SNAPSHOT_AFTER="$(mktemp "${TMPDIR:-/tmp}/opencode-web-after.XXXXXX")"
  CHANGED_WEB_FILES="$(mktemp "${TMPDIR:-/tmp}/opencode-web-changed.XXXXXX")"
  TIMED_OUT_FILE="$(mktemp "${TMPDIR:-/tmp}/opencode-timeout.XXXXXX")"
  EARLY_FAIL_FILE="$(mktemp "${TMPDIR:-/tmp}/opencode-early-fail.XXXXXX")"
  rm -f "$TIMED_OUT_FILE"
  rm -f "$EARLY_FAIL_FILE"
  CONTRACT_LINES_BEFORE=0
  if [ -f "$CONTRACT_LOG" ]; then
    CONTRACT_LINES_BEFORE="$(wc -l < "$CONTRACT_LOG" | tr -d ' ')"
  fi
  snapshot_web_files "$WEB_SNAPSHOT_BEFORE"

  set +e
  opencode "$@" > >(tee "$LOG_FILE") 2>&1 &
  OPENCODE_PID=$!
  (
    sleep "$HARNESS_RUN_TIMEOUT_SECONDS"
    if kill -0 "$OPENCODE_PID" 2>/dev/null; then
      : > "$TIMED_OUT_FILE"
      pkill -TERM -P "$OPENCODE_PID" 2>/dev/null || true
      kill -TERM "$OPENCODE_PID" 2>/dev/null || true
    fi
  ) &
  WATCHER_PID=$!
  (
    while kill -0 "$OPENCODE_PID" 2>/dev/null; do
      CHECK_FILE="$(mktemp "${TMPDIR:-/tmp}/opencode-early-check.XXXXXX")"
      if node harness/log_safety_check.js "$LOG_FILE" "$PROMPT_TEXT" "" --early > "$CHECK_FILE"; then
        rm -f "$CHECK_FILE"
      else
        mv "$CHECK_FILE" "$EARLY_FAIL_FILE"
        pkill -TERM -P "$OPENCODE_PID" 2>/dev/null || true
        kill -TERM "$OPENCODE_PID" 2>/dev/null || true
        break
      fi
      sleep 2
    done
  ) &
  SAFETY_WATCHER_PID=$!
  wait "$OPENCODE_PID"
  STATUS=$?
  kill "$WATCHER_PID" 2>/dev/null || true
  kill "$SAFETY_WATCHER_PID" 2>/dev/null || true
  wait "$WATCHER_PID" 2>/dev/null || true
  wait "$SAFETY_WATCHER_PID" 2>/dev/null || true
  set -e
  snapshot_web_files "$WEB_SNAPSHOT_AFTER"
  node - "$WEB_SNAPSHOT_BEFORE" "$WEB_SNAPSHOT_AFTER" > "$CHANGED_WEB_FILES" <<'NODE'
const fs = require('fs');
const [beforeFile, afterFile] = process.argv.slice(2);
function readSnapshot(file) {
  const map = new Map();
  if (!fs.existsSync(file)) return map;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = line.match(/^([0-9a-f]+)\s+(.+)$/i);
    if (match) map.set(match[2].replace(/^\.\//, ''), match[1]);
  }
  return map;
}
const before = readSnapshot(beforeFile);
const after = readSnapshot(afterFile);
for (const [file, hash] of after) {
  if (before.get(file) !== hash) console.log(file);
}
NODE

  HARNESS_STATUS=0
  HARNESS_ERROR=""
  HARNESS_REQUIREMENT=""
  HARNESS_EXPECTED_ACTION=""
  HARNESS_REPAIR_HINT=""

  observed_actions() {
    grep -Eo '(safe_edit_safe_[A-Za-z0-9_]+|web_check_check_web|agent_contract_[A-Za-z0-9_]+|image_vision_describe|[A-Za-z_]+ Agent)' "$LOG_FILE" \
      | sort -u \
      | sed 's/^/- /' || true
  }

  changed_web_summary() {
    sed 's/^/- /' "$CHANGED_WEB_FILES" || true
  }

  fail_harness() {
    HARNESS_STATUS="$1"
    HARNESS_ERROR="$2"
    HARNESS_REQUIREMENT="$3"
    HARNESS_EXPECTED_ACTION="$4"
    HARNESS_REPAIR_HINT="$5"
  }

  IS_EDIT_PROMPT=1
  if ! printf '%s' "$PROMPT_TEXT" | grep -Eiq '(^|[[:space:]])(fix|modify|create|implement|update|repair|arregl|modifica|crea|implementa)([[:space:]]|$)'; then
    IS_EDIT_PROMPT=0
  fi

  IS_EXISTING_BEHAVIOR_MODIFY=0
  if printf '%s' "$PROMPT_TEXT" | grep -Eiq 'modify[[:space:]]+@[^[:space:]]+' \
    && printf '%s' "$PROMPT_TEXT" | grep -Eiq 'smooth|continuously|movement|animation|animate|logic|fix|repair|bug|fps|every second|jump|start|pause|restart|score|collision|keyboard|canvas'; then
    IS_EXISTING_BEHAVIOR_MODIFY=1
  fi

  if [ -s "$EARLY_FAIL_FILE" ]; then
    HARNESS_STATUS="$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); console.log(j.code)' "$EARLY_FAIL_FILE")"
    HARNESS_REQUIREMENT="$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); console.log(j.failedRequirement)' "$EARLY_FAIL_FILE")"
    HARNESS_ERROR="$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); console.log(j.reason)' "$EARLY_FAIL_FILE")"
    HARNESS_EXPECTED_ACTION="$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); console.log(j.expectedAction)' "$EARLY_FAIL_FILE")"
    HARNESS_REPAIR_HINT="$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); console.log(j.repairHint)' "$EARLY_FAIL_FILE")"
  elif [ -f "$TIMED_OUT_FILE" ]; then
    fail_harness 72 "opencode exceeded ${HARNESS_RUN_TIMEOUT_SECONDS}s harness timeout" "complete_within_harness_timeout" "final response before timeout" "Use a smaller scoped prompt, reduce planner/editor output, or split the task into creation plus one targeted modification."
  elif [ "$STATUS" -ne 0 ]; then
    fail_harness "$STATUS" "opencode exited with status $STATUS" "opencode_completed" "opencode run exits 0" "Read the log, fix the reported OpenCode/tool failure, and rerun the task."
  elif grep -Eq '<\|channel>|<channel\|>|<\|tool_call|<tool_call\|>|call:task' "$LOG_FILE"; then
    fail_harness 68 "visible pseudo-channel or pseudo-tool syntax was emitted" "clean_visible_transcript" "no protocol-like text in assistant output" "Treat this as malformed model output; retry with a smaller prompt or stronger instruction, and reject the run."
  elif grep -Eq '"reason":"length"|reason="length"' "$LOG_FILE"; then
    fail_harness 64 "opencode stopped because it hit the output length limit" "complete_response_within_budget" "final response before length stop" "Reduce prompt/context size or split the task into smaller file-scoped edits."
  elif node - "$LOG_FILE" <<'NODE'
const fs = require('fs');
const text = fs.readFileSync(process.argv[2], 'utf8');
process.exit(/<task_result>\s*<\/task_result>/.test(text) ? 0 : 1);
NODE
  then
    fail_harness 65 "a subagent returned an empty task_result" "non_empty_subagent_result" "task result with ok/status content" "Treat the subagent result as invalid; make one direct scoped editor call if the edit is already known, otherwise report the blocker."
  elif printf '%s' "$PROMPT_TEXT" | grep -Eiq 'web_check|run web check|run the web checker'; then
    if ! grep -q 'web_check_check_web' "$LOG_FILE"; then
      fail_harness 66 "prompt requested web_check but no web_check_check_web call was observed" "final_web_validation" "web_check_check_web" "Run web_check_check_web on the HTML entry file before the final response."
    fi
  fi

  if [ "$HARNESS_STATUS" -eq 0 ] && [ "$IS_EDIT_PROMPT" -eq 1 ] && [ "$HARNESS_REQUIRE_CONTRACTS" = "1" ]; then
    if ! node - "$CONTRACT_LOG" "$CONTRACT_LINES_BEFORE" "$IS_EXISTING_BEHAVIOR_MODIFY" <<'NODE'
const fs = require('fs');
const [logFile, beforeText, behaviorText] = process.argv.slice(2);
const before = Number(beforeText || 0);
const requiresPlan = behaviorText === "1";
const lines = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8").trimEnd().split(/\r?\n/) : [];
const newRows = lines.slice(before).map((line) => {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}).filter(Boolean);
const hasEditResult = newRows.some((row) => row.kind === "edit_result");
const hasPlan = newRows.some((row) => row.kind === "plan");
if (!hasEditResult) {
  console.error("missing edit_result contract");
  process.exit(1);
}
if (requiresPlan && !hasPlan) {
  console.error("missing plan contract for behavioral modification");
  process.exit(2);
}
NODE
    then
      fail_harness 67 "edit-like prompt completed without required agent_contract rows" "contracted_plan_and_edit_result" "agent_contract_submit_plan when planning is required, plus agent_contract_submit_edit_result" "Planner/editor subagents must submit contract rows after planning and safe_edit verification."
    fi
  fi

  if [ "$HARNESS_STATUS" -eq 0 ] && [ -s "$CHANGED_WEB_FILES" ]; then
    if ! grep -q 'web_check_check_web' "$LOG_FILE"; then
      fail_harness 66 "web files changed but no web_check_check_web call was observed" "final_web_validation_for_changed_web_files" "web_check_check_web" "Run web_check_check_web on the HTML entry file after changing any .html, .css, or .js file."
    fi
  fi

  if [ "$HARNESS_STATUS" -eq 0 ]; then
    CHECK_FILE="$(mktemp "${TMPDIR:-/tmp}/opencode-post-check.XXXXXX")"
    if node harness/log_safety_check.js "$LOG_FILE" "$PROMPT_TEXT" "$CHANGED_WEB_FILES" > "$CHECK_FILE"; then
      rm -f "$CHECK_FILE"
    else
      HARNESS_STATUS="$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); console.log(j.code)' "$CHECK_FILE")"
      HARNESS_REQUIREMENT="$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); console.log(j.failedRequirement)' "$CHECK_FILE")"
      HARNESS_ERROR="$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); console.log(j.reason)' "$CHECK_FILE")"
      HARNESS_EXPECTED_ACTION="$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); console.log(j.expectedAction)' "$CHECK_FILE")"
      HARNESS_REPAIR_HINT="$(node -e 'const fs=require("fs"); const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); console.log(j.repairHint)' "$CHECK_FILE")"
      rm -f "$CHECK_FILE"
    fi
  fi

  if [ "$HARNESS_STATUS" -eq 0 ] && [ "$IS_EXISTING_BEHAVIOR_MODIFY" -eq 1 ] && [ "$HARNESS_STRICT_ROUTING" = "1" ]; then
    if grep -q 'Safe_editor Agent' "$LOG_FILE"; then
      fail_harness 69 "behavioral modify prompt used safe_editor" "behavioral_modify_routing" "Code_planner Agent followed by Code_editor Agent or Function_editor Agent" "Route behavioral existing-file modifications through code_planner, then code_editor or function_editor."
    elif ! grep -q 'Code_planner Agent' "$LOG_FILE" || ! grep -Eq 'Code_editor Agent|Function_editor Agent' "$LOG_FILE"; then
      fail_harness 69 "behavioral modify prompt did not use planner plus code/function editor" "behavioral_modify_routing" "Code_planner Agent followed by Code_editor Agent or Function_editor Agent" "Use code_planner for the scoped plan, then apply it with code_editor or function_editor."
    fi
  fi

  if [ "$HARNESS_STATUS" -eq 0 ]; then
    if ! node - "$LOG_FILE" <<'NODE'
const fs = require('fs');
const text = fs.readFileSync(process.argv[2], 'utf8');
const counts = new Map();
for (const line of text.split(/\r?\n/)) {
  const clean = line.replace(/\x1b\[[0-9;]*m/g, "");
  if (!/• .*Safe_editor Agent/.test(clean)) continue;
  const match = clean.match(/webs\/[A-Za-z0-9._/-]+\.(?:html|css|js|md|txt|json)/);
  if (!match) continue;
  counts.set(match[0], (counts.get(match[0]) || 0) + 1);
}
for (const [file, count] of counts) {
  if (count > 1) {
    console.error(`${file} safe_editor calls: ${count}`);
    process.exit(1);
  }
}
NODE
    then
      fail_harness 70 "safe_editor was called more than once for the same file" "single_safe_editor_call_per_file" "one Safe_editor Agent call per target file" "Use code_editor/function_editor for follow-up repairs, or stop after one failed same-file safe_editor attempt."
    fi
  fi

  if [ "$HARNESS_STATUS" -eq 0 ] && [ -s "$CHANGED_WEB_FILES" ]; then
    if ! node harness/web_post_edit_check.js "$CHANGED_WEB_FILES"; then
      fail_harness 71 "post-edit web pattern check failed" "web_animation_timer_invariants" "no duplicate timers and no requestAnimationFrame inside draw/render functions" "Repair the smallest timer/animation invariant, then rerun web_check_check_web."
    fi
  fi

  if [ "$HARNESS_STATUS" -ne 0 ]; then
    {
      echo "Harness failure:"
      echo "failed_requirement: $HARNESS_REQUIREMENT"
      echo "reason: $HARNESS_ERROR"
      echo "expected_action: $HARNESS_EXPECTED_ACTION"
      echo "observed_actions:"
      observed_actions
      echo "changed_web_files:"
      changed_web_summary
      echo "repair_hint: $HARNESS_REPAIR_HINT"
      echo "log: $LOG_FILE"
    } >&2
    exit "$HARNESS_STATUS"
  fi

  exit 0
fi

exec opencode "$@"
