import os
import types
from pathlib import Path

import torch
from datasets import load_dataset
import transformers.modeling_utils as modeling_utils
from transformers import AutoModelForCausalLM, AutoTokenizer

# llm-compressor 0.10 pins Transformers 4.x. Mellum2 needs newer
# Transformers, where this compatibility symbol was removed.
if not hasattr(modeling_utils, "TORCH_INIT_FUNCTIONS"):
    modeling_utils.TORCH_INIT_FUNCTIONS = {}

from llmcompressor import oneshot
from llmcompressor.modifiers.quantization import QuantizationModifier
try:
    from llmcompressor.modifiers.transform.awq import AWQModifier
    from llmcompressor.modifiers.transform.awq import AWQMapping
except ModuleNotFoundError:
    from llmcompressor.modifiers.awq.base import AWQModifier
    from llmcompressor.modifiers.awq.mappings import AWQMapping


MODEL_ID = os.environ.get("MODEL_ID", "JetBrains/Mellum2-12B-A2.5B-Thinking")
SAVE_DIR = Path(
    os.environ.get(
        "SAVE_DIR",
        "/workspace/quantized/Mellum2-12B-A2.5B-Thinking-AWQ-W4A16",
    )
)
DATASET_ID = os.environ.get("DATASET_ID", "neuralmagic/calibration")
DATASET_NAME = os.environ.get("DATASET_NAME", "LLM")
NUM_CALIBRATION_SAMPLES = int(os.environ.get("NUM_CALIBRATION_SAMPLES", "64"))
MAX_SEQUENCE_LENGTH = int(os.environ.get("MAX_SEQUENCE_LENGTH", "16384"))


def preprocess_function(tokenizer):
    def preprocess(example):
        messages = [
            {"role": message["role"], "content": message["content"]}
            for message in example["messages"]
        ]
        return tokenizer.apply_chat_template(
            messages,
            return_tensors="pt",
            padding=False,
            truncation=True,
            max_length=MAX_SEQUENCE_LENGTH,
            tokenize=True,
            add_special_tokens=False,
            return_dict=True,
            add_generation_prompt=False,
        )

    return preprocess


def data_collator(batch):
    assert len(batch) == 1
    item = batch[0]
    return {key: torch.tensor(value) for key, value in item.items()}


def main():
    SAVE_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading model: {MODEL_ID}", flush=True)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        dtype=torch.bfloat16,
        trust_remote_code=True,
    )
    if not hasattr(model, "_get_no_split_modules") and hasattr(model, "_no_split_modules"):
        def _get_no_split_modules(self, device_map="auto"):
            return self._no_split_modules

        model._get_no_split_modules = types.MethodType(_get_no_split_modules, model)

    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)

    print(
        f"Loading calibration dataset: {DATASET_ID}/{DATASET_NAME} "
        f"samples={NUM_CALIBRATION_SAMPLES} max_seq={MAX_SEQUENCE_LENGTH}",
        flush=True,
    )
    dataset = load_dataset(
        DATASET_ID,
        name=DATASET_NAME,
        split=f"train[:{NUM_CALIBRATION_SAMPLES}]",
    )
    dataset = dataset.map(
        preprocess_function(tokenizer),
        batched=False,
        remove_columns=dataset.column_names,
    )

    recipe = [
        AWQModifier(
            mappings=[
                AWQMapping(
                    smooth_layer="re:.*input_layernorm$",
                    balance_layers=[
                        "re:.*q_proj$",
                        "re:.*k_proj$",
                        "re:.*v_proj$",
                    ],
                ),
            ],
        ),
        QuantizationModifier(
            targets="Linear",
            scheme="W4A16_ASYM",
            ignore=[
                "lm_head",
                "re:.*embed.*",
                "re:.*router.*",
                "re:.*gate.*",
            ],
        ),
    ]

    print("Starting Mellum2 AWQ W4A16 quantization", flush=True)
    oneshot(
        model=model,
        recipe=recipe,
        dataset=dataset,
        max_seq_length=MAX_SEQUENCE_LENGTH,
        num_calibration_samples=NUM_CALIBRATION_SAMPLES,
        data_collator=data_collator,
    )

    print(f"Saving compressed model to: {SAVE_DIR}", flush=True)
    model.save_pretrained(SAVE_DIR, save_compressed=True)
    tokenizer.save_pretrained(SAVE_DIR)
    print("Done", flush=True)


if __name__ == "__main__":
    main()
