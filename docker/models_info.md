# Models Info

Inventari dels models configurats a `docker/docker-compose-*.yml`.

| Nom curt | Model servit | Mida nominal | Mida en disc | Perfil de carrega | Tipus | Concurrencia configurada |
|---|---|---:|---:|---|---|---:|
| `gemma4-31b-qat-w4a16-spark` | `google/gemma-4-31B-it-qat-w4a16-ct` | 31B | 21.67 GiB | Spark QAT, `cu129-nightly` | W4A16 compressed-tensors, KV fp8 | 2 seq / 4096 tokens |
| `gemma4-26b-a4b-spark` | `google/gemma-4-26B-A4B-it` | 26B total, A4B actius | 96.20 GB | Spark BF16, `gemma4-cu130` | BF16, MoE/A4B | 4 seq / 4096 tokens |
| `gemma4-8b-spark` | `google/gemma-4-E4B-it` | E4B | 29.85 GB | Spark BF16, `gemma4-cu130` | BF16 | 8 seq / 4096 tokens |
| `gemma4-8b` | `google/gemma-4-E4B-it` | E4B | 29.85 GB | Local BitsAndBytes, `vllm-openai:latest` | BnB quantitzat en carrega | 2 seq / 2048 tokens |
| `gemma4-12b-litertlm` | `litert-community/gemma-4-12B-it-litert-lm` | 12B | 6.1 GB importat | Local LiteRT-LM, experimental | `.litertlm` | 1 server / OpenAI-compatible parcial |
| `qwen3-8b` | `Qwen/Qwen3-8B-AWQ` | 8B | 5.69 GB | Local AWQ | AWQ | 2 seq / 2048 tokens |
| `qwen3-14b-spark` | `Qwen/Qwen3-14B-AWQ` | 14B | 9.31 GB | Spark AWQ | AWQ | 2 seq / 2048 tokens |
| `qwen35-9b` | `QuantTrio/Qwen3.5-9B-AWQ` | 9B | 11.55 GB | Local AWQ | AWQ | 2 seq / 2048 tokens |
| `qwen35-9b-quanttrio` | `QuantTrio/Qwen3.5-9B-AWQ` | 9B | 11.55 GB | Local AWQ | AWQ | 2 seq / 2048 tokens |
| `qwen35-9b-quanttrio-spark` | `QuantTrio/Qwen3.5-9B-AWQ` | 9B | 11.55 GB | Spark AWQ | AWQ | 8 seq / 4096 tokens |
| `qwen3.6-27b-spark` | `Qwen/Qwen3.6-27B` | 27B | 51.77 GB | Spark BF16 | BF16, no quantitzat | 8 seq / 8192 tokens |
| `qwen3.6-35b-a3b-mtp-iq4-spark-llamacpp` | `localweights/Qwen3.6-35B-A3B-MTP-IQ4_XS-GGUF:IQ4_XS` | 35B total, A3B actius | 18.06 GiB GGUF | Spark llama.cpp | IQ4_XS GGUF, MTP | 1 seq / 32768 tokens |
| `qwen3.6-35b-a3b-mtp-iq4-llamacpp` | `localweights/Qwen3.6-35B-A3B-MTP-IQ4_XS-GGUF:IQ4_XS` | 35B total, A3B actius | 18.06 GiB GGUF | 16GB llama.cpp parcial | IQ4_XS GGUF, MTP | 1 seq / 16384 tokens, partial GPU offload |

## Defaults i exposicio

- Tots els compose serveixen el model amb `--served-model-name active-model`.
- El port del contenidor es publica com `8000:8000`.
- A Spark, el servei remot queda a `http://127.0.0.1:8000/v1` dins la maquina, i normalment es consumeix localment via tunel a `http://127.0.0.1:8001/v1`.
- El default actual de `run_docker.sh` es `gemma4-31b-qat-w4a16-spark`.
- Les mides Gemma provenen de la cache Hugging Face del contenidor Spark actiu; les mides Qwen provenen de la suma de fitxers publicada per l'API de Hugging Face.
- Atencio: `qwen3.6-27b-spark` te `--max-model-len 32iz768` al compose, que sembla un typo i probablement hauria de ser `32768`.
- `gemma4-8b` i `gemma4-8b-spark` carreguen el mateix model (`google/gemma-4-E4B-it`), pero el local usa BitsAndBytes i menys concurrencia per cabre en 16 GB VRAM.
- `gemma4-12b-litertlm` prova la ruta recomanada per Google per executar Gemma 4 12B en equips locals de 16 GB amb LiteRT-LM. En la RTX 4060 Ti 16 GB remota, `litert-lm run --backend gpu --max-num-tokens 128` genera text coherent, pero `litert-lm serve` no exposa aquest limit i l'endpoint OpenAI-compatible retorna `<pad>`; no es recomanat per OpenCode fins que LiteRT-LM permeti limitar el KV cache al servidor o es faci un wrapper estable.

## Observacions de concurrencia

- `gemma4-31b-qat-w4a16-spark`: en prova real a NVIDIA Spark / GB10 carrega a 32768 tokens amb 883477 tokens de KV cache i una concurrencia estimada de 26.96 peticions de 32768 tokens.
- `gemma4-26b-a4b-spark`: en proves reals amb OpenCode, 4 usuaris van ser comodes, 8 va ser el limit practic i 12+ va introduir massa cua.
- Models petits o AWQ tenen mes marge, especialment els Spark amb `--max-num-seqs 8`.

## Notes de configuracio

- Els Gemma 4 usen `--reasoning-parser gemma4`, `--tool-call-parser gemma4` i `examples/tool_chat_template_gemma4.jinja`.
- Els Qwen usen parsers `qwen3`, `qwen3_coder` o `hermes` segons el compose.
- Els models Spark grans fan servir `--kv-cache-dtype fp8` per reduir memoria de KV cache.
