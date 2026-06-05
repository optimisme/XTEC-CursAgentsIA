#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KEYS_FILE="$SCRIPT_DIR/keys.env"
EXAMPLE_FILE="$SCRIPT_DIR/keys.env.example"

cd "$SCRIPT_DIR"

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
  LOG_FILE="$(mktemp "${TMPDIR:-/tmp}/opencode-run.XXXXXX.log")"
  set +e
  opencode "$@" 2>&1 | tee "$LOG_FILE"
  STATUS=${PIPESTATUS[0]}
  set -e

  PROMPT_TEXT="$*"
  HARNESS_STATUS=0
  HARNESS_ERROR=""

  if [ "$STATUS" -ne 0 ]; then
    HARNESS_STATUS="$STATUS"
    HARNESS_ERROR="opencode exited with status $STATUS"
  elif grep -Eq '"reason":"length"|reason="length"' "$LOG_FILE"; then
    HARNESS_STATUS=64
    HARNESS_ERROR="opencode stopped because it hit the output length limit"
  elif node - "$LOG_FILE" <<'NODE'
const fs = require('fs');
const text = fs.readFileSync(process.argv[2], 'utf8');
process.exit(/<task_result>\s*<\/task_result>/.test(text) ? 0 : 1);
NODE
  then
    HARNESS_STATUS=65
    HARNESS_ERROR="a subagent returned an empty task_result"
  elif printf '%s' "$PROMPT_TEXT" | grep -Eiq 'web_check|run web check|run the web checker'; then
    if ! grep -q 'web_check_check_web' "$LOG_FILE"; then
      HARNESS_STATUS=66
      HARNESS_ERROR="prompt requested web_check but no web_check_check_web call was observed"
    fi
  fi

  if [ "$HARNESS_STATUS" -eq 0 ] && printf '%s' "$PROMPT_TEXT" | grep -Eiq '(^|[[:space:]])(fix|modify|create|implement|update|repair|arregl|modifica|crea|implementa)([[:space:]]|$)'; then
    if ! grep -Eq 'safe_edit_safe_(create_file|create_file_from_lines|replace_lines|insert_lines|delete_lines)' "$LOG_FILE"; then
      HARNESS_STATUS=67
      HARNESS_ERROR="edit-like prompt completed without any safe_edit write call"
    fi
  fi

  if [ "$HARNESS_STATUS" -ne 0 ]; then
    echo "Harness failure: $HARNESS_ERROR" >&2
    echo "Harness log: $LOG_FILE" >&2
    exit "$HARNESS_STATUS"
  fi

  exit 0
fi

exec opencode "$@"
