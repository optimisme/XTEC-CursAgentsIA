#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${MODELCTL_CONFIG:-$ROOT_DIR/models.json}"
TOKENS_FILE="${MODELCTL_TOKENS_FILE:-$ROOT_DIR/tokens.env}"

usage() {
  cat <<EOF
Usage:
  ./docker/modelctl.sh [action] [model]
  ./docker/modelctl.sh [model] [action]
  ./docker/modelctl.sh cache [ls|du|rm] [volume|all] [--force]

Actions:
  list          list configured models
  start         start selected model without stopping others
  restart       stop all configured model containers, then start selected model
  stop          stop all configured model containers
  logs          follow logs for selected model
  ps            show Docker containers
  info          show selected model metadata
  cache ls      list configured cache volumes
  cache du      show configured cache volume sizes
  cache rm      remove one configured cache volume, or all, requires --force

Examples:
  ./docker/modelctl.sh list
  ./docker/modelctl.sh start qwen36-35b-a3b-base-cuda-vram16-llamacpp-localweights-iq4-mtp
  ./docker/modelctl.sh qwen36-35b-a3b-base-cuda-vram16-llamacpp-localweights-iq4-mtp logs
  ./docker/modelctl.sh cache du
  ./docker/modelctl.sh cache rm xtec-gguf-cache --force
EOF
}

json_query() {
  python3 - "$CONFIG_FILE" "$@" <<'PY'
import json
import sys

config_path = sys.argv[1]
cmd = sys.argv[2]
args = sys.argv[3:]

with open(config_path, "r", encoding="utf-8") as fh:
    cfg = json.load(fh)

models = cfg["models"]

def require_model(name):
    if name not in models:
        print(f"Unknown model: {name}", file=sys.stderr)
        print("Available models:", file=sys.stderr)
        for model_name in sorted(models):
            print(f"  {model_name}", file=sys.stderr)
        sys.exit(2)
    return models[name]

if cmd == "default_model":
    print(cfg["default_model"])
elif cmd == "compose_project":
    print(cfg.get("compose_project", "vllm"))
elif cmd == "endpoint":
    print(cfg.get("endpoint", "http://127.0.0.1:8000/v1"))
elif cmd == "list_models":
    default = cfg["default_model"]
    for name in sorted(models):
        model = models[name]
        suffix = " default" if name == default else ""
        print(f"{name}\t{model['engine']}\t{model['container']}\t{model['compose']}{suffix}")
elif cmd == "compose":
    print(require_model(args[0])["compose"])
elif cmd == "container":
    print(require_model(args[0])["container"])
elif cmd == "engine":
    print(require_model(args[0])["engine"])
elif cmd == "model_json":
    name = args[0]
    model = require_model(name)
    payload = {"name": name, **model}
    payload["endpoint"] = cfg.get("endpoint", "http://127.0.0.1:8000/v1")
    print(json.dumps(payload, indent=2))
elif cmd == "containers":
    for model in models.values():
        print(model["container"])
elif cmd == "compose_files":
    for model in models.values():
        print(model["compose"])
elif cmd == "volumes":
    for name in sorted(cfg.get("volumes", {})):
        print(name)
elif cmd == "volume_exists":
    name = args[0]
    if name not in cfg.get("volumes", {}):
        print(f"Unknown configured volume: {name}", file=sys.stderr)
        sys.exit(2)
    print(name)
else:
    print(f"Unknown json query: {cmd}", file=sys.stderr)
    sys.exit(2)
PY
}

default_model() {
  json_query default_model
}

compose_project() {
  json_query compose_project
}

endpoint() {
  json_query endpoint
}

write_hf_token() {
  local token="$1"
  local tmp

  if [[ "$token" == *$'\n'* || "$token" == *$'\r'* ]]; then
    echo "Refusing to write HUGGINGFACE_ACCESS_TOKENS because it contains a newline." >&2
    exit 2
  fi

  tmp="$(mktemp "${TOKENS_FILE}.tmp.XXXXXX")"
  if [[ -f "$TOKENS_FILE" ]]; then
    grep -v '^HUGGINGFACE_ACCESS_TOKENS=' "$TOKENS_FILE" >"$tmp" || true
  fi
  printf 'HUGGINGFACE_ACCESS_TOKENS=%s\n' "$token" >>"$tmp"
  chmod 600 "$tmp"
  mv "$tmp" "$TOKENS_FILE"
}

ensure_tokens_env() {
  if [[ -n "${HUGGINGFACE_ACCESS_TOKENS:-}" ]]; then
    write_hf_token "$HUGGINGFACE_ACCESS_TOKENS"
    echo "Using HUGGINGFACE_ACCESS_TOKENS from the current environment."
    return
  fi

  if [[ -f "$TOKENS_FILE" ]] && grep -q '^HUGGINGFACE_ACCESS_TOKENS=' "$TOKENS_FILE"; then
    echo "Using HUGGINGFACE_ACCESS_TOKENS from $TOKENS_FILE."
    return
  fi

  if [[ ! -f "$TOKENS_FILE" ]]; then
    install -m 600 /dev/null "$TOKENS_FILE"
  fi

  if [[ -t 0 && -t 1 ]]; then
    local answer token
    read -r -p "No HUGGINGFACE_ACCESS_TOKENS found. Add one to $TOKENS_FILE now? [y/N] " answer
    case "$answer" in
      y|Y|yes|YES)
        read -r -s -p "Hugging Face token: " token
        printf '\n'
        if [[ -n "$token" ]]; then
          write_hf_token "$token"
          echo "Saved HUGGINGFACE_ACCESS_TOKENS to $TOKENS_FILE."
        else
          echo "Empty token; continuing without HUGGINGFACE_ACCESS_TOKENS."
        fi
        ;;
      *)
        echo "Continuing without HUGGINGFACE_ACCESS_TOKENS."
        ;;
    esac
  else
    echo "No HUGGINGFACE_ACCESS_TOKENS found in the environment or $TOKENS_FILE." >&2
    echo "Continuing without a Hugging Face token." >&2
  fi
}

normalize_args() {
  ACTION="${1:-restart}"
  MODEL="${2:-$(default_model)}"

  if [[ $# -eq 0 ]]; then
    ACTION="restart"
    MODEL="$(default_model)"
    return
  fi

  if [[ $# -eq 1 ]]; then
    case "$1" in
      list|stop|ps|cache|-h|--help|help)
        ACTION="$1"
        MODEL="$(default_model)"
        ;;
      start|restart|logs|info)
        ACTION="$1"
        MODEL="$(default_model)"
        ;;
      *)
        ACTION="restart"
        MODEL="$1"
        ;;
    esac
    return
  fi

  case "$1" in
    start|restart|logs|info)
      ACTION="$1"
      MODEL="$2"
      ;;
    *)
      case "$2" in
        start|restart|logs|info)
          ACTION="$2"
          MODEL="$1"
          ;;
      esac
      ;;
  esac
}

compose_file_for() {
  json_query compose "$1"
}

container_for() {
  json_query container "$1"
}

stop_all() {
  local project
  project="$(compose_project)"

  echo "Stopping configured compose stacks..."
  while IFS= read -r file; do
    if [[ -f "$ROOT_DIR/$file" ]]; then
      docker compose -p "$project" -f "$ROOT_DIR/$file" down --remove-orphans
    fi
  done < <(json_query compose_files)

  while IFS= read -r container; do
    if docker ps -a --format '{{.Names}}' | grep -Fxq "$container"; then
      docker rm -f "$container"
    fi
  done < <(json_query containers)
}

start_model() {
  local model="$1"
  local file project container
  file="$(compose_file_for "$model")"
  project="$(compose_project)"
  container="$(container_for "$model")"

  echo "Starting $model with $file..."
  ensure_tokens_env
  python3 - "$CONFIG_FILE" "$model" <<'PY' | while IFS= read -r volume; do
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as fh:
    cfg = json.load(fh)

for volume in cfg["models"][sys.argv[2]].get("volumes", []):
    print(volume)
PY
    docker volume create "$volume" >/dev/null
  done
  docker compose -p "$project" -f "$ROOT_DIR/$file" up -d
  echo "Container: $container"
  echo "Endpoint:  $(endpoint)"
  echo "Logs:      ./docker/modelctl.sh logs $model"
}

cache_ls() {
  printf 'Configured cache volumes:\n'
  while IFS= read -r volume; do
    if docker volume inspect "$volume" >/dev/null 2>&1; then
      printf '  %-18s exists\n' "$volume"
    else
      printf '  %-18s missing\n' "$volume"
    fi
  done < <(json_query volumes)
}

cache_du() {
  while IFS= read -r volume; do
    if docker volume inspect "$volume" >/dev/null 2>&1; then
      docker run --rm -v "$volume:/cache:ro" alpine sh -lc "du -sh /cache" | awk -v volume="$volume" '{ printf "%-18s %s\n", volume, $1 }'
    else
      printf '%-18s missing\n' "$volume"
    fi
  done < <(json_query volumes)
}

cache_rm() {
  local target="${1:-}"
  local force="${2:-}"

  if [[ -z "$target" || "$force" != "--force" ]]; then
    echo "Refusing to remove cache volumes without an explicit target and --force." >&2
    echo "Usage: ./docker/modelctl.sh cache rm [volume|all] --force" >&2
    exit 2
  fi

  if [[ "$target" == "all" ]]; then
    while IFS= read -r volume; do
      docker volume rm "$volume"
    done < <(json_query volumes)
    return
  fi

  json_query volume_exists "$target" >/dev/null
  docker volume rm "$target"
}

if [[ "${1:-}" == "cache" ]]; then
  case "${2:-ls}" in
    ls) cache_ls ;;
    du) cache_du ;;
    rm) cache_rm "${3:-}" "${4:-}" ;;
    -h|--help|help) usage ;;
    *)
      echo "Unknown cache action: ${2:-}" >&2
      usage >&2
      exit 2
      ;;
  esac
  exit 0
fi

normalize_args "$@"

case "$ACTION" in
  list)
    json_query list_models
    ;;
  restart)
    compose_file_for "$MODEL" >/dev/null
    stop_all
    start_model "$MODEL"
    ;;
  start)
    start_model "$MODEL"
    ;;
  stop)
    stop_all
    ;;
  logs)
    compose_file_for "$MODEL" >/dev/null
    docker logs -f --tail 80 "$(container_for "$MODEL")"
    ;;
  ps)
    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    ;;
  info)
    json_query model_json "$MODEL"
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    echo "Unknown action: $ACTION" >&2
    usage >&2
    exit 2
    ;;
esac
