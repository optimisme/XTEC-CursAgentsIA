#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(serverDir, "../../..");
const memoryRoot = path.resolve(projectRoot, process.env.MEMORY_DIR || "memory");
const readableExtensions = new Set([".md", ".txt", ".json", ".jsonl"]);

const server = new McpServer({
  name: "memory",
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

function ensureMemoryRoot() {
  mkdirSync(memoryRoot, { recursive: true });
}

function isInsideMemory(target) {
  const relative = path.relative(memoryRoot, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveMemoryPath(file) {
  const normalized = path.normalize(file);
  if (path.isAbsolute(normalized)) {
    throw new Error("Use memory-relative paths, not absolute paths.");
  }

  const target = path.resolve(memoryRoot, normalized);
  if (!isInsideMemory(target)) {
    throw new Error(`Path escapes the memory directory: ${file}`);
  }

  return target;
}

function listMemoryFiles(dir = memoryRoot) {
  if (!existsSync(dir)) return [];

  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMemoryFiles(fullPath));
      continue;
    }

    if (entry.isFile() && readableExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function relativeMemoryPath(filePath) {
  return path.relative(memoryRoot, filePath);
}

function searchMemory({ query, limit }) {
  ensureMemoryRoot();
  const needle = query.trim().toLowerCase();
  if (!needle) {
    throw new Error("query cannot be empty.");
  }

  const matches = [];
  for (const filePath of listMemoryFiles()) {
    const text = readFileSync(filePath, "utf8");
    const lower = text.toLowerCase();
    const index = lower.indexOf(needle);
    if (index === -1) continue;

    const start = Math.max(0, index - 120);
    const end = Math.min(text.length, index + needle.length + 180);
    matches.push({
      file: relativeMemoryPath(filePath),
      excerpt: text.slice(start, end).replace(/\s+/g, " ").trim()
    });
  }

  if (!matches.length) return `No memory found for: ${query}`;

  return matches
    .slice(0, limit)
    .map((match) => `- ${match.file}: ${match.excerpt}`)
    .join("\n");
}

function readMemory({ file }) {
  ensureMemoryRoot();
  const filePath = resolveMemoryPath(file);
  if (!existsSync(filePath)) {
    throw new Error(`Memory file does not exist: ${file}`);
  }
  return readFileSync(filePath, "utf8");
}

function writeMemory({ file, content, overwrite }) {
  ensureMemoryRoot();
  const filePath = resolveMemoryPath(file);
  if (existsSync(filePath) && !overwrite) {
    throw new Error(`Memory file already exists: ${file}. Use memory_update or set overwrite to true.`);
  }

  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
  return `Wrote memory: ${file}`;
}

function updateMemory({ file, content }) {
  ensureMemoryRoot();
  const filePath = resolveMemoryPath(file);
  if (!existsSync(filePath)) {
    throw new Error(`Memory file does not exist: ${file}`);
  }

  writeFileSync(filePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
  return `Updated memory: ${file}`;
}

function forgetMemory({ file }) {
  ensureMemoryRoot();
  const filePath = resolveMemoryPath(file);
  if (!existsSync(filePath)) {
    throw new Error(`Memory file does not exist: ${file}`);
  }

  rmSync(filePath, { force: true });
  return `Forgot memory: ${file}`;
}

function summarizeSession({ title, summary, decisions, followUps }) {
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "session";
  const date = new Date().toISOString().slice(0, 10);
  const file = `session-summaries/${date}-${safeTitle}.md`;
  const content = [
    `# ${title}`,
    "",
    `Date: ${date}`,
    "",
    "## Summary",
    "",
    summary,
    "",
    "## Decisions",
    "",
    ...(decisions.length ? decisions.map((item) => `- ${item}`) : ["- None recorded."]),
    "",
    "## Follow-ups",
    "",
    ...(followUps.length ? followUps.map((item) => `- ${item}`) : ["- None recorded."])
  ].join("\n");

  return writeMemory({ file, content, overwrite: true });
}

server.registerTool(
  "memory_search",
  {
    description: "Search curated project memory by query.",
    inputSchema: {
      query: z.string().min(1),
      limit: z.number().int().min(1).max(20).default(5)
    }
  },
  async (input) => {
    try {
      const parsed = z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(20).default(5)
      }).parse(input || {});
      return textResult(searchMemory(parsed));
    } catch (error) {
      return textResult(formatError(error));
    }
  }
);

server.registerTool(
  "memory_read",
  {
    description: "Read one memory file by memory-relative path.",
    inputSchema: {
      file: z.string().min(1)
    }
  },
  async (input) => {
    try {
      const parsed = z.object({ file: z.string().min(1) }).parse(input || {});
      return textResult(readMemory(parsed));
    } catch (error) {
      return textResult(formatError(error));
    }
  }
);

server.registerTool(
  "memory_write",
  {
    description: "Create a new memory file. Use overwrite only when the user explicitly wants replacement.",
    inputSchema: {
      file: z.string().min(1),
      content: z.string(),
      overwrite: z.boolean().default(false)
    }
  },
  async (input) => {
    try {
      const parsed = z.object({
        file: z.string().min(1),
        content: z.string(),
        overwrite: z.boolean().default(false)
      }).parse(input || {});
      return textResult(writeMemory(parsed));
    } catch (error) {
      return textResult(formatError(error));
    }
  }
);

server.registerTool(
  "memory_update",
  {
    description: "Replace an existing memory file.",
    inputSchema: {
      file: z.string().min(1),
      content: z.string()
    }
  },
  async (input) => {
    try {
      const parsed = z.object({ file: z.string().min(1), content: z.string() }).parse(input || {});
      return textResult(updateMemory(parsed));
    } catch (error) {
      return textResult(formatError(error));
    }
  }
);

server.registerTool(
  "memory_forget",
  {
    description: "Delete one memory file.",
    inputSchema: {
      file: z.string().min(1)
    }
  },
  async (input) => {
    try {
      const parsed = z.object({ file: z.string().min(1) }).parse(input || {});
      return textResult(forgetMemory(parsed));
    } catch (error) {
      return textResult(formatError(error));
    }
  }
);

server.registerTool(
  "memory_summarize_session",
  {
    description: "Create a curated session summary memory file.",
    inputSchema: {
      title: z.string().min(1),
      summary: z.string().min(1),
      decisions: z.array(z.string()).default([]),
      followUps: z.array(z.string()).default([])
    }
  },
  async (input) => {
    try {
      const parsed = z.object({
        title: z.string().min(1),
        summary: z.string().min(1),
        decisions: z.array(z.string()).default([]),
        followUps: z.array(z.string()).default([])
      }).parse(input || {});
      return textResult(summarizeSession(parsed));
    } catch (error) {
      return textResult(formatError(error));
    }
  }
);

async function main() {
  if (process.argv.includes("--self-test")) {
    ensureMemoryRoot();
    const output = searchMemory({ query: "project", limit: 3 });
    if (!output) throw new Error("memory_search returned an empty response.");
    console.log("memory self-test passed");
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
