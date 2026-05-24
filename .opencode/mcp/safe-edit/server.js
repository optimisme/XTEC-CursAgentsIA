#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = realpathSync(path.resolve(serverDir, "../../.."));
const backupDir = path.join(serverDir, "backups");

const fileRangeSchema = {
  file: z.string().min(1),
  start: z.number().int().min(1),
  end: z.number().int().min(1)
};

const server = new McpServer({
  name: "safe-edit",
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

function resolveProjectPath(file) {
  const normalized = path.normalize(file);
  const target = path.resolve(projectRoot, normalized);
  const checkedTarget = existsSync(target) ? realpathSync(target) : target;

  if (!isInsideRoot(checkedTarget)) {
    throw new Error(`Path escapes the project root: ${file}`);
  }

  return checkedTarget;
}

function relativeProjectPath(filePath) {
  return path.relative(projectRoot, filePath) || ".";
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

function createFile({ file, content }) {
  const filePath = resolveProjectPath(file);

  if (existsSync(filePath)) {
    throw new Error(`File already exists: ${relativeProjectPath(filePath)}. Use safe_replace_lines or safe_apply_patch for existing files.`);
  }

  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");

  return [
    `Created ${relativeProjectPath(filePath)}.`,
    "Backup: none needed for new file"
  ].join("\n");
}

function createFileFromLines({ file, lines }) {
  return createFile({ file, content: `${lines.join("\n")}\n` });
}

function appendLines({ file, lines }) {
  const filePath = resolveProjectPath(file);

  if (!existsSync(filePath)) {
    throw new Error(`File does not exist: ${relativeProjectPath(filePath)}. Create it first with safe_create_file or safe_create_file_from_lines.`);
  }

  const original = readTextFile(filePath);
  const { lines: existing, newline, hasFinalNewline } = splitLines(original);
  const backupPath = createBackup(filePath);
  existing.push(...lines);
  writeEditedFile(filePath, existing, newline, hasFinalNewline || lines.length > 0);

  const start = existing.length - lines.length + 1;
  return [
    `Appended ${lines.length} line(s) to ${relativeProjectPath(filePath)}.`,
    `Modified range: ${lines.length ? `${start}-${existing.length}` : "none"}.`,
    `Backup: ${relativeProjectPath(backupPath)}`
  ].join("\n");
}

function readRange({ file, start, end }) {
  const filePath = resolveProjectPath(file);
  const { lines } = splitLines(readTextFile(filePath));
  const adjustedEnd = Math.min(end, lines.length);
  assertRange(start, adjustedEnd, lines.length);
  const prefix = adjustedEnd === end ? "" : `Requested end ${end} adjusted to file end ${lines.length}.\n`;
  return `${prefix}${numberLines(lines.slice(start - 1, adjustedEnd), start)}`;
}

function replaceLines({ file, start, end, content }) {
  const filePath = resolveProjectPath(file);
  const original = readTextFile(filePath);
  const { lines, newline, hasFinalNewline } = splitLines(original);
  assertRange(start, end, lines.length);

  const backupPath = createBackup(filePath);
  const replacement = normalizeContent(content, newline);
  lines.splice(start - 1, end - start + 1, ...replacement);
  writeEditedFile(filePath, lines, newline, hasFinalNewline);

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
  const original = readTextFile(filePath);
  const { lines, newline, hasFinalNewline } = splitLines(original);

  if (line < 0 || line > lines.length) {
    throw new Error(`Line ${line} is outside the insert range 0-${lines.length}.`);
  }

  const backupPath = createBackup(filePath);
  const inserted = normalizeContent(content, newline);
  lines.splice(line, 0, ...inserted);
  writeEditedFile(filePath, lines, newline, hasFinalNewline || inserted.length > 0);

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
  const original = readTextFile(filePath);
  const { lines, newline, hasFinalNewline } = splitLines(original);
  assertRange(start, end, lines.length);

  const backupPath = createBackup(filePath);
  lines.splice(start - 1, end - start + 1);
  writeEditedFile(filePath, lines, newline, hasFinalNewline && lines.length > 0);

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

  return [
    `Applied patch to ${files.length} file(s): ${files.join(", ")}`,
    backups.length ? `Backups: ${backups.join(", ")}` : "Backups: none needed for new files"
  ].join("\n");
}

function verifyFile({ file, start, end }) {
  const filePath = resolveProjectPath(file);
  const { lines } = splitLines(readTextFile(filePath));
  const first = start ?? 1;
  const last = end ?? lines.length;

  if (!lines.length) {
    return "";
  }

  assertRange(first, last, lines.length);
  return numberLines(lines.slice(first - 1, last), first);
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
  "Create a new UTF-8 text file from an array of lines. Fails if the file already exists.",
  {
    file: z.string().min(1),
    lines: z.array(z.string())
  },
  createFileFromLines
);

registerTool(
  "safe_append_lines",
  "Append an array of lines to an existing UTF-8 text file after creating a backup.",
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
  "Replace an inclusive 1-based line range after creating a backup.",
  {
    ...fileRangeSchema,
    content: z.string()
  },
  replaceLines
);

registerTool(
  "safe_insert_after",
  "Insert content after the given 1-based line number after creating a backup. Use line 0 to insert at the top.",
  {
    file: z.string().min(1),
    line: z.number().int().min(0),
    content: z.string()
  },
  insertAfter
);

registerTool(
  "safe_delete_lines",
  "Delete an inclusive 1-based line range after creating a backup.",
  fileRangeSchema,
  deleteLines
);

registerTool(
  "safe_apply_patch",
  "Validate a unified diff with git apply --check, then apply it and back up touched existing files.",
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
    const selfTestFile = ".opencode/mcp/safe-edit/backups/self-test-create.txt";
    const selfTestPath = resolveProjectPath(selfTestFile);
    if (existsSync(selfTestPath)) {
      rmSync(selfTestPath);
    }
    createFile({ file: selfTestFile, content: "safe-edit create self-test\n" });
    if (!existsSync(selfTestPath)) {
      throw new Error("safe_create_file self-test failed.");
    }
    appendLines({ file: selfTestFile, lines: ["append"] });
    const selfTestContent = readTextFile(selfTestPath);
    if (!selfTestContent.includes("append")) {
      throw new Error("safe_append_lines self-test failed.");
    }
    rmSync(selfTestPath);
    console.log("safe-edit self-test passed");
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
