#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [logFile, promptText = "", changedFile = "", mode = ""] = process.argv.slice(2);
const early = mode === "--early";

function fail(code, failedRequirement, reason, expectedAction, repairHint) {
  console.log(JSON.stringify({
    ok: false,
    code,
    failedRequirement,
    reason,
    expectedAction,
    repairHint
  }));
  process.exit(1);
}

function read(file) {
  if (!file || !fs.existsSync(file)) return "";
  return fs.readFileSync(file, "utf8");
}

function normalizeFile(file) {
  if (!file) return file;
  const marker = `${path.sep}projecteOpenCodeLite${path.sep}`;
  const index = file.indexOf(marker);
  if (index >= 0) return file.slice(index + marker.length);
  return file.replace(/^\.\//, "");
}

function changedFiles(file) {
  return read(file).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

const text = read(logFile);
const clean = text.replace(/\x1b\[[0-9;]*m/g, "");

if (/safe_edit_safe_replace_lines\s+\{[^}\n]*"lines"\s*:\s*\[\s*\]/.test(clean)) {
  fail(
    73,
    "safe_edit_non_empty_replacement",
    "safe_edit_safe_replace_lines was called with an empty lines array",
    "non-empty replacement lines, or safe_edit_safe_delete_lines for pure deletion",
    "Stop the run immediately; retry with one fresh safe_edit verify and a non-empty replacement."
  );
}

const safeEditCalls = [];
const callRegex = /(safe_edit_safe_(?:create_file|create_file_from_lines|replace_lines|insert_lines|delete_lines|verify_file))\s+(\{[^\n]*\})/g;
let match;
while ((match = callRegex.exec(clean))) {
  let input;
  try {
    input = JSON.parse(match[2]);
  } catch {
    continue;
  }
  if (!input?.file) continue;
  safeEditCalls.push({
    tool: match[1],
    file: input.file,
    normalized: normalizeFile(input.file)
  });
}

const absoluteSafeEdit = safeEditCalls.find((call) => path.isAbsolute(call.file));
if (absoluteSafeEdit) {
  fail(
    74,
    "safe_edit_project_relative_paths",
    `safe_edit used an absolute file path: ${absoluteSafeEdit.file}`,
    "safe_edit file paths must be project-relative, such as webs/app.html",
    "Retry with the exact project-relative target path from the user prompt."
  );
}

const writeTools = new Set([
  "safe_edit_safe_create_file",
  "safe_edit_safe_create_file_from_lines",
  "safe_edit_safe_replace_lines",
  "safe_edit_safe_insert_lines",
  "safe_edit_safe_delete_lines"
]);
const writeCounts = new Map();
for (const call of safeEditCalls) {
  if (!writeTools.has(call.tool)) continue;
  const key = `${call.tool}:${call.normalized}`;
  writeCounts.set(key, (writeCounts.get(key) || 0) + 1);
}
for (const [key, count] of writeCounts) {
  if (count >= 3) {
    fail(
      75,
      "bounded_safe_edit_retries",
      `${key} was called ${count} times in one run`,
      "at most two identical safe_edit write attempts per file",
      "Stop looping; verify once, report the blocker, or restart from a smaller prompt."
    );
  }
}

if (!early) {
  const targetMatch = promptText.match(/\bmodify\s+@([^ \t\r\n]+)/i);
  if (targetMatch) {
    const target = normalizeFile(targetMatch[1]);
    const changed = changedFiles(changedFile).map(normalizeFile);
    const unexpected = changed.find((file) => file !== target);
    if (unexpected) {
      fail(
        76,
        "modify_target_file_only",
        `modify prompt targeted ${target}, but ${unexpected} changed`,
        "only the @target file may change during an existing-file modify prompt",
        "Discard the extra file and retry with the exact requested target path."
      );
    }

    const wrongSafeEdit = safeEditCalls.find((call) => call.normalized.startsWith("webs/") && call.normalized !== target);
    if (wrongSafeEdit) {
      fail(
        76,
        "modify_target_file_only",
        `safe_edit targeted ${wrongSafeEdit.normalized}, but prompt targeted ${target}`,
        "safe_edit calls must use only the @target file during modify prompts",
        "Retry with one project-relative target path and no alternate filenames."
      );
    }
  }
}

console.log(JSON.stringify({ ok: true }));
