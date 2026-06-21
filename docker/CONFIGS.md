# CONFIGS

Aquest document resumeix els perfils `compose-*.yml` que estan documentats a `RANKING.md`.

La columna `VRAM req.` surt del perfil del nom del compose i representa el marge/requisit operatiu esperat, no necessàriament la memòria exacta que sempre consumirà el procés. La puntuació de programació és orientativa de l'1 al 10, basada en el ranking actual, la mida del model i el comportament observat.

| Compose | Model | Engine | VRAM req. | Context | Concurrència | Batched tokens | GPU util. | Imatge | Programació | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `compose-qwen36-35b-a3b-cuda-vram128-vllm-nvidia-nvfp4.yml` | Qwen3.6 35B A3B NVIDIA NVFP4 | vLLM | 128 GB | 32k | 8 | 8192 | 0.85 | No | 10 | Millor perfil de programació segons ranking. MTP/speculative. |
| `compose-qwen36-35b-a3b-cuda-vram96-vllm-nvidia-nvfp4.yml` | Qwen3.6 35B A3B NVIDIA NVFP4 | vLLM | 96 GB | 32k | 8 | 8192 | 0.85 | No | 10 | Mateix checkpoint NVFP4 amb perfil de VRAM més ajustat. |
| `compose-qwen36-35b-a3b-cuda-vram128-vllm-qwen-fp8.yml` | Qwen3.6 35B A3B Qwen FP8 | vLLM | 128 GB | 32k | 8 | 8192 | 0.85 | No | 9 | FP8 oficial Qwen; bona alternativa al NVFP4. |
| `compose-gemma4-26b-a4b-it-cuda-vram128-vllm-google-bf16.yml` | Gemma 4 26B A4B BF16 | vLLM | 128 GB | 32k | 4 | 4096 | 0.90 | No | 6 | MoE, text-only, amb risc observat de bucles. |
| `compose-gemma4-31b-it-cuda-vram128-vllm-google-qat-w4a16-64k-image.yml` | Gemma 4 31B QAT W4A16 | vLLM | 128 GB | 64k | 2 | 4096 | 0.90 | Si | 7 | Dense, image, MTP, thinking, temperatura 0. |
| `compose-gemma4-26b-a4b-it-cuda-vram128-vllm-google-bf16-64k-image.yml` | Gemma 4 26B A4B BF16 | vLLM | 128 GB | 64k | 2 | 4096 | 0.90 | Si | 6 | MoE amb image i context llarg; pendent de health estable a Spark segons ranking. |
| `compose-ministral3-8b-instruct-cuda-vram32-vllm-mistral-fp8.yml` | Ministral 3 8B Instruct FP8 | vLLM | 32 GB | 32k | 4 | 8192 | 0.85 | No | 7 | Actiu a Spark; text-only per incompatibilitat actual del mode image. |
| `compose-ministral3-14b-instruct-cuda-vram32-vllm-mistral-fp8.yml` | Ministral 3 14B Instruct FP8 | vLLM | 32 GB | 32k | 4 | 8192 | 0.85 | No | 8 | Més capacitat que 8B; text-only en aquest stack. |
| `compose-ministral3-3b-instruct-cuda-vram16-vllm-mistral-fp8.yml` | Ministral 3 3B Instruct FP8 | vLLM | 16 GB | 32k | 4 | 8192 | 0.85 | No | 5 | Perfil petit generalista, text-only. |
| `compose-ministral3-3b-instruct-cuda-vram16-vllm-mistral-fp8-128k.yml` | Ministral 3 3B Instruct FP8 | vLLM | 16 GB | 128k | 8 | 16384 | 0.85 | No | 5 | Variant de context llarg; més memòria KV i latència. |
| `compose-qwen36-35b-a3b-base-cuda-vram16-llamacpp-localweights-iq4-mtp.yml` | Qwen3.6 35B A3B GGUF IQ4_XS | llama.cpp | 16 GB | 64k | 1 | n/d | n/d | No | 10 | Mateixa capacitat alta de programació i més context; menys concurrència i throughput per `-np 1` i offload parcial (`-ngl 24`). |
| `compose-gemma4-12b-it-cuda-vram16-vllm-google-qat-w4a16.yml` | Gemma 4 12B QAT W4A16 | vLLM | 16 GB | 32k | 1 | 4096 | 0.90 | No | 5 | Text-only; image desactivada amb `image: 0`. |
| `compose-gemma4-e4b-it-cuda-vram16-vllm-google-qat-w4a16-mtp.yml` | Gemma 4 E4B QAT W4A16 | vLLM | 16 GB | 32k | 1 | 4096 | 0.92 | No | 4 | Petit i ràpid; menys capacitat de programació. |
| `compose-gemma4-12b-it-cuda-vram16-vllm-google-qat-w4a16-64k-image.yml` | Gemma 4 12B QAT W4A16 | vLLM | 16 GB | 64k | 1 | 4096 | 0.90 | Si | 5 | Variant image amb context llarg i KV cache FP8. |
| `compose-gemma4-e4b-it-cuda-vram16-vllm-google-qat-w4a16-mtp-64k-image.yml` | Gemma 4 E4B QAT W4A16 | vLLM | 16 GB | 64k | 1 | 4096 | 0.92 | Si | 4 | Variant image petita amb MTP. |
| `compose-qwen3-vl-2b-instruct-cuda-vram8-vllm-qwen-fp8-64k-image.yml` | Qwen3-VL 2B Instruct FP8 | vLLM | 8 GB | 64k | 1 | 8192 | 0.18 | Si | 3 | Model orientat a imatge; image-only segons ranking. |

## Lectura ràpida

- `Concurrència` és `--max-num-seqs` en vLLM i `-np` en llama.cpp. No equival sempre a usuaris fluids si tots fan prompts llargs alhora.
- `Batched tokens` és `--max-num-batched-tokens` en vLLM. En llama.cpp queda com `n/d`.
- `Imatge = Si` només quan el perfil permet imatge realment (`image > 0` o perfil `-image`). Els perfils Gemma text-only poden tenir `image: 0`, que compta com a imatge desactivada.
- Els Ministral 3 són models oficialment multimodals, però els perfils actuals són text-only perquè el mode image ha fallat amb la imatge Docker vLLM actual.
- Les puntuacions no són benchmarks; són una guia pràctica per triar perfil de programació dins aquest repositori.
