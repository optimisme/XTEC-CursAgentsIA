# RANKING

## vram 96gb-128gb

1. compose-qwen36-35b-a3b-cuda-vram128-vllm-nvidia-nvfp4.yml (checkpoint NVIDIA NVFP4)
2. compose-qwen36-35b-a3b-cuda-vram96-vllm-nvidia-nvfp4.yml (checkpoint NVIDIA NVFP4)
3. compose-qwen36-35b-a3b-cuda-vram128-vllm-qwen-fp8.yml (checkpoint Qwen FP8)

## vram 16gb

1. compose-qwen36-35b-a3b-base-cuda-vram16-llamacpp-localweights-iq4-mtp.yml (llama.cpp GGUF, NVIDIA CUDA)

2. gemma4_12b_it_cuda_vram16_vllm_google_qat_w4a16 (Gemma 4 12B QAT W4A16, vLLM 0.23.0, MTP, thinking, temperature 0, text-only)

3. compose-gemma4-e4b-it-cuda-vram16-vllm-google-qat-w4a16-mtp.yml (Gemma 4 E4B QAT W4A16 MTP, temperature 0)

4. compose-gemma4-e4b-it-cuda-vram16-vllm-google-qat-w4a16-mtp-64k-image (context 64k + image)

# Recordatori

- Qwen36 programa millor que Gemma4

- 35b més capacitat de rahonament

- 64k més context i lentitud

- Per imatges fa falta un context mínim de 64k

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