#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_PROJECT="vllm"

declare -A COMPOSE_FILES=(
  ["qwen3-8b"]="docker-compose-qwen3-8b.yml"
  ["qwen3-14b"]="docker-compose-qwen3-14b.yml"
  ["gemma4-8b"]="docker-compose-gemma4-8b.yml"
  ["qwen3.6-27b"]="docker-compose-qwen36-27b.yml"
)

declare -A CONTAINERS=(
  ["qwen3-8b"]="qwen3_8b_awq_vllm"
  ["qwen3-14b"]="qwen3_14b_awq_vllm"
  ["gemma4-8b"]="gemma4_8b_vllm"
  ["qwen3.6-27b"]="qwen36_27b_vllm"
)

DEFAULT_MODEL="gemma4-8b"
MODEL="${1:-$DEFAULT_MODEL}"
ACTION="${2:-restart}"

usage() {
  cat <<EOF
Usage:
  ./docker/run_docker.sh [model] [action]

Models:
  qwen3-8b
  qwen3-14b
  gemma4-8b     default
  qwen3.6-27b   intended for larger GPU hosts

Actions:
  restart       stop all known model containers, then start selected model
  start         start selected model without stopping others
  stop          stop all known model containers
  logs          follow logs for selected model
  ps            show containers

Examples:
  ./docker/run_docker.sh
  ./docker/run_docker.sh gemma4-8b
  ./docker/run_docker.sh qwen3-14b logs
  ./docker/run_docker.sh qwen3-8b stop
EOF
}

compose_file_for() {
  local model="$1"

  if [[ -z "${COMPOSE_FILES[$model]:-}" ]]; then
    echo "Unknown model: $model" >&2
    echo >&2
    usage >&2
    exit 2
  fi

  printf '%s\n' "${COMPOSE_FILES[$model]}"
}

stop_all() {
  echo "Stopping known vLLM compose stacks..."
  for file in "${COMPOSE_FILES[@]}"; do
    docker compose -p "$COMPOSE_PROJECT" -f "$ROOT_DIR/$file" down --remove-orphans
  done
}

start_model() {
  local model="$1"
  local file
  file="$(compose_file_for "$model")"

  echo "Starting $model with $file..."
  docker compose -p "$COMPOSE_PROJECT" -f "$ROOT_DIR/$file" up -d
  echo "Container: ${CONTAINERS[$model]}"
  echo "Endpoint:  http://127.0.0.1:8000/v1"
  echo "Logs:      ./docker/run_docker.sh $model logs"
}

case "$ACTION" in
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
    docker logs -f --tail 80 "${CONTAINERS[$MODEL]}"
    ;;
  ps)
    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    echo "Unknown action: $ACTION" >&2
    echo >&2
    usage >&2
    exit 2
    ;;
esac
