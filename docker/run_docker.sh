#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_PROJECT="vllm"
DEFAULT_MODEL="gemma4-31b-spark"
MODEL="${1:-$DEFAULT_MODEL}"
ACTION="${2:-restart}"

usage() {
  cat <<EOF
Usage:
  ./docker/run_docker.sh [model] [action]

Models:
  qwen35-9b
  qwen35-9b-quanttrio
  qwen35-9b-quanttrio-spark
  qwen3-8b
  qwen3-14b-spark
  lfm25-8b-a1b
  gemma4-12b-llamacpp
  gemma4-12b-qat-llamacpp
  gemma4-12b-q8-llamacpp
  qwopus35-9b-moq-llamacpp
  gemma4-12b-litertlm
  gemma4-31b-spark         default
  gemma4-26b-a4b-spark
  gemma4-8b
  gemma4-8b-spark
  qwopus35-4b-coder
  mellum2-12b-a25b-thinking
  mellum2-12b-a25b-thinking-spark
  mellum2-12b-a25b-thinking-awq-spark
  qwen3.6-27b-spark

Actions:
  restart       stop all known model containers, then start selected model
  start         start selected model without stopping others
  stop          stop all known model containers
  logs          follow logs for selected model
  ps            show containers

Examples:
  ./docker/run_docker.sh
  ./docker/run_docker.sh gemma4-8b
  ./docker/run_docker.sh qwen3-14b-spark logs
  ./docker/run_docker.sh qwen3-8b stop
EOF
}

if [[ "$MODEL" == "-h" || "$MODEL" == "--help" || "$MODEL" == "help" ]]; then
  usage
  exit 0
fi

compose_file_for() {
  local model="$1"

  case "$model" in
    qwen35-9b) printf '%s\n' "docker-compose-qwen35-9b.yml" ;;
    qwen35-9b-quanttrio) printf '%s\n' "docker-compose-qwen35-9b-quanttrio.yml" ;;
    qwen35-9b-quanttrio-spark) printf '%s\n' "docker-compose-qwen35-9b-quanttrio-spark.yml" ;;
    qwen3-8b) printf '%s\n' "docker-compose-qwen3-8b.yml" ;;
    qwen3-14b-spark) printf '%s\n' "docker-compose-qwen3-14b-spark.yml" ;;
    lfm25-8b-a1b) printf '%s\n' "docker-compose-lfm25-8b-a1b.yml" ;;
    gemma4-12b-llamacpp) printf '%s\n' "docker-compose-gemma4-12b-llamacpp.yml" ;;
    gemma4-12b-qat-llamacpp) printf '%s\n' "docker-compose-gemma4-12b-qat-llamacpp.yml" ;;
    gemma4-12b-q8-llamacpp) printf '%s\n' "docker-compose-gemma4-12b-q8-llamacpp.yml" ;;
    qwopus35-9b-moq-llamacpp) printf '%s\n' "docker-compose-qwopus35-9b-moq-llamacpp.yml" ;;
    gemma4-12b-litertlm) printf '%s\n' "docker-compose-gemma4-12b-litertlm.yml" ;;
    gemma4-31b-spark) printf '%s\n' "docker-compose-gemma4-31b-spark.yml" ;;
    gemma4-26b-a4b-spark) printf '%s\n' "docker-compose-gemma4-26b-a4b-spark.yml" ;;
    gemma4-8b) printf '%s\n' "docker-compose-gemma4-8b.yml" ;;
    gemma4-8b-spark) printf '%s\n' "docker-compose-gemma4-8b-spark.yml" ;;
    qwopus35-4b-coder) printf '%s\n' "docker-compose-qwopus35-4b-coder.yml" ;;
    mellum2-12b-a25b-thinking) printf '%s\n' "docker-compose-mellum2-12b-a25b-thinking.yml" ;;
    mellum2-12b-a25b-thinking-spark) printf '%s\n' "docker-compose-mellum2-12b-a25b-thinking-spark.yml" ;;
    mellum2-12b-a25b-thinking-awq-spark) printf '%s\n' "docker-compose-mellum2-12b-a25b-thinking-awq-spark.yml" ;;
    qwen3.6-27b-spark) printf '%s\n' "docker-compose-qwen36-27b-spark.yml" ;;
    *)
      echo "Unknown model: $model" >&2
      echo >&2
      usage >&2
      exit 2
      ;;
  esac
}

container_for() {
  local model="$1"

  case "$model" in
    qwen35-9b) printf '%s\n' "qwen35_9b_vllm" ;;
    qwen35-9b-quanttrio) printf '%s\n' "qwen35_9b_quanttrio_vllm" ;;
    qwen35-9b-quanttrio-spark) printf '%s\n' "qwen35_9b_quanttrio_spark_vllm" ;;
    qwen3-8b) printf '%s\n' "qwen3_8b_awq_vllm" ;;
    qwen3-14b-spark) printf '%s\n' "qwen3_14b_awq_vllm" ;;
    lfm25-8b-a1b) printf '%s\n' "lfm25_8b_a1b_vllm" ;;
    gemma4-12b-llamacpp) printf '%s\n' "gemma4_12b_llamacpp" ;;
    gemma4-12b-qat-llamacpp) printf '%s\n' "gemma4_12b_qat_llamacpp" ;;
    gemma4-12b-q8-llamacpp) printf '%s\n' "gemma4_12b_q8_llamacpp" ;;
    qwopus35-9b-moq-llamacpp) printf '%s\n' "qwopus35_9b_moq_llamacpp" ;;
    gemma4-12b-litertlm) printf '%s\n' "gemma4_12b_litertlm" ;;
    gemma4-31b-spark) printf '%s\n' "gemma4_31b_spark_vllm" ;;
    gemma4-26b-a4b-spark) printf '%s\n' "gemma4_26b_a4b_spark_vllm" ;;
    gemma4-8b) printf '%s\n' "gemma4_8b_vllm" ;;
    gemma4-8b-spark) printf '%s\n' "gemma4_8b_spark_vllm" ;;
    qwopus35-4b-coder) printf '%s\n' "qwopus35_4b_coder_vllm" ;;
    mellum2-12b-a25b-thinking) printf '%s\n' "mellum2_12b_a25b_thinking_vllm" ;;
    mellum2-12b-a25b-thinking-spark) printf '%s\n' "mellum2_12b_a25b_thinking_spark_vllm" ;;
    mellum2-12b-a25b-thinking-awq-spark) printf '%s\n' "mellum2_12b_a25b_thinking_awq_spark_vllm" ;;
    qwen3.6-27b-spark) printf '%s\n' "qwen36_27b_vllm" ;;
    *)
      echo "Unknown model: $model" >&2
      echo >&2
      usage >&2
      exit 2
      ;;
  esac
}

stop_all() {
  echo "Stopping known vLLM compose stacks..."
  for file in \
    docker-compose-qwen35-9b.yml \
    docker-compose-qwen35-9b-quanttrio.yml \
    docker-compose-qwen35-9b-quanttrio-spark.yml \
    docker-compose-qwen3-8b.yml \
    docker-compose-qwen3-14b-spark.yml \
    docker-compose-lfm25-8b-a1b.yml \
    docker-compose-gemma4-12b-llamacpp.yml \
    docker-compose-gemma4-12b-qat-llamacpp.yml \
    docker-compose-gemma4-12b-q8-llamacpp.yml \
    docker-compose-qwopus35-9b-moq-llamacpp.yml \
    docker-compose-gemma4-12b-litertlm.yml \
    docker-compose-gemma4-31b-spark.yml \
    docker-compose-gemma4-26b-a4b-spark.yml \
    docker-compose-gemma4-8b.yml \
    docker-compose-gemma4-8b-spark.yml \
    docker-compose-qwopus35-4b-coder.yml \
    docker-compose-mellum2-12b-a25b-thinking.yml \
    docker-compose-mellum2-12b-a25b-thinking-spark.yml \
    docker-compose-mellum2-12b-a25b-thinking-awq-spark.yml \
    docker-compose-qwen36-27b-spark.yml
  do
    if [[ -f "$ROOT_DIR/$file" ]]; then
      docker compose -p "$COMPOSE_PROJECT" -f "$ROOT_DIR/$file" down --remove-orphans
    fi
  done
}

start_model() {
  local model="$1"
  local file
  file="$(compose_file_for "$model")"

  echo "Starting $model with $file..."
  docker compose -p "$COMPOSE_PROJECT" -f "$ROOT_DIR/$file" up -d
  echo "Container: $(container_for "$model")"
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
    docker logs -f --tail 80 "$(container_for "$MODEL")"
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
