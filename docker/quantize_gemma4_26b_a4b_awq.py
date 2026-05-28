import os
from pathlib import Path

import torch
from datasets import load_dataset
from transformers import AutoProcessor, Gemma4ForConditionalGeneration

from llmcompressor import oneshot
from llmcompressor.modifiers.quantization import QuantizationModifier
from llmcompressor.modifiers.transform.awq import AWQModifier


MODEL_ID = os.environ.get("MODEL_ID", "google/gemma-4-26B-A4B-it")
SAVE_DIR = Path(os.environ.get("SAVE_DIR", "/workspace/quantized/gemma-4-26B-A4B-it-AWQ-W4A16"))
DATASET_ID = os.environ.get("DATASET_ID", "neuralmagic/calibration")
DATASET_NAME = os.environ.get("DATASET_NAME", "LLM")
NUM_CALIBRATION_SAMPLES = int(os.environ.get("NUM_CALIBRATION_SAMPLES", "64"))
MAX_SEQUENCE_LENGTH = int(os.environ.get("MAX_SEQUENCE_LENGTH", "4096"))


def preprocess_function(processor):
    def preprocess(example):
        messages = [
            {
                "role": message["role"],
                "content": [{"type": "text", "text": message["content"]}],
            }
            for message in example["messages"]
        ]
        return processor.apply_chat_template(
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
    return {
        key: (
            torch.tensor(value, dtype=torch.bfloat16).squeeze(0)
            if key == "pixel_values"
            else torch.tensor(value)
        )
        for key, value in item.items()
    }


def main():
    SAVE_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Loading model: {MODEL_ID}", flush=True)
    model = Gemma4ForConditionalGeneration.from_pretrained(MODEL_ID, dtype="auto")
    processor = AutoProcessor.from_pretrained(MODEL_ID)

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
        preprocess_function(processor),
        batched=False,
        remove_columns=dataset.column_names,
    )

    recipe = [
        AWQModifier(),
        QuantizationModifier(
            targets="Linear",
            scheme="W4A16_ASYM",
            ignore=[
                "lm_head",
                "re:.*embed.*",
                "re:.*router",
                "re:.*vision_tower.*",
            ],
        ),
    ]

    print("Starting AWQ W4A16 quantization", flush=True)
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
    processor.save_pretrained(SAVE_DIR)
    print("Done", flush=True)


if __name__ == "__main__":
    main()
