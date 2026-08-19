# CONFIGS

Models recomanats per programar segons VRAM.

## 128GB/96GB servidor multiusuari

Qwen3.6 35b a3b (vllm)
- compose-qwen36-35b-a3b-cuda-vram96-vllm-nvidia-nvfp4-dflash-64k-image

## 128GB/32GB monolloc

Qwen3.8 27b (vllm)
- compose-qwen38-27b-cuda-vram128-vllm-qwen-fp8-incoai-dflash2-128k-image
- compose-qwen38-27b-cuda-vram128-vllm-radixark-nvfp4-dspark-128k-image

## 16GB monolloc

Qwen3.6 35b a3b (llamacpp)
- compose-qwen36-35b-a3b-base-cuda-vram16-llamacpp-localweights-iq4-mtp-image

## 12GB monolloc

Qwen3.5 9B Q6_K / Q8_0 (llama.cpp)
- compose-qwen35-9b-cuda-vram12-llamacpp-unsloth-q6_k
- compose-qwen35-9b-cuda-vram12-llamacpp-unsloth-q8_0

## 8GB monolloc

Qwen3.5 9B Q4_K_M (llama.cpp, 8k context)
- compose-qwen35-9b-cuda-vram8-llamacpp-unsloth-q4_k_m

## 4GB monolloc

Qwen3.5 4B Q4_K_M (llama.cpp)
- compose-qwen35-4b-cuda-vram4-llamacpp-unsloth-q4_k_m
