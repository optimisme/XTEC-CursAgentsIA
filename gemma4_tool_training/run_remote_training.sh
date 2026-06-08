#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

docker compose -f docker-compose.train.yml build
docker compose -f docker-compose.train.yml run --rm gemma4-12b-lora-train
