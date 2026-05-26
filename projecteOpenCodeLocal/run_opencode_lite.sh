#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

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
    final_args+=(--agent build)
  fi
  final_args+=("${args[@]}")

  exec opencode "${final_args[@]}"
fi

exec opencode "$@"
