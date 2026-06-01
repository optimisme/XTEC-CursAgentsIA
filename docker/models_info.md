# Models Info

Inventari dels models configurats a `docker/docker-compose-*.yml`.

| Nom curt | Model servit | Mida nominal | Mida en disc | Perfil de carrega | Tipus | Concurrencia configurada |
|---|---|---:|---:|---|---|---:|
| `gemma4-31b-spark` | `google/gemma-4-31B-it` | 31B | 116.56 GB | Spark BF16, `gemma4-cu130` | BF16, no quantitzat | 2 seq / 2048 tokens |
| `gemma4-26b-a4b-spark` | `google/gemma-4-26B-A4B-it` | 26B total, A4B actius | 96.20 GB | Spark BF16, `gemma4-cu130` | BF16, MoE/A4B | 4 seq / 4096 tokens |
| `gemma4-8b-spark` | `google/gemma-4-E4B-it` | E4B | 29.85 GB | Spark BF16, `gemma4-cu130` | BF16 | 8 seq / 4096 tokens |
| `gemma4-8b` | `google/gemma-4-E4B-it` | E4B | 29.85 GB | Local BitsAndBytes, `vllm-openai:latest` | BnB quantitzat en carrega | 2 seq / 2048 tokens |
| `qwopus35-4b-coder` | `Jackrong/Qwopus3.5-4B-Coder` | 4B | n/d | Local/Spark BF16, `cu130-nightly` | BF16, no quantitzat | 8 seq / 4096 tokens |
| `qwen3-8b` | `Qwen/Qwen3-8B-AWQ` | 8B | 5.69 GB | Local AWQ | AWQ | 2 seq / 2048 tokens |
| `qwen3-14b-spark` | `Qwen/Qwen3-14B-AWQ` | 14B | 9.31 GB | Spark AWQ | AWQ | 2 seq / 2048 tokens |
| `qwen35-9b` | `QuantTrio/Qwen3.5-9B-AWQ` | 9B | 11.55 GB | Local AWQ | AWQ | 2 seq / 2048 tokens |
| `qwen35-9b-quanttrio` | `QuantTrio/Qwen3.5-9B-AWQ` | 9B | 11.55 GB | Local AWQ | AWQ | 2 seq / 2048 tokens |
| `qwen35-9b-quanttrio-spark` | `QuantTrio/Qwen3.5-9B-AWQ` | 9B | 11.55 GB | Spark AWQ | AWQ | 8 seq / 4096 tokens |
| `qwen3.6-27b-spark` | `Qwen/Qwen3.6-27B` | 27B | 51.77 GB | Spark BF16 | BF16, no quantitzat | 8 seq / 8192 tokens |

## Defaults i exposicio

- Tots els compose serveixen el model amb `--served-model-name active-model`.
- El port del contenidor es publica com `8000:8000`.
- A Spark, el servei remot queda a `http://127.0.0.1:8000/v1` dins la maquina, i normalment es consumeix localment via tunel a `http://127.0.0.1:8001/v1`.
- El default actual de `run_docker.sh` es `gemma4-31b-spark`.
- Les mides Gemma provenen de la cache Hugging Face del contenidor Spark actiu; les mides Qwen provenen de la suma de fitxers publicada per l'API de Hugging Face.
- Atencio: `qwen3.6-27b-spark` te `--max-model-len 32iz768` al compose, que sembla un typo i probablement hauria de ser `32768`.
- `gemma4-8b` i `gemma4-8b-spark` carreguen el mateix model (`google/gemma-4-E4B-it`), pero el local usa BitsAndBytes i menys concurrencia per cabre en 16 GB VRAM.

## Observacions de concurrencia

- `gemma4-31b-spark`: configurat conservadorament amb `--max-num-seqs 2` per prioritzar que carregui en Spark.
- `gemma4-26b-a4b-spark`: en proves reals amb OpenCode, 4 usuaris van ser comodes, 8 va ser el limit practic i 12+ va introduir massa cua.
- Models petits o AWQ tenen mes marge, especialment els Spark amb `--max-num-seqs 8`.

## Notes de configuracio

- Els Gemma 4 usen `--reasoning-parser gemma4`, `--tool-call-parser gemma4` i `examples/tool_chat_template_gemma4.jinja`.
- Els Qwen usen parsers `qwen3`, `qwen3_coder` o `hermes` segons el compose.
- `qwopus35-4b-coder` usa el checkpoint BF16 de `Jackrong/Qwopus3.5-4B-Coder`, un fine-tune Qwen3.5-family orientat a coding i tool-use. La configuracio prova tool calling amb `--tool-call-parser qwen3_coder`.
- Els models Spark grans fan servir `--kv-cache-dtype fp8` per reduir memoria de KV cache.
