#!/usr/bin/env bash
set -euo pipefail

REMOTE="${REMOTE:-super@localhost}"
PORT="${PORT:-2225}"
REMOTE_DIR="${REMOTE_DIR:-Documents/vLLM/gemma4_tool_training}"
RUN_NAME="${RUN_NAME:-gemma4-tool-discipline-lora-v0}"
DATASET="${DATASET:-data/global_tool_sft_tool_discipline_v0.train.jsonl}"
OUTPUT_DIR="${OUTPUT_DIR:-outputs/gemma4-tool-discipline-lora-v0}"
EPOCHS="${EPOCHS:-1}"
BATCH_SIZE="${BATCH_SIZE:-1}"
GRAD_ACCUM="${GRAD_ACCUM:-16}"
MAX_SEQ_LENGTH="${MAX_SEQ_LENGTH:-2048}"
LEARNING_RATE="${LEARNING_RATE:-2e-4}"
MAX_STEPS="${MAX_STEPS:--1}"
BASE_MODEL="${BASE_MODEL:-google/gemma-4-12B-it}"

remote_env=(
  "REMOTE_DIR=$(printf "%q" "$REMOTE_DIR")"
  "RUN_NAME=$(printf "%q" "$RUN_NAME")"
  "DATASET=$(printf "%q" "$DATASET")"
  "OUTPUT_DIR=$(printf "%q" "$OUTPUT_DIR")"
  "EPOCHS=$(printf "%q" "$EPOCHS")"
  "BATCH_SIZE=$(printf "%q" "$BATCH_SIZE")"
  "GRAD_ACCUM=$(printf "%q" "$GRAD_ACCUM")"
  "MAX_SEQ_LENGTH=$(printf "%q" "$MAX_SEQ_LENGTH")"
  "LEARNING_RATE=$(printf "%q" "$LEARNING_RATE")"
  "MAX_STEPS=$(printf "%q" "$MAX_STEPS")"
  "BASE_MODEL=$(printf "%q" "$BASE_MODEL")"
)

ssh -p "$PORT" "$REMOTE" "${remote_env[*]} bash -s" <<'REMOTE_SCRIPT'
set -euo pipefail

cd "$REMOTE_DIR"
mkdir -p logs outputs

docker rm -f "$RUN_NAME" >/dev/null 2>&1 || true

nohup docker run --rm \
  --name "$RUN_NAME" \
  --entrypoint bash \
  --gpus all \
  --env-file /home/super/Documents/vLLM/docker/tokens.env \
  -e "DATASET=$DATASET" \
  -e "OUTPUT_DIR=$OUTPUT_DIR" \
  -e "EPOCHS=$EPOCHS" \
  -e "BATCH_SIZE=$BATCH_SIZE" \
  -e "GRAD_ACCUM=$GRAD_ACCUM" \
  -e "MAX_SEQ_LENGTH=$MAX_SEQ_LENGTH" \
  -e "LEARNING_RATE=$LEARNING_RATE" \
  -e "MAX_STEPS=$MAX_STEPS" \
  -e "BASE_MODEL=$BASE_MODEL" \
  -e HF_HOME=/root/.cache/huggingface \
  -e HUGGINGFACE_HUB_CACHE=/root/.cache/huggingface/hub \
  -e HF_HUB_DISABLE_XET=1 \
  -e PYTORCH_ALLOC_CONF=expandable_segments:True \
  -v /home/super/Documents/vLLM/gemma4_tool_training:/workspace/gemma4_tool_training \
  -v xtec-hf-cache:/root/.cache/huggingface \
  -w /workspace/gemma4_tool_training \
  --ipc=host \
  --shm-size=16g \
  gemma4-12b-lora-train:local \
  -lc 'set -euo pipefail
if [ -n "${HUGGINGFACE:-}" ]; then
  export HF_TOKEN="$HUGGINGFACE"
  export HUGGING_FACE_HUB_TOKEN="$HUGGINGFACE"
fi
python3 preflight.py --dataset "$DATASET" --report "${RUN_NAME}.preflight.json"
python3 train_lora.py \
  --base-model "$BASE_MODEL" \
  --dataset "$DATASET" \
  --output-dir "$OUTPUT_DIR" \
  --max-seq-length "$MAX_SEQ_LENGTH" \
  --epochs "$EPOCHS" \
  --batch-size "$BATCH_SIZE" \
  --grad-accum "$GRAD_ACCUM" \
  --learning-rate "$LEARNING_RATE" \
  --max-steps "$MAX_STEPS"' \
  > "logs/${RUN_NAME}.log" 2>&1 &

echo $! > "logs/${RUN_NAME}.pid"
echo "started ${RUN_NAME} pid=$(cat "logs/${RUN_NAME}.pid") log=${REMOTE_DIR}/logs/${RUN_NAME}.log"
REMOTE_SCRIPT
