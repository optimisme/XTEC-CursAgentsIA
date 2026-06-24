# RANKING programació

## vram 96gb-128gb

1. ⭐⭐ compose-qwen36-35b-a3b-cuda-vram128-vllm-nvidia-nvfp4-64k-image.yml (Qwen3.6 35B A3B NVIDIA NVFP4, vLLM 0.23.0, context 64k + image, qwen3_xml tools, KV cache FP8, FlashInfer B12X MoE, max-num-seqs 32; health confirmat a Spark, OpenCode write provat)
2. compose-qwen36-35b-a3b-cuda-vram96-vllm-nvidia-nvfp4-64k-image.yml (checkpoint NVIDIA NVFP4, context 64k + image, perfil ajustat per 96GB, FlashInfer B12X MoE, max-num-seqs 20)
3. compose-qwen36-35b-a3b-cuda-vram96-vllm-nvidia-nvfp4-marlin-64k-image.yml (mateix checkpoint NVIDIA NVFP4, context 64k + image, backend Marlin, max-num-seqs 20; variant de compatibilitat/prova)
4. compose-qwen36-35b-a3b-cuda-vram128-vllm-qwen-fp8.yml (checkpoint Qwen FP8, fallback si NVFP4 dona regressions)

## vram 96gb-128gb (64k + image)

1. ⭐⭐ compose-qwen36-35b-a3b-cuda-vram128-vllm-nvidia-nvfp4-64k-image.yml (Qwen3.6 35B A3B NVIDIA NVFP4, vLLM 0.23.0, context 64k + image, qwen3_xml tools, KV cache FP8, FlashInfer B12X MoE, max-num-seqs 32; health confirmat a Spark, OpenCode write provat)
2. compose-qwen36-35b-a3b-cuda-vram96-vllm-nvidia-nvfp4-64k-image.yml (Qwen3.6 35B A3B NVIDIA NVFP4, context 64k + image, qwen3_xml tools, KV cache FP8, FlashInfer B12X MoE, max-num-seqs 20)
3. compose-qwen36-35b-a3b-cuda-vram96-vllm-nvidia-nvfp4-marlin-64k-image.yml (Qwen3.6 35B A3B NVIDIA NVFP4, context 64k + image, qwen3_xml tools, KV cache FP8, backend Marlin, max-num-seqs 20)
4. compose-gemma4-31b-it-cuda-vram128-vllm-google-qat-w4a16-64k-image.yml (Gemma 4 31B dense QAT W4A16, vLLM 0.23.0, MTP, thinking, temperature 0, context 64k + image)

## vram 32gb

1. compose-ministral3-14b-instruct-cuda-vram32-vllm-mistral-fp8.yml (Ministral 3 14B Instruct FP8, vLLM 0.23.0, tools, text-only, context 32k, port 8000; provat a Spark)

## vram 16gb

1. ⭐⭐ compose-qwen36-35b-a3b-base-cuda-vram16-llamacpp-localweights-iq4-mtp.yml (llama.cpp GGUF, NVIDIA CUDA, alta capacitat però poca concurrència)
2. compose-ministral3-3b-instruct-cuda-vram16-vllm-mistral-fp8-128k.yml (Ministral 3 3B Instruct FP8, vLLM 0.23.0, tools, text-only, context 128k, port 8000)
3. compose-gemma4-12b-it-cuda-vram16-vllm-google-qat-w4a16.yml (Gemma 4 12B QAT W4A16, vLLM 0.23.0, MTP, thinking, temperature 0, text-only)

## vram 16gb (64k + image)

1. compose-gemma4-12b-it-cuda-vram16-vllm-google-qat-w4a16-64k-image.yml (Gemma 4 12B QAT W4A16, vLLM 0.23.0, MTP, thinking, temperature 0, context 64k + image)
2. compose-gemma4-e4b-it-cuda-vram16-vllm-google-qat-w4a16-mtp-64k-image.yml (Gemma 4 E4B QAT W4A16 MTP, temperature 0, context 64k + image)

## vram 8gb (64k + image)

1. compose-qwen3-vl-2b-instruct-cuda-vram8-vllm-qwen-fp8-64k-image.yml (Qwen3-VL 2B Instruct FP8, vLLM 0.23.0, model només d'imatge, context 64k, KV cache FP8, port 8000; deixat aturat a Spark) : IMAGE ONLY

# Recordatori

- Qwen36 programa millor que Gemma4 (gemma 4 tendeix a fer bucles infinits)

- gemma-4-31B-it és 'dense' ofereix més qualitat però més lent

- 35b més capacitat de rahonament

- 64k més context i lentitud

- Per imatges cal servir el model amb 64k (`--max-model-len 65536`) i configurar també el client a 64k. Amb 32k les imatges poden fallar per falta de context.

### Configurar context a opencode.json

64k

```json
"active-model": {
    "name": "Active Model",
    "limit": {
    "context": 65536,
    "output": 8192
    },
```

32k

```json
"active-model": {
    "name": "Active Model",
    "limit": {
    "context": 32768,
    "output": 4096
    },
```
