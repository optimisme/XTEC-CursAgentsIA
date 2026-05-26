#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = realpathSync(path.resolve(serverDir, "../../.."));

const server = new McpServer({
  name: "java-check",
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

function checkJava({ files }) {
  const resolvedFiles = files.map((file) => {
    const filePath = resolveProjectPath(file);
    if (!existsSync(filePath)) {
      throw new Error(`File does not exist: ${file}`);
    }
    if (!filePath.endsWith(".java")) {
      throw new Error(`Not a Java source file: ${file}`);
    }
    return filePath;
  });

  try {
    execFileSync("javac", ["-version"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    throw new Error("javac is not available on PATH. Install a JDK or run Java validation in an environment with javac.");
  }

  const outputDir = mkdtempSync(path.join(os.tmpdir(), "java-check-"));
  try {
    mkdirSync(outputDir, { recursive: true });
    execFileSync("javac", ["-d", outputDir, ...resolvedFiles], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
    return `${files.join(", ")}: javac compilation OK.`;
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join("\n").trim();
    return `${files.join(", ")}: javac found issue(s):\n${output || error.message}`;
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
}

server.registerTool(
  "check_java",
  {
    description: "Compile one or more project-relative .java files with javac into a temporary directory, without writing class files into the project.",
    inputSchema: {
      files: z.array(z.string().min(1)).min(1)
    }
  },
  async (input) => {
    try {
      const parsed = z.object({ files: z.array(z.string().min(1)).min(1) }).parse(input || {});
      return textResult(checkJava(parsed));
    } catch (error) {
      return textResult(formatError(error));
    }
  }
);

async function main() {
  if (process.argv.includes("--self-test")) {
    const selfTestFile = ".opencode/mcp/java-check/SelfTest.java";
    const selfTestPath = resolveProjectPath(selfTestFile);
    writeFileSync(selfTestPath, "class SelfTest { public static void main(String[] args) { System.out.println(\"ok\"); } }\n", "utf8");
    try {
      const output = checkJava({ files: [selfTestFile] });
      if (!output.includes("compilation OK")) {
        throw new Error(output);
      }
    } finally {
      rmSync(selfTestPath, { force: true });
    }
    console.log("java-check self-test passed");
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
