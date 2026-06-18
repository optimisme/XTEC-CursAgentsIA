#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

log_dir="traces/central/nightly-supervisor-20260617"
mkdir -p "$log_dir"

manifest_count() {
  local dir="$1"
  find "$dir" -maxdepth 1 -name 'manifest_*.jsonl' -type f -exec cat {} + 2>/dev/null | wc -l | tr -d ' '
}

resume_file() {
  local dir="$1"
  local label="$2"
  local resume="$log_dir/resume_${label}.jsonl"
  find "$dir" -maxdepth 1 -name 'manifest_*.jsonl' -type f -exec cat {} + > "$resume" 2>/dev/null || true
  printf '%s\n' "$resume"
}

active_collector() {
  local label="$1"
  pgrep -f "collect_generic_traces\\.js.*${label}" >/dev/null 2>&1
}

run_chunk() {
  local label="$1"
  local tasks="$2"
  local outdir="$3"
  local target="$4"
  local endpoint="$5"
  local model="$6"
  local parallel="$7"
  local extra="${8:-}"

  mkdir -p "$outdir"
  while [ "$(manifest_count "$outdir")" -lt "$target" ]; do
    if active_collector "$label"; then
      sleep 60
      continue
    fi
    local resume
    resume="$(resume_file "$outdir" "$label")"
    echo "$(date -u +%FT%TZ) starting/resuming $label ($(manifest_count "$outdir")/$target)" | tee -a "$log_dir/supervisor.log"
    # shellcheck disable=SC2086
    node collect_generic_traces.js \
      --tasks "$tasks" \
      --output-dir "$outdir" \
      --source-label "$label" \
      --endpoint "$endpoint" \
      --model "$model" \
      --reasoning true \
      --output-tokens 4096 \
      --timeout-ms 720000 \
      --parallel "$parallel" \
      --resume-manifest "$resume" \
      $extra >> "$log_dir/${label}.stdout.log" 2>> "$log_dir/${label}.stderr.log" || true
    sleep 10
  done
  echo "$(date -u +%FT%TZ) complete $label" | tee -a "$log_dir/supervisor.log"
}

lane_spark_p4() {
  run_chunk \
    "spark-e4b-mtp-tool-discipline-p01-p16-chunk001-240" \
    "tasks/tool_discipline_tasks.expanded-p01-p16.chunk001-240.jsonl" \
    "traces/central/spark-e4b-mtp-tool-discipline-p01-p16-chunk001-240-20260617" \
    240 "http://127.0.0.1:8001/v1" "spark-vllm/active-model" 4 "--allow-task --allow-web"
}

lane_spark_p2() {
  run_chunk \
    "spark-e4b-mtp-tool-discipline-p01-p16-chunk241-480" \
    "tasks/tool_discipline_tasks.expanded-p01-p16.chunk241-480.jsonl" \
    "traces/central/spark-e4b-mtp-tool-discipline-p01-p16-chunk241-480-20260617" \
    240 "http://127.0.0.1:8001/v1" "spark-vllm/active-model" 2 "--allow-task --allow-web"
}

lane_vram16_a() {
  run_chunk \
    "vram16-e4b-mtp-tool-discipline-p01-p16-chunk481-720" \
    "tasks/tool_discipline_tasks.expanded-p01-p16.chunk481-720.jsonl" \
    "traces/central/vram16-e4b-mtp-tool-discipline-p01-p16-chunk481-720-20260617" \
    240 "http://127.0.0.1:8002/v1" "vram16-local/active-model" 1 "--allow-task --allow-web"
}

lane_vram16_b() {
  run_chunk \
    "vram16-e4b-mtp-tool-discipline-p01-p16-chunk721-end" \
    "tasks/tool_discipline_tasks.expanded-p01-p16.chunk721-end.jsonl" \
    "traces/central/vram16-e4b-mtp-tool-discipline-p01-p16-chunk721-end-20260617" \
    48 "http://127.0.0.1:8002/v1" "vram16-local/active-model" 1 "--allow-task --allow-web"
}

lane_spark_p4 &
lane_spark_p2 &
lane_vram16_a &
lane_vram16_b &
wait
