# Models Info

Inventari dels models configurats a `docker/docker-compose-*.yml`.

| Nom curt | Model servit | Mida nominal | Mida en disc | Perfil de carrega | Tipus | Concurrencia configurada |
|---|---|---:|---:|---|---|---:|
| `gemma4-31b-spark` | `google/gemma-4-31B-it` | 31B | 116.56 GB | Spark BF16, `gemma4-cu130` | BF16, no quantitzat | 2 seq / 2048 tokens |
| `gemma4-26b-a4b-spark` | `google/gemma-4-26B-A4B-it` | 26B total, A4B actius | 96.20 GB | Spark BF16, `gemma4-cu130` | BF16, MoE/A4B | 4 seq / 4096 tokens |
| `gemma4-8b-spark` | `google/gemma-4-E4B-it` | E4B | 29.85 GB | Spark BF16, `gemma4-cu130` | BF16 | 8 seq / 4096 tokens |
| `gemma4-8b` | `google/gemma-4-E4B-it` | E4B | 29.85 GB | Local BitsAndBytes, `vllm-openai:latest` | BnB quantitzat en carrega | 2 seq / 2048 tokens |
| `gemma4-12b-llamacpp` | `unsloth/gemma-4-12b-it-GGUF:Q4_K_M` | 12B | 7.1 GB GGUF | Local llama.cpp CUDA, multimodal | GGUF Q4_K_M | 1 server / 32768 ctx |
| `gemma4-12b-q8-llamacpp` | `unsloth/gemma-4-12b-it-GGUF:Q8_0` | 12B | 12.7 GB GGUF | Local llama.cpp CUDA, prova Q8 | GGUF Q8_0 | 1 server / 32768 ctx |
| `gemma4-12b-litertlm` | `litert-community/gemma-4-12B-it-litert-lm` | 12B | 6.1 GB importat | Local LiteRT-LM, experimental | `.litertlm` | 1 server / OpenAI-compatible parcial |
| `qwopus35-9b-moq-llamacpp` | `w-ahmad/Qwopus3.5-9B-Coder-MTP-GGUF-MoQ`, `MoQ-Quants/MoQ-4.2.gguf` | 9B | 4.89 GB GGUF | Local llama.cpp CUDA, prova MoQ | GGUF MoQ 4.2 BPW | 1 server / 32768 ctx |
| `qwopus35-4b-coder` | `Jackrong/Qwopus3.5-4B-Coder` | 4B | n/d | Local/Spark BF16, `cu130-nightly` | BF16, no quantitzat | 8 seq / 4096 tokens |
| `mellum2-12b-a25b-thinking` | `JetBrains/Mellum2-12B-A2.5B-Thinking` | 12B total, A2.5B actius | 22.63 GiB | Local/Spark BF16 CPU offload, `cu130-nightly` | BF16, MoE/A2.5B | 2 seq / 2048 tokens |
| `mellum2-12b-a25b-thinking-spark` | `JetBrains/Mellum2-12B-A2.5B-Thinking` | 12B total, A2.5B actius | 22.63 GiB | Spark BF16, `cu130-nightly` | BF16, MoE/A2.5B | 4 seq / 4096 tokens |
| `mellum2-12b-a25b-thinking-awq-spark` | local `../quantized/Mellum2-12B-A2.5B-Thinking-AWQ-W4A16` | 12B total, A2.5B actius | 22 GiB | Spark prova AWQ parcial | W4 atencio, experts BF16 | 4 seq / 4096 tokens |
| `qwen3-8b` | `Qwen/Qwen3-8B-AWQ` | 8B | 5.69 GB | Local AWQ | AWQ | 2 seq / 2048 tokens |
| `qwen3-14b-spark` | `Qwen/Qwen3-14B-AWQ` | 14B | 9.31 GB | Spark AWQ | AWQ | 2 seq / 2048 tokens |
| `lfm25-8b-a1b` | `LiquidAI/LFM2.5-8B-A1B` | 8.3B total, A1.5B actius | n/d | Local BitsAndBytes, `vllm-openai:latest` | BnB quantitzat en carrega, MoE/A1.5B | 2 seq / 2048 tokens |
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
- `gemma4-12b-llamacpp` usa el GGUF Q4_K_M d'Unsloth amb `llama.cpp` CUDA i `--alias active-model`, de manera que encaixa amb la configuracio OpenCode existent. En prova real a la RTX 4060 Ti 16 GB ha carregat amb context 32768, uns 9.6 GB de VRAM, resposta de text neta i `tool_calls` OpenAI-compatible. El servei actual publica `capabilities:["completion","multimodal"]` i accepta imatges via `image_url` data URL; `dog.png` i `calculator.png` s'han descrit correctament. Els probes d'imatge massa petits poden fallar amb `failed to decode image bytes`, per aixo `image_vision` usa un PNG 32x32 com a prova de capacitat.
- `gemma4-12b-q8-llamacpp` conserva el mateix alias OpenAI-compatible `active-model` i el mateix context 32768 que la configuracio Q4, pero carrega `Q8_0`. En RTX 4060 Ti 16 GB pot anar just de VRAM; si falla, baixar context a 16384 o 8192.
- `qwopus35-9b-moq-llamacpp` prova el GGUF MoQ 4.2 de Qwopus3.5 9B Coder amb `llama.cpp`, alias `active-model` i context 32768. Es una ruta mes natural que vLLM per a aquest repo GGUF; cal validar tool calling amb OpenCode abans de considerar-lo estable.
- `gemma4-12b-litertlm` prova la ruta recomanada per Google per executar Gemma 4 12B en equips locals de 16 GB amb LiteRT-LM. En la RTX 4060 Ti 16 GB remota, `litert-lm run --backend gpu --max-num-tokens 128` genera text coherent, pero `litert-lm serve` no exposa aquest limit i l'endpoint OpenAI-compatible retorna `<pad>`; no es recomanat per OpenCode fins que LiteRT-LM permeti limitar el KV cache al servidor o es faci un wrapper estable.
- `lfm25-8b-a1b` serveix `LiquidAI/LFM2.5-8B-A1B` com `active-model` per reutilitzar la configuracio OpenCode local (`vram16-vllm`, port local 8002 cap al 8000 remot).

## Observacions de concurrencia

- `gemma4-31b-spark`: configurat conservadorament amb `--max-num-seqs 2` per prioritzar que carregui en Spark.
- `gemma4-26b-a4b-spark`: en proves reals amb OpenCode, 4 usuaris van ser comodes, 8 va ser el limit practic i 12+ va introduir massa cua.
- Models petits o AWQ tenen mes marge, especialment els Spark amb `--max-num-seqs 8`.

## Notes de configuracio

- Els Gemma 4 usen `--reasoning-parser gemma4`, `--tool-call-parser gemma4` i `examples/tool_chat_template_gemma4.jinja`.
- `lfm25-8b-a1b` usa `--reasoning-parser deepseek_r1` per separar blocs `<think>...</think>` i `--tool-call-parser lfm2` per interpretar les crides d'eina natives de LFM2/LFM2.5 entre `<|tool_call_start|>` i `<|tool_call_end|>`. Requereix una imatge vLLM recent; `vllm/vllm-openai:latest` actualitzada el 2026-05-29 ho exposa com a vLLM 0.22.0.
- Els Qwen usen parsers `qwen3`, `qwen3_coder` o `hermes` segons el compose.
- `qwopus35-4b-coder` usa el checkpoint BF16 de `Jackrong/Qwopus3.5-4B-Coder`, un fine-tune Qwen3.5-family orientat a coding i tool-use. La configuracio prova tool calling amb `--tool-call-parser qwen3_coder`.
- `mellum2-12b-a25b-thinking` usa el checkpoint BF16 MoE de JetBrains amb `--cpu-offload-gb 10` per intentar cabre en GPU de 16 GB. La fitxa oficial dona context de 131072 tokens, pero aquest compose el limita a 32768 per memoria. Usa `--reasoning-parser qwen3` i tool calling `hermes`.
- `mellum2-12b-a25b-thinking-spark` usa el checkpoint BF16 MoE de JetBrains amb context de 65536 tokens per provar-lo en NVIDIA Spark / GB10 abans de decidir si val la pena quantitzar-lo en AWQ. La prova amb `--quantization fp8` dinamic carregava, pero degradava la sortida.
- `mellum2-12b-a25b-thinking-awq-spark` documenta la prova AWQ W4A16 feta amb `llmcompressor`: les capes d'atencio queden empaquetades en W4, pero `MellumExperts` es desa en BF16. La mida final es 22 GiB i vLLM rebutja el config asimetric per MoE, de manera que no es candidat per moure a una RTX 4060 Ti amb context 64k.
- Els models Spark grans fan servir `--kv-cache-dtype fp8` per reduir memoria de KV cache.
