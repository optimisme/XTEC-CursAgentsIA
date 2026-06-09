#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = realpathSync(path.resolve(serverDir, "../../.."));
const backupDir = path.join(serverDir, "backups");
const filesNeedingFreshRead = new Set();
const noOpEditCounts = new Map();
const suspiciousPathCounts = new Map();
const MAX_INSERT_LINES = 120;
const MAX_DELETE_LINES = 180;
const MAX_REPLACE_LINES = 220;
const MAX_VERIFY_LINES = 220;

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
  if (path.isAbsolute(file)) {
    throw new Error(`Absolute file paths are not allowed: ${file}. Use a project-relative path such as webs/app.html.`);
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
    const count = (suspiciousPathCounts.get(file) || 0) + 1;
    suspiciousPathCounts.set(file, count);
    if (count >= 2) {
      throw new Error(`Repeated corrupt tool-call path detected: ${file}. Stop immediately. Do not call safe_edit again. Return a blocker saying the model produced malformed tool syntax.`);
    }
    throw new Error(`Rejected suspicious file path: ${file}. This looks like malformed tool-call syntax, not a real file path. Stop and return a blocker if this happens again.`);
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
    throw new Error(`Line numbers for ${key} are stale after the previous write. Call safe_verify_file on this file before editing it again.`);
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
    throw new Error(`File already exists: ${relativeProjectPath(filePath)}. For existing files, use safe_verify_file, then safe_delete_lines and safe_insert_lines with current line numbers.`);
  }

  validateTextForWrite(filePath, content);
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
      "Scaffold reminder: this HTML still contains placeholder markers. Overwrite the complete file with real content, then run safe_verify_file and web_check before final."
    ].join("\n");
  }

  return result;
}

function insertLines({ file, after, lines }) {
  const filePath = resolveProjectPath(file);
  requireFreshRead(filePath);
  const original = readTextFile(filePath);
  const { lines: existing, newline, hasFinalNewline } = splitLines(original);

  if (after < 0 || after > existing.length) {
    throw new Error(`Line ${after} is outside the insert range 0-${existing.length}.`);
  }

  const inserted = normalizePhysicalLines(lines);
  if (inserted.length > MAX_INSERT_LINES) {
    throw new Error(`Insert too large: ${inserted.length} lines. Limit is ${MAX_INSERT_LINES}. Split the request or return a blocker instead of emitting a huge edit.`);
  }
  existing.splice(after, 0, ...inserted);
  const nextContent = joinLines(existing, newline, hasFinalNewline || inserted.length > 0);
  const signature = editSignature("insert_lines", filePath, { after, lines: inserted });
  if (nextContent === original) {
    return recordNoOpEdit(signature, `No-op insert in ${relativeProjectPath(filePath)} after line ${after}: requested insertion is empty.`);
  }
  clearNoOpEdit(signature);
  validateTextForWrite(filePath, nextContent);
  const backupPath = createBackup(filePath);
  writeFileSync(filePath, nextContent, "utf8");
  markNeedsFreshRead(filePath);

  const start = after + 1;
  const end = after + inserted.length;
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
  if (end - start + 1 > MAX_DELETE_LINES) {
    throw new Error(`Delete too large: ${end - start + 1} lines. Limit is ${MAX_DELETE_LINES}. Split the request or return a blocker instead of emitting a huge edit.`);
  }

  lines.splice(start - 1, end - start + 1);
  const nextContent = joinLines(lines, newline, hasFinalNewline && lines.length > 0);
  const signature = editSignature("delete_lines", filePath, { start, end });
  if (nextContent === original) {
    return recordNoOpEdit(signature, `No-op delete in ${relativeProjectPath(filePath)} lines ${start}-${end}: no content would be removed.`);
  }
  clearNoOpEdit(signature);
  validateTextForWrite(filePath, nextContent);
  const backupPath = createBackup(filePath);
  writeFileSync(filePath, nextContent, "utf8");
  markNeedsFreshRead(filePath);

  return [
    `Deleted ${end - start + 1} line(s) from ${relativeProjectPath(filePath)}.`,
    `Modified range: ${start}-${Math.max(start, lines.length)}.`,
    `Backup: ${relativeProjectPath(backupPath)}`
  ].join("\n");
}

function replaceLines({ file, start, end, lines: replacementLines }) {
  const filePath = resolveProjectPath(file);
  requireFreshRead(filePath);
  const original = readTextFile(filePath);
  const { lines, newline, hasFinalNewline } = splitLines(original);
  assertRange(start, end, lines.length);

  const replacement = normalizePhysicalLines(replacementLines);
  if (replacement.length === 0) {
    throw new Error("safe_replace_lines requires at least one replacement line. Use safe_delete_lines for pure deletion.");
  }
  if (replacement.length > MAX_REPLACE_LINES) {
    throw new Error(`Replace too large: ${replacement.length} lines. Limit is ${MAX_REPLACE_LINES}. Split the request or return a blocker instead of emitting a huge edit.`);
  }

  const nextLines = [...lines];
  nextLines.splice(start - 1, end - start + 1, ...replacement);
  const nextContent = joinLines(nextLines, newline, hasFinalNewline || replacement.length > 0);
  const signature = editSignature("replace_lines", filePath, { start, end, lines: replacement });
  if (nextContent === original) {
    return recordNoOpEdit(signature, `No-op replace in ${relativeProjectPath(filePath)} lines ${start}-${end}: replacement is identical to the current content.`);
  }
  clearNoOpEdit(signature);

  validateTextForWrite(filePath, nextContent);
  const backupPath = createBackup(filePath);
  writeFileSync(filePath, nextContent, "utf8");
  markNeedsFreshRead(filePath);

  const modifiedEnd = start + Math.max(replacement.length, 1) - 1;
  return [
    `Replaced line(s) ${start}-${end} in ${relativeProjectPath(filePath)} with ${replacement.length} line(s).`,
    `Modified range: ${start}-${modifiedEnd}.`,
    `Backup: ${relativeProjectPath(backupPath)}`
  ].join("\n");
}

function verifyFile({ file, start, end }) {
  const filePath = resolveProjectPath(file);
  const text = readTextFile(filePath);
  verifyHtmlStructure(filePath, text);
  const { lines } = splitLines(text);
  const first = start ?? 1;
  const requestedLast = end ?? lines.length;
  const last = Math.min(requestedLast, first + MAX_VERIFY_LINES - 1);

  if (!lines.length) {
    return "";
  }

  assertRange(first, requestedLast, lines.length);
  markFreshRead(filePath);
  const body = numberLines(lines.slice(first - 1, last), first);
  if (last < requestedLast) {
    return [
      `Showing lines ${first}-${last} of ${lines.length}. Output capped at ${MAX_VERIFY_LINES} lines; request a smaller explicit range for more.`,
      body
    ].join("\n");
  }
  return body;
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

function validateJsForWrite(filePath, text) {
  if (!/\.m?js$/i.test(filePath)) {
    return;
  }

  try {
    new vm.Script(text, { filename: relativeProjectPath(filePath) });
  } catch (error) {
    throw new Error(`JavaScript sanity check failed: ${error.message}`);
  }
}

function validateTextForWrite(filePath, text) {
  validateHtmlForWrite(filePath, text);
  validateJsForWrite(filePath, text);
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
      if (typeof parsed.file === "string") {
        validateRequestedFile(parsed.file);
      }
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
  "safe_insert_lines",
  `Insert up to ${MAX_INSERT_LINES} physical lines after a current 1-based line number after creating a backup. Use after=0 to insert at the top. Verify the file first, and verify again before any next line-number edit.`,
  {
    file: z.string().min(1),
    after: z.number().int().min(0),
    lines: z.array(z.string())
  },
  insertLines
);

registerTool(
  "safe_delete_lines",
  `Delete up to ${MAX_DELETE_LINES} lines in an inclusive 1-based line range after creating a backup. Use only line numbers from the current file state. If any previous write happened, verify the file again before deleting.`,
  fileRangeSchema,
  deleteLines
);

registerTool(
  "safe_replace_lines",
  `Replace one current inclusive 1-based line range with up to ${MAX_REPLACE_LINES} physical lines in one transactional write after creating a backup. This tool does not take or match old line text; use only start/end from safe_verify_file. JavaScript writes are syntax-checked before the file is changed.`,
  {
    file: z.string().min(1),
    start: z.number().int().min(1),
    end: z.number().int().min(1),
    lines: z.array(z.string())
  },
  replaceLines
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
      resolveProjectPath(path.join(projectRoot, "opencode.json"));
      throw new Error("Absolute path rejection self-test failed.");
    } catch (error) {
      if (!String(error.message).includes("Absolute file paths are not allowed")) {
        throw error;
      }
    }
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
    createFile({ file: selfTestFile, content: "one\ntwo\nthree\n" });
    if (!existsSync(selfTestPath)) {
      throw new Error("safe_create_file self-test failed.");
    }
    verifyFile({ file: selfTestFile });
    deleteLines({ file: selfTestFile, start: 2, end: 2 });
    try {
      insertLines({ file: selfTestFile, after: 1, lines: ["must fail before fresh read"] });
      throw new Error("stale line-number guard self-test failed.");
    } catch (error) {
      if (!String(error.message).includes("Line numbers") || !String(error.message).includes("stale")) {
        throw error;
      }
    }
    verifyFile({ file: selfTestFile });
    insertLines({ file: selfTestFile, after: 1, lines: ["inserted"] });
    verifyFile({ file: selfTestFile });
    const lineEditContent = readTextFile(selfTestPath);
    if (lineEditContent !== "one\ninserted\nthree\n") {
      throw new Error("safe line operation self-test failed.");
    }
    replaceLines({ file: selfTestFile, start: 2, end: 2, lines: ["two-a", "two-b"] });
    verifyFile({ file: selfTestFile });
    try {
      replaceLines({ file: selfTestFile, start: 1, end: 1, lines: [] });
      throw new Error("safe_replace_lines accepted an empty replacement.");
    } catch (error) {
      if (!String(error.message).includes("requires at least one replacement line")) {
        throw error;
      }
    }
    verifyFile({ file: selfTestFile });
    const replaceContent = readTextFile(selfTestPath);
    if (replaceContent !== "one\ntwo-a\ntwo-b\nthree\n") {
      throw new Error("safe_replace_lines self-test failed.");
    }
    try {
      insertLines({ file: selfTestFile, after: 3, lines: [] });
      insertLines({ file: selfTestFile, after: 3, lines: [] });
      throw new Error("safe_insert_lines no-op guard self-test failed.");
    } catch (error) {
      if (!String(error.message).includes("no-op edit")) {
        throw error;
      }
    }
    verifyFile({ file: selfTestFile });
    insertLines({ file: selfTestFile, after: 2, lines: ["extra write"] });
    verifyFile({ file: selfTestFile });
    rmSync(selfTestPath);
    const jsSelfTestFile = ".opencode/mcp/safe_edit/backups/self-test-replace.js";
    const jsSelfTestPath = resolveProjectPath(jsSelfTestFile);
    writeFileSync(jsSelfTestPath, "function ok() {\n  return 1;\n}\n", "utf8");
    verifyFile({ file: jsSelfTestFile });
    replaceLines({ file: jsSelfTestFile, start: 2, end: 2, lines: ["  return 2;"] });
    verifyFile({ file: jsSelfTestFile });
    try {
      replaceLines({ file: jsSelfTestFile, start: 1, end: 3, lines: ["function broken("] });
      throw new Error("safe_replace_lines JS validation self-test failed.");
    } catch (error) {
      if (!String(error.message).includes("JavaScript sanity check failed")) {
        throw error;
      }
      const unchanged = readTextFile(jsSelfTestPath);
      if (unchanged !== "function ok() {\n  return 2;\n}\n") {
        throw new Error("safe_replace_lines wrote invalid JavaScript before failing.");
      }
    } finally {
      rmSync(jsSelfTestPath);
    }
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
