#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KEYS_FILE="$SCRIPT_DIR/keys.env"
EXAMPLE_FILE="$SCRIPT_DIR/keys.env.example"

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
  for arg in "$@"; do
    if [ "$arg" = "--agent" ]; then
      exec opencode "$@"
    fi
    case "$arg" in
      --agent=*)
        exec opencode "$@"
        ;;
    esac
  done

  exec opencode run --agent goal "${@:2}"
fi

exec opencode "$@"
