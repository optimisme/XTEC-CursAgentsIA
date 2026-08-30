# CONFIGS

Models recomanats per programar segons VRAM.

## 128GB servidor multiusuari

Qwen3.8 27B NVFP4 (vLLM, MTP=3, 100k context, image input)
- `compose-qwen38-27b-cuda-vram128-vllm-unsloth-nvfp4-mtu-100k-image.yml`

És el perfil multiusuari actiu recomanat per al servidor de 128 GB. La configuració actual usa `--max-num-seqs 20`, `--max-num-batched-tokens 8192` i `num_speculative_tokens=3`.

Qwen3.6 35B A3B NVFP4 (vLLM, DFlash, 100k context, image input)
- `compose-qwen36-35b-a3b-cuda-vram96-vllm-nvidia-nvfp4-dflash-100k-image.yml`

## 128GB monolloc

Qwen3.8 27B UD-Q6_K_XL (vLLM, DFlash2, 100k context, image input)
- `compose-qwen38-27b-cuda-vram128-vllm-unsloth-ud-q6-k-xl-incoai-dflash2-100k-image.yml`

## 16GB monolloc

Qwen3.6 35B A3B (llama.cpp, MTP, image input)
- `compose-qwen36-35b-a3b-base-cuda-vram16-llamacpp-localweights-iq4-mtp-image.yml`

## 12GB monolloc

Qwen3.5 9B Q6_K (llama.cpp, 32k context)
- `compose-qwen35-9b-cuda-vram12-llamacpp-unsloth-q6_k.yml`

## 8GB monolloc

Qwen3.5 9B Q4_K_M (llama.cpp, 8k context)
- `compose-qwen35-9b-cuda-vram8-llamacpp-unsloth-q4_k_m.yml`

## 4GB monolloc

Qwen3.5 4B Q4_K_M (llama.cpp)
- `compose-qwen35-4b-cuda-vram4-llamacpp-unsloth-q4_k_m.yml`
