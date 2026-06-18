#!/usr/bin/env python3
"""Train a PEFT LoRA adapter for generic programming tool-use behavior."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def load_jsonl(path: Path):
    from datasets import Dataset

    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return Dataset.from_list(rows)


def _normalize_message_content(content: object) -> str:
    if isinstance(content, str):
        return content
    return json.dumps(content, ensure_ascii=False)


def _find_subsequence(haystack: list[int], needle: list[int]) -> int:
    if not needle:
        return -1
    last_start = len(haystack) - len(needle)
    for index in range(last_start + 1):
        if haystack[index : index + len(needle)] == needle:
            return index
    return -1


def assistant_loss_labels(messages: list[dict], tokenizer: AutoTokenizer, max_seq_length: int) -> dict:
    """Tokenize a chat and mask loss outside assistant answers."""
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)
    encoded = tokenizer(
        text,
        max_length=max_seq_length,
        truncation=True,
        padding=False,
    )
    labels = [-100] * len(encoded["input_ids"])
    assistant_messages = [message for message in messages if message.get("role") == "assistant"]
    if not assistant_messages:
        encoded["labels"] = labels
        return encoded

    assistant_content = _normalize_message_content(assistant_messages[-1].get("content", ""))
    assistant_ids = tokenizer(
        assistant_content,
        add_special_tokens=False,
    )["input_ids"]
    start = _find_subsequence(encoded["input_ids"], assistant_ids)
    if start < 0:
        encoded["labels"] = labels
        encoded["label_mask_failed"] = True
        return encoded

    end = min(start + len(assistant_ids), len(labels))
    labels[start:end] = encoded["input_ids"][start:end]
    encoded["labels"] = labels
    return encoded


def tokenize_example(example: dict, tokenizer: AutoTokenizer, max_seq_length: int) -> dict:
    return assistant_loss_labels(example["messages"], tokenizer, max_seq_length)


def main() -> int:
    import torch
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        BitsAndBytesConfig,
        DataCollatorForSeq2Seq,
        Trainer,
        TrainingArguments,
    )

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
        lambda example: tokenize_example(example, tokenizer, args.max_seq_length),
        remove_columns=raw_dataset.column_names,
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

    data_collator = DataCollatorForSeq2Seq(tokenizer=tokenizer, model=model, padding=True)
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
