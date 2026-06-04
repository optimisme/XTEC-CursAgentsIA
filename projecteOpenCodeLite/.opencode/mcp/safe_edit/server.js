#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = realpathSync(path.resolve(serverDir, "../../.."));
const backupDir = path.join(serverDir, "backups");
const filesNeedingFreshRead = new Set();
const noOpEditCounts = new Map();

const fileRangeSchema = {
  file: z.string().min(1),
  start: z.number().int().min(1),
  end: z.number().int().min(1)
};

const server = new McpServer({
  name: "safe_edit",
  version: "1.0.0"
});

function textResult(text) {
  return {
    content: [{ type: "text", text }]
  };
}

function formatError(error) {
  return `Error: ${error?.message || String(error)}`;
}

function isInsideRoot(target) {
  const relative = path.relative(projectRoot, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function validateRequestedFile(file) {
  if (typeof file !== "string" || file.trim() === "") {
    throw new Error("File path must be a non-empty string.");
  }

  const suspiciousPatterns = [
    /<\|/,
    /\|>/,
    /<channel\|/,
    /<tool_call/,
    /tool_call/i,
    /\bcall:/i,
    /\{|\}/,
    /\[|\]/,
    /["']/,
    /[\r\n\t]/
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(file))) {
    throw new Error(`Rejected suspicious file path: ${file}`);
  }
}

function resolveProjectPath(file) {
  validateRequestedFile(file);
  const normalized = path.normalize(file);
  const target = path.resolve(projectRoot, normalized);
  let checkedTarget = target;

  if (existsSync(target)) {
    checkedTarget = realpathSync(target);
  } else {
    let parent = path.dirname(target);
    while (!existsSync(parent) && parent !== path.dirname(parent)) {
      parent = path.dirname(parent);
    }
    const checkedParent = realpathSync(parent);
    if (!isInsideRoot(checkedParent)) {
      throw new Error(`Path escapes the project root: ${file}`);
    }
  }

  if (!isInsideRoot(checkedTarget)) {
    throw new Error(`Path escapes the project root: ${file}`);
  }

  return checkedTarget;
}

function relativeProjectPath(filePath) {
  return path.relative(projectRoot, filePath) || ".";
}

function staleReadKey(filePath) {
  return relativeProjectPath(filePath);
}

function requireFreshRead(filePath) {
  const key = staleReadKey(filePath);
  if (filesNeedingFreshRead.has(key)) {
    throw new Error(`Line numbers for ${key} are stale after the previous write. Call safe_read_lines or safe_verify_file on this file before editing it again.`);
  }
}

function markNeedsFreshRead(filePath) {
  filesNeedingFreshRead.add(staleReadKey(filePath));
}

function markFreshRead(filePath) {
  filesNeedingFreshRead.delete(staleReadKey(filePath));
}

function readTextFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function splitLines(text) {
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  const hasFinalNewline = text.endsWith("\n");
  const body = hasFinalNewline ? text.slice(0, -newline.length) : text;
  return {
    lines: body.length ? body.split(newline) : [],
    newline,
    hasFinalNewline
  };
}

function joinLines(lines, newline, hasFinalNewline) {
  const body = lines.join(newline);
  return hasFinalNewline && lines.length ? `${body}${newline}` : body;
}

function normalizeContent(content, newline) {
  const normalized = content.replace(/\r?\n/g, newline);
  if (normalized === "") {
    return [];
  }
  const trimmed = normalized.endsWith(newline)
    ? normalized.slice(0, -newline.length)
    : normalized;
  return trimmed === "" ? [] : trimmed.split(newline);
}

function normalizePhysicalLines(lines) {
  return lines.map((line, index) => {
    if (/\r|\n/.test(line)) {
      throw new Error(`Invalid physical line at index ${index}: lines must not contain embedded newline characters. Put each file line in a separate array item.`);
    }
    return line;
  });
}

function assertRange(start, end, lineCount, allowEndZero = false) {
  if (start > end) {
    throw new Error(`Invalid range: start (${start}) is greater than end (${end}).`);
  }
  if (lineCount === 0 && !allowEndZero) {
    throw new Error("Cannot edit an empty file with this range.");
  }
  if (start < 1 || end > lineCount) {
    throw new Error(`Range ${start}-${end} is outside the file line count (${lineCount}).`);
  }
}

function numberLines(lines, firstLine) {
  return lines.map((line, index) => `${firstLine + index}: ${line}`).join("\n");
}

function createBackup(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`File does not exist: ${relativeProjectPath(filePath)}`);
  }

  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeName = relativeProjectPath(filePath).replace(/[^a-zA-Z0-9._-]+/g, "__");
  const backupPath = path.join(backupDir, `${stamp}__${safeName}`);
  copyFileSync(filePath, backupPath);
  return backupPath;
}

function writeEditedFile(filePath, lines, newline, hasFinalNewline) {
  writeFileSync(filePath, joinLines(lines, newline, hasFinalNewline), "utf8");
}

function editSignature(action, filePath, details) {
  return JSON.stringify({
    action,
    file: relativeProjectPath(filePath),
    ...details
  });
}

function recordNoOpEdit(signature, message) {
  const count = (noOpEditCounts.get(signature) || 0) + 1;
  noOpEditCounts.set(signature, count);
  if (count >= 2) {
    throw new Error(`${message} This exact no-op edit was requested ${count} times. Stop editing this file, verify the file, and return a final result.`);
  }
  return `${message} No file was changed. Verify the file and return a final result if the requested content is already present.`;
}

function clearNoOpEdit(signature) {
  noOpEditCounts.delete(signature);
}

function createFile({ file, content }) {
  const filePath = resolveProjectPath(file);

  if (existsSync(filePath)) {
    throw new Error(`File already exists: ${relativeProjectPath(filePath)}. Use safe_replace_lines or safe_apply_patch for existing files.`);
  }

  validateHtmlForWrite(filePath, content);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
  markNeedsFreshRead(filePath);

  return [
    `Created ${relativeProjectPath(filePath)}.`,
    "Backup: none needed for new file"
  ].join("\n");
}

function createFileFromLines({ file, lines }) {
  const physicalLines = normalizePhysicalLines(lines);
  const result = createFile({ file, content: `${physicalLines.join("\n")}\n` });
  if (/\.(?:html|htm)$/i.test(file) && physicalLines.some((line) => /will go here|todo|placeholder/i.test(line))) {
    return [
      result,
      "Scaffold reminder: this HTML still contains placeholder markers. Continue with safe_read_lines, insert/replace implementation chunks, then run safe_verify_file and html-check_check_html before final."
    ].join("\n");
  }

  return result;
}

function appendLines({ file, lines }) {
  const filePath = resolveProjectPath(file);

  if (!existsSync(filePath)) {
    throw new Error(`File does not exist: ${relativeProjectPath(filePath)}. Create it first with safe_create_file or safe_create_file_from_lines.`);
  }
  requireFreshRead(filePath);

  const original = readTextFile(filePath);
  const { lines: existing, newline, hasFinalNewline } = splitLines(original);
  const physicalLines = normalizePhysicalLines(lines);
  existing.push(...physicalLines);
  const nextContent = joinLines(existing, newline, hasFinalNewline || physicalLines.length > 0);
  const signature = editSignature("append_lines", filePath, { lines: physicalLines });
  if (nextContent === original) {
    return recordNoOpEdit(signature, `No-op append in ${relativeProjectPath(filePath)}: requested content is already present or empty.`);
  }
  clearNoOpEdit(signature);
  validateHtmlForWrite(filePath, nextContent);
  const backupPath = createBackup(filePath);
  writeFileSync(filePath, nextContent, "utf8");
  markNeedsFreshRead(filePath);

  const start = existing.length - physicalLines.length + 1;
  return [
    `Appended ${physicalLines.length} line(s) to ${relativeProjectPath(filePath)}.`,
    `Modified range: ${physicalLines.length ? `${start}-${existing.length}` : "none"}.`,
    `Backup: ${relativeProjectPath(backupPath)}`
  ].join("\n");
}

function readRange({ file, start, end }) {
  const filePath = resolveProjectPath(file);
  const { lines } = splitLines(readTextFile(filePath));
  const adjustedEnd = Math.min(end, lines.length);
  assertRange(start, adjustedEnd, lines.length);
  markFreshRead(filePath);
  const prefix = adjustedEnd === end ? "" : `Requested end ${end} adjusted to file end ${lines.length}.\n`;
  return `${prefix}${numberLines(lines.slice(start - 1, adjustedEnd), start)}`;
}

function replaceLines({ file, start, end, content }) {
  const filePath = resolveProjectPath(file);
  requireFreshRead(filePath);
  const original = readTextFile(filePath);
  const { lines, newline, hasFinalNewline } = splitLines(original);
  assertRange(start, end, lines.length);

  const replacement = normalizeContent(content, newline);
  lines.splice(start - 1, end - start + 1, ...replacement);
  const nextContent = joinLines(lines, newline, hasFinalNewline);
  const signature = editSignature("replace_lines", filePath, { start, end, content });
  if (nextContent === original) {
    return recordNoOpEdit(signature, `No-op replace in ${relativeProjectPath(filePath)} lines ${start}-${end}: replacement is identical to the current content.`);
  }
  clearNoOpEdit(signature);
  validateHtmlForWrite(filePath, nextContent);
  const backupPath = createBackup(filePath);
  writeFileSync(filePath, nextContent, "utf8");
  markNeedsFreshRead(filePath);

  const newEnd = start + replacement.length - 1;
  const range = replacement.length ? `${start}-${newEnd}` : `${start - 1}`;
  return [
    `Replaced ${end - start + 1} line(s) in ${relativeProjectPath(filePath)}.`,
    `Modified range: ${range}.`,
    `Backup: ${relativeProjectPath(backupPath)}`
  ].join("\n");
}

function insertAfter({ file, line, content }) {
  const filePath = resolveProjectPath(file);
  requireFreshRead(filePath);
  const original = readTextFile(filePath);
  const { lines, newline, hasFinalNewline } = splitLines(original);

  if (line < 0 || line > lines.length) {
    throw new Error(`Line ${line} is outside the insert range 0-${lines.length}.`);
  }

  const inserted = normalizeContent(content, newline);
  lines.splice(line, 0, ...inserted);
  const nextContent = joinLines(lines, newline, hasFinalNewline || inserted.length > 0);
  const signature = editSignature("insert_after", filePath, { line, content });
  if (nextContent === original) {
    return recordNoOpEdit(signature, `No-op insert in ${relativeProjectPath(filePath)} after line ${line}: requested insertion is empty.`);
  }
  clearNoOpEdit(signature);
  validateHtmlForWrite(filePath, nextContent);
  const backupPath = createBackup(filePath);
  writeFileSync(filePath, nextContent, "utf8");
  markNeedsFreshRead(filePath);

  const start = line + 1;
  const end = line + inserted.length;
  return [
    `Inserted ${inserted.length} line(s) in ${relativeProjectPath(filePath)}.`,
    `Modified range: ${inserted.length ? `${start}-${end}` : "none"}.`,
    `Backup: ${relativeProjectPath(backupPath)}`
  ].join("\n");
}

function deleteLines({ file, start, end }) {
  const filePath = resolveProjectPath(file);
  requireFreshRead(filePath);
  const original = readTextFile(filePath);
  const { lines, newline, hasFinalNewline } = splitLines(original);
  assertRange(start, end, lines.length);

  lines.splice(start - 1, end - start + 1);
  const nextContent = joinLines(lines, newline, hasFinalNewline && lines.length > 0);
  const signature = editSignature("delete_lines", filePath, { start, end });
  if (nextContent === original) {
    return recordNoOpEdit(signature, `No-op delete in ${relativeProjectPath(filePath)} lines ${start}-${end}: no content would be removed.`);
  }
  clearNoOpEdit(signature);
  validateHtmlForWrite(filePath, nextContent);
  const backupPath = createBackup(filePath);
  writeFileSync(filePath, nextContent, "utf8");
  markNeedsFreshRead(filePath);

  return [
    `Deleted ${end - start + 1} line(s) from ${relativeProjectPath(filePath)}.`,
    `Modified range: ${start}-${Math.max(start, lines.length)}.`,
    `Backup: ${relativeProjectPath(backupPath)}`
  ].join("\n");
}

function parsePatchPaths(patch) {
  const files = new Set();
  for (const line of patch.split(/\r?\n/)) {
    const match = /^(?:---|\+\+\+|diff --git) (.+)$/.exec(line);
    if (!match) {
      continue;
    }

    const parts = line.startsWith("diff --git ") ? match[1].split(/\s+/) : [match[1]];
    for (const rawPart of parts) {
      if (rawPart === "/dev/null") {
        continue;
      }
      const withoutPrefix = rawPart.replace(/^(?:a|b)\//, "");
      files.add(relativeProjectPath(resolveProjectPath(withoutPrefix)));
    }
  }
  return [...files];
}

function applyPatch({ patch }) {
  if (!patch.trim()) {
    throw new Error("Patch is empty.");
  }

  const files = parsePatchPaths(patch);
  if (!files.length) {
    throw new Error("No file paths found in patch.");
  }
  for (const file of files) {
    requireFreshRead(resolveProjectPath(file));
  }

  try {
    execFileSync("git", ["apply", "--check", "-"], {
      cwd: projectRoot,
      input: patch,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"]
    });
  } catch (error) {
    const message = error.stderr || error.stdout || error.message;
    return `Patch validation failed. No files were modified.\n${message.trim()}`;
  }

  const backups = [];
  for (const file of files) {
    const filePath = resolveProjectPath(file);
    if (existsSync(filePath)) {
      backups.push(relativeProjectPath(createBackup(filePath)));
    }
  }

  execFileSync("git", ["apply", "-"], {
    cwd: projectRoot,
    input: patch,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"]
  });
  for (const file of files) {
    markNeedsFreshRead(resolveProjectPath(file));
  }

  return [
    `Applied patch to ${files.length} file(s): ${files.join(", ")}`,
    backups.length ? `Backups: ${backups.join(", ")}` : "Backups: none needed for new files"
  ].join("\n");
}

function verifyFile({ file, start, end }) {
  const filePath = resolveProjectPath(file);
  const text = readTextFile(filePath);
  verifyHtmlStructure(filePath, text);
  const { lines } = splitLines(text);
  const first = start ?? 1;
  const last = end ?? lines.length;

  if (!lines.length) {
    return "";
  }

  assertRange(first, last, lines.length);
  markFreshRead(filePath);
  return numberLines(lines.slice(first - 1, last), first);
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function verifyBalancedHtmlTag(text, tagName) {
  const open = countMatches(text, new RegExp(`<${tagName}(?:\\s|>|/)`, "gi"));
  const close = countMatches(text, new RegExp(`</${tagName}\\s*>`, "gi"));
  if (open !== close) {
    throw new Error(`HTML sanity check failed: <${tagName}> count (${open}) does not match </${tagName}> count (${close}).`);
  }
}

function verifyHtmlStructure(filePath, text) {
  if (!/\.(?:html|htm)$/i.test(filePath)) {
    return;
  }

  if (/will go here|buttons go here|calculator ui structure|placeholder/i.test(text)) {
    throw new Error("HTML sanity check failed: placeholder markers remain in the file.");
  }

  validateHtmlForWrite(filePath, text);
}

function validateHtmlForWrite(filePath, text) {
  if (!/\.(?:html|htm)$/i.test(filePath)) {
    return;
  }

  const lower = text.toLowerCase();
  const htmlCloseIndex = lower.indexOf("</html>");
  if (htmlCloseIndex !== -1) {
    const afterHtml = text.slice(htmlCloseIndex + "</html>".length);
    if (afterHtml.trim() !== "") {
      throw new Error("HTML sanity check failed: content exists after the first </html> closing tag.");
    }
  }

  verifyBalancedHtmlTag(text, "html");
  verifyBalancedHtmlTag(text, "head");
  verifyBalancedHtmlTag(text, "body");
  verifyBalancedHtmlTag(text, "style");
  verifyBalancedHtmlTag(text, "script");
  verifyHeadContent(text);
}

function verifyHeadContent(text) {
  const headMatch = /<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(text);
  if (!headMatch) {
    return;
  }

  const stripped = headMatch[1]
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<meta\b[^>]*>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<base\b[^>]*>/gi, "")
    .replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .trim();

  if (stripped !== "") {
    throw new Error("HTML sanity check failed: unexpected raw content appears inside <head> outside allowed tags.");
  }
}

function registerTool(name, description, inputSchema, handler) {
  server.registerTool(name, { description, inputSchema }, async (input) => {
    try {
      const parsed = z.object(inputSchema).parse(input || {});
      return textResult(handler(parsed));
    } catch (error) {
      return textResult(formatError(error));
    }
  });
}

registerTool(
  "safe_create_file_from_lines",
  "Create a new UTF-8 text file from an array of physical file lines. Use this for short files. For longer files, prefer safe_create_file with a single content string. Fails if the file already exists.",
  {
    file: z.string().min(1),
    lines: z.array(z.string())
  },
  createFileFromLines
);

registerTool(
  "safe_create_file",
  "Create a new UTF-8 text file from one complete content string. Prefer this for new self-contained HTML/CSS/JS files. Fails if the file already exists.",
  {
    file: z.string().min(1),
    content: z.string()
  },
  createFile
);

registerTool(
  "safe_append_lines",
  "Append an array of physical file lines to the end of an existing UTF-8 text file after creating a backup. Use only when content belongs at physical EOF; prefer insert/replace for HTML/CSS/JS internals.",
  {
    file: z.string().min(1),
    lines: z.array(z.string())
  },
  appendLines
);

registerTool(
  "safe_read_lines",
  "Read a file range using 1-based line numbers and return line-numbered text.",
  fileRangeSchema,
  readRange
);

registerTool(
  "safe_replace_lines",
  "Replace an inclusive 1-based line range after creating a backup. Line numbers become stale after every write. If you need more than one edit in a file, prefer safe_apply_patch, or verify/read the file again after this tool before using another line-number edit.",
  {
    ...fileRangeSchema,
    content: z.string()
  },
  replaceLines
);

registerTool(
  "safe_insert_after",
  "Insert content after the given 1-based line number after creating a backup. Use line 0 to insert at the top. Line numbers become stale after this write. If you need another edit in the same file, verify/read the file again before choosing the next line number.",
  {
    file: z.string().min(1),
    line: z.number().int().min(0),
    content: z.string()
  },
  insertAfter
);

registerTool(
  "safe_delete_lines",
  "Delete an inclusive 1-based line range after creating a backup. Use only line numbers from the current file state. If any previous write happened, verify/read the file again before deleting. For multi-edit changes, prefer safe_apply_patch.",
  fileRangeSchema,
  deleteLines
);

registerTool(
  "safe_apply_patch",
  "Validate a unified diff with git apply --check, then apply it and back up touched existing files. Prefer this for multiple edits in one file because context lines prevent stale-line-number mistakes.",
  {
    patch: z.string().min(1)
  },
  applyPatch
);

registerTool(
  "safe_verify_file",
  "Read a full file or selected range after modification and return line-numbered text.",
  {
    file: z.string().min(1),
    start: z.number().int().min(1).optional(),
    end: z.number().int().min(1).optional()
  },
  verifyFile
);

async function main() {
  if (process.argv.includes("--self-test")) {
    resolveProjectPath("opencode.json");
    try {
      resolveProjectPath("../outside.txt");
      throw new Error("Path traversal check failed.");
    } catch (error) {
      if (!String(error.message).includes("escapes")) {
        throw error;
      }
    }
    const selfTestFile = ".opencode/mcp/safe_edit/backups/self-test-create.txt";
    const selfTestPath = resolveProjectPath(selfTestFile);
    if (existsSync(selfTestPath)) {
      rmSync(selfTestPath);
    }
    createFile({ file: selfTestFile, content: "safe_edit create self-test\n" });
    if (!existsSync(selfTestPath)) {
      throw new Error("safe_create_file self-test failed.");
    }
    verifyFile({ file: selfTestFile });
    appendLines({ file: selfTestFile, lines: ["append"] });
    const selfTestContent = readTextFile(selfTestPath);
    if (!selfTestContent.includes("append")) {
      throw new Error("safe_append_lines self-test failed.");
    }
    verifyFile({ file: selfTestFile });
    replaceLines({ file: selfTestFile, start: 1, end: 2, content: "one\ntwo\nthree" });
    try {
      insertAfter({ file: selfTestFile, line: 2, content: "must fail before fresh read" });
      throw new Error("stale line-number guard self-test failed.");
    } catch (error) {
      if (!String(error.message).includes("Line numbers") || !String(error.message).includes("stale")) {
        throw error;
      }
    }
    verifyFile({ file: selfTestFile });
    insertAfter({ file: selfTestFile, line: 2, content: "inserted" });
    verifyFile({ file: selfTestFile });
    deleteLines({ file: selfTestFile, start: 1, end: 1 });
    const lineEditContent = readTextFile(selfTestPath);
    if (lineEditContent !== "two\ninserted\nthree\n") {
      throw new Error("safe line operation self-test failed.");
    }
    rmSync(selfTestPath);
    const outsideDir = path.resolve(projectRoot, "..", "safe_edit-outside-self-test");
    const symlinkFile = ".opencode/mcp/safe_edit/backups/self-test-symlink";
    const symlinkPath = resolveProjectPath(symlinkFile);
    rmSync(symlinkPath, { force: true, recursive: true });
    rmSync(outsideDir, { force: true, recursive: true });
    mkdirSync(outsideDir, { recursive: true });
    symlinkSync(outsideDir, symlinkPath, "dir");
    try {
      resolveProjectPath(`${symlinkFile}/escape.txt`);
      throw new Error("Symlink path traversal check failed.");
    } catch (error) {
      if (!String(error.message).includes("escapes")) {
        throw error;
      }
    } finally {
      rmSync(symlinkPath, { force: true, recursive: true });
      rmSync(outsideDir, { force: true, recursive: true });
    }
    const htmlSelfTestFile = ".opencode/mcp/safe_edit/backups/self-test-invalid.html";
    const htmlSelfTestPath = resolveProjectPath(htmlSelfTestFile);
    if (existsSync(htmlSelfTestPath)) {
      rmSync(htmlSelfTestPath);
    }
    try {
      createFileFromLines({
        file: htmlSelfTestFile,
        lines: ["<!doctype html>\n<html>"]
      });
      throw new Error("safe_create_file_from_lines physical line self-test failed.");
    } catch (error) {
      if (!String(error.message).includes("Invalid physical line")) {
        throw error;
      }
    }
    try {
      createFileFromLines({
        file: htmlSelfTestFile,
        lines: ["<!doctype html>", "<html>", "<body>ok</body>", "</html>", "<div>extra</div>"]
      });
      throw new Error("safe_create_file_from_lines HTML sanity self-test failed.");
    } catch (error) {
      if (!String(error.message).includes("content exists after the first </html>")) {
        throw error;
      }
    }
    writeFileSync(htmlSelfTestPath, "<!doctype html>\n<html>\n<body>ok</body>\n</html>\n<div>extra</div>\n", "utf8");
    try {
      verifyFile({ file: htmlSelfTestFile });
      throw new Error("safe_verify_file HTML sanity self-test failed.");
    } catch (error) {
      if (!String(error.message).includes("content exists after the first </html>")) {
        throw error;
      }
    } finally {
      rmSync(htmlSelfTestPath);
    }
    createFileFromLines({
      file: htmlSelfTestFile,
      lines: ["<!doctype html>", "<html>", "<head>", "<title>x</title>", "</head>", "<body>", "<p>will go here</p>", "</body>", "</html>"]
    });
    try {
      verifyFile({ file: htmlSelfTestFile });
      throw new Error("safe_verify_file placeholder sanity self-test failed.");
    } catch (error) {
      if (!String(error.message).includes("placeholder markers remain")) {
        throw error;
      }
    } finally {
      rmSync(htmlSelfTestPath);
    }
    try {
      createFileFromLines({
        file: htmlSelfTestFile,
        lines: ["<!doctype html>", "<html>", "<head>", "<title>x</title>", "body { color: red; }", "</head>", "<body>ok</body>", "</html>"]
      });
      throw new Error("safe_create_file_from_lines head raw content self-test failed.");
    } catch (error) {
      if (!String(error.message).includes("unexpected raw content")) {
        throw error;
      }
    }
    writeFileSync(htmlSelfTestPath, "<!doctype html>\n<html>\n<head>\n<title>x</title>\nbody { color: red; }\n</head>\n<body>ok</body>\n</html>\n", "utf8");
    try {
      verifyFile({ file: htmlSelfTestFile });
      throw new Error("safe_verify_file head raw content self-test failed.");
    } catch (error) {
      if (!String(error.message).includes("unexpected raw content")) {
        throw error;
      }
    } finally {
      rmSync(htmlSelfTestPath);
    }
    console.log("safe_edit self-test passed");
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
