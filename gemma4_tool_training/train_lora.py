#!/usr/bin/env python3
"""Train a PEFT LoRA adapter for generic programming tool-use behavior."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import torch
from datasets import Dataset
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    DataCollatorForLanguageModeling,
    Trainer,
    TrainingArguments,
)


def load_jsonl(path: Path) -> Dataset:
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return Dataset.from_list(rows)


def format_messages(example: dict, tokenizer: AutoTokenizer) -> str:
    return tokenizer.apply_chat_template(
        example["messages"],
        tokenize=False,
        add_generation_prompt=False,
    )


def tokenize_example(example: dict, tokenizer: AutoTokenizer, max_seq_length: int) -> dict:
    encoded = tokenizer(
        example["text"],
        max_length=max_seq_length,
        truncation=True,
        padding=False,
    )
    encoded["labels"] = encoded["input_ids"].copy()
    return encoded


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-model", required=True, help="HF model id or local model path.")
    parser.add_argument("--dataset", type=Path, required=True, help="JSONL with messages arrays.")
    parser.add_argument("--output-dir", type=Path, default=Path("outputs/gemma4-12b-global-tool-lora"))
    parser.add_argument("--max-seq-length", type=int, default=4096)
    parser.add_argument("--epochs", type=float, default=3.0)
    parser.add_argument("--learning-rate", type=float, default=2e-4)
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--grad-accum", type=int, default=16)
    parser.add_argument("--lora-r", type=int, default=16)
    parser.add_argument("--lora-alpha", type=int, default=32)
    parser.add_argument("--lora-dropout", type=float, default=0.05)
    parser.add_argument("--max-steps", type=int, default=-1)
    parser.add_argument("--no-4bit", action="store_true", help="Disable 4-bit QLoRA loading.")
    args = parser.parse_args()

    tokenizer = AutoTokenizer.from_pretrained(args.base_model, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    quantization_config = None
    if not args.no_4bit:
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
            bnb_4bit_use_double_quant=True,
        )

    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        device_map="auto",
        torch_dtype=torch.bfloat16,
        quantization_config=quantization_config,
        trust_remote_code=True,
    )
    if quantization_config is not None:
        model = prepare_model_for_kbit_training(model)

    lora_config = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=[
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj",
        ],
    )
    model = get_peft_model(model, lora_config)

    raw_dataset = load_jsonl(args.dataset)
    train_dataset = raw_dataset.map(
        lambda example: {"text": format_messages(example, tokenizer)},
        remove_columns=raw_dataset.column_names,
    )
    train_dataset = train_dataset.map(
        lambda example: tokenize_example(example, tokenizer, args.max_seq_length),
        remove_columns=["text"],
    )

    training_args = TrainingArguments(
        output_dir=str(args.output_dir),
        num_train_epochs=args.epochs,
        max_steps=args.max_steps,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.learning_rate,
        bf16=True,
        logging_steps=5,
        save_strategy="epoch",
        gradient_checkpointing=True,
        report_to=[],
    )

    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        data_collator=data_collator,
    )
    trainer.train()
    trainer.save_model(str(args.output_dir))
    tokenizer.save_pretrained(str(args.output_dir))
    print(f"saved LoRA adapter to {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
