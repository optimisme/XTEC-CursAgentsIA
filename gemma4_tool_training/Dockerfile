FROM pytorch/pytorch:2.9.0-cuda12.8-cudnn9-devel

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/root/.cache/huggingface \
    HUGGINGFACE_HUB_CACHE=/root/.cache/huggingface/hub

WORKDIR /workspace/gemma4_tool_training

COPY requirements.txt /tmp/gemma4-tool-training-requirements.txt
RUN python -m pip install --upgrade pip \
    && python -m pip install -r /tmp/gemma4-tool-training-requirements.txt

CMD ["python", "preflight.py"]
