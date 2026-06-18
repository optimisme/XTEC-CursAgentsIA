#!/usr/bin/env node
/*
 * Expand generic OpenCode task prompts into deterministic paraphrase variants.
 *
 * This does not invent new fixtures. It reuses each task's files, verification,
 * and expectations while varying the user request so collection does not train
 * only on one phrasing per bug.
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_INPUT = "tasks/generic_programming_tasks.jsonl";
const DEFAULT_OUTPUT = "tasks/generic_programming_tasks.expanded.jsonl";

const VARIANT_TEMPLATES = [
  (prompt) => prompt,
  (prompt, task) => [
    `In this isolated ${task.scenario} fixture, ${lowerFirst(prompt)}`,
    "Keep the change focused and run the provided verification.",
  ].join(" "),
  (prompt) => [
    prompt,
    "Inspect only the relevant files first, then make the smallest working edit.",
  ].join(" "),
  (prompt, task) => [
    `Working from the existing files, handle this ${task.kind.replaceAll("_", " ")}: ${prompt}`,
    "Do not rewrite unrelated code.",
  ].join(" "),
  (prompt) => [
    prompt,
    "After the focused check passes, stop and return Changed files, Verification, and Remaining risk.",
  ].join(" "),
  (prompt) => [
    "Please fix this without fake tool-call text or hidden-channel markup.",
    prompt,
  ].join(" "),
  (prompt) => [
    prompt,
    "If a tool result is empty or a command is unavailable, recover once with a smaller relevant action.",
  ].join(" "),
  (prompt) => [
    "Use the default OpenCode tools for this repository task.",
    prompt,
    "Avoid broad searches after the requested verification succeeds.",
  ].join(" "),
  (prompt) => [
    "Handle this as a normal coding-agent task in the current workspace.",
    prompt,
    "Use real reads/edits/commands instead of describing tool calls.",
  ].join(" "),
  (prompt) => [
    prompt,
    "Before editing, inspect the relevant implementation and focused test or metadata.",
    "After verification, produce only the final status sections.",
  ].join(" "),
  (prompt, task) => [
    `For this ${task.scenario} task, make the smallest change that satisfies the request: ${prompt}`,
    "Do not chase unrelated files.",
  ].join(" "),
  (prompt) => [
    "Work boundedly and recover at most once from an empty or invalid tool result.",
    prompt,
  ].join(" "),
  (prompt) => [
    prompt,
    "If the focused command passes, do not repeat it; stop with Changed files, Verification, and Remaining risk.",
  ].join(" "),
  (prompt) => [
    "Do the repository work with actual OpenCode tool calls.",
    prompt,
    "Never print Markdown links, JSON arrays, or XML tags as fake tools.",
  ].join(" "),
  (prompt, task) => [
    `Complete this ${task.kind.replaceAll("_", " ")} request: ${prompt}`,
    "Keep the response concise once the task is verified.",
  ].join(" "),
  (prompt) => [
    prompt,
    "If verification cannot run because a runtime is missing, report that bounded blocker instead of looping.",
  ].join(" "),
];

function parseArgs(argv) {
  const args = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    variants: 5,
    startVariant: 1,
    includeOriginal: true,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--input") args.input = next();
    else if (arg.startsWith("--input=")) args.input = arg.slice("--input=".length);
    else if (arg === "--output") args.output = next();
    else if (arg.startsWith("--output=")) args.output = arg.slice("--output=".length);
    else if (arg === "--variants") args.variants = Number.parseInt(next(), 10);
    else if (arg.startsWith("--variants=")) args.variants = Number.parseInt(arg.slice("--variants=".length), 10);
    else if (arg === "--start-variant") args.startVariant = Number.parseInt(next(), 10);
    else if (arg.startsWith("--start-variant=")) args.startVariant = Number.parseInt(arg.slice("--start-variant=".length), 10);
    else if (arg === "--no-original") args.includeOriginal = false;
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!Number.isFinite(args.variants) || args.variants <= 0) {
    throw new Error("--variants must be a positive integer");
  }
  if (args.variants > VARIANT_TEMPLATES.length) {
    throw new Error(`--variants cannot exceed ${VARIANT_TEMPLATES.length}`);
  }
  if (!Number.isFinite(args.startVariant) || args.startVariant <= 0 || args.startVariant > args.variants) {
    throw new Error("--start-variant must be between 1 and --variants");
  }
  return args;
}

function readJsonl(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${filePath}:${index + 1}: invalid JSON: ${error.message}`);
      }
    });
}

function lowerFirst(text) {
  if (!text) return text;
  return text[0].toLowerCase() + text.slice(1);
}

function cleanPrompt(text) {
  return text.replace(/\s+/g, " ").trim();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const tasks = readJsonl(args.input);
  const rows = [];
  const startVariant = args.includeOriginal ? args.startVariant - 1 : Math.max(args.startVariant, 2) - 1;
  for (const task of tasks) {
    for (let variant = startVariant; variant < args.variants; variant += 1) {
      const expanded = {
        ...task,
        id: `${task.id}__p${String(variant + 1).padStart(2, "0")}`,
        base_id: task.base_id || task.id,
        prompt_variant: variant + 1,
        prompt: cleanPrompt(VARIANT_TEMPLATES[variant](task.prompt, task)),
      };
      rows.push(expanded);
    }
  }
  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, rows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
  console.log(`wrote ${rows.length} tasks to ${args.output}`);
}

main();
