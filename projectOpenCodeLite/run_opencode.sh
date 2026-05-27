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
  args=("${@:2}")
  has_agent=0

  for arg in "${args[@]}"; do
    if [ "$arg" = "--agent" ]; then
      has_agent=1
    fi
    case "$arg" in
      --agent=*) has_agent=1 ;;
    esac
  done

  final_args=(run)
  if [ "$has_agent" -eq 0 ]; then
    final_args+=(--agent goal-lite)
  fi
  final_args+=("${args[@]}")

  exec opencode "${final_args[@]}"
fi

exec opencode "$@"
