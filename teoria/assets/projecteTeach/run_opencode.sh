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

chmod 600 "$KEYS_FILE"

set -a
source "$KEYS_FILE"
set +a

if [ "${1:-}" = "desktop" ]; then
  OS="$(uname -s)"

  if [ "$OS" = "Darwin" ]; then
    # Launch macOS desktop app with inherited environment variables
    APP="/Applications/OpenCode.app"

    if [ ! -d "$APP" ]; then
      echo "Error: OpenCode.app was not found in /Applications"
      exit 1
    fi

    BIN="$(find "$APP/Contents/MacOS" -type f -maxdepth 1 | head -n 1)"

    if [ -z "$BIN" ]; then
      echo "Error: OpenCode desktop binary was not found."
      exit 1
    fi

    exec "$BIN"

  elif [ "$OS" = "Linux" ]; then
    # Try common Linux desktop launch paths
    if command -v opencode-desktop >/dev/null 2>&1; then
      exec opencode-desktop
    fi

    if command -v OpenCode >/dev/null 2>&1; then
      exec OpenCode
    fi

    if command -v opencode >/dev/null 2>&1; then
      echo "Warning: opencode desktop binary was not found."
      echo "Falling back to CLI opencode."
      exec opencode
    fi

    echo "Error: OpenCode desktop executable was not found."
    echo "Tried: opencode-desktop, OpenCode, opencode"
    exit 1

  else
    echo "Error: unsupported OS: $OS"
    exit 1
  fi
fi

exec opencode "$@"