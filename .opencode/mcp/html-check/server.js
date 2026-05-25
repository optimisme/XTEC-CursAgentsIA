#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = realpathSync(path.resolve(serverDir, "../../.."));
const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

const server = new McpServer({
  name: "html-check",
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

function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

function checkTags(html) {
  const stack = [];
  const errors = [];
  const tagPattern = /<\/?([a-zA-Z][\w:-]*)(?:\s[^>]*)?>/g;

  for (const match of stripComments(html).matchAll(tagPattern)) {
    const full = match[0];
    const tag = match[1].toLowerCase();
    if (voidTags.has(tag) || full.endsWith("/>")) continue;

    if (full.startsWith("</")) {
      const open = stack.pop();
      if (open !== tag) {
        errors.push(`Unexpected closing tag </${tag}>; expected ${open ? `</${open}>` : "no closing tag"}.`);
      }
      continue;
    }

    stack.push(tag);
  }

  while (stack.length) {
    errors.push(`Missing closing tag </${stack.pop()}>.`);
  }

  return errors;
}

function checkInlineScripts(html) {
  const errors = [];
  const scriptPattern = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let index = 0;

  for (const match of html.matchAll(scriptPattern)) {
    index += 1;
    try {
      new vm.Script(match[1], { filename: `inline-script-${index}.js` });
    } catch (error) {
      errors.push(`Inline script ${index} syntax error: ${error.message}`);
    }
  }

  return errors;
}

function localAssetPath(htmlFilePath, rawSrc) {
  if (!rawSrc || /^(?:https?:)?\/\//i.test(rawSrc) || rawSrc.startsWith("data:")) {
    return null;
  }

  const withoutHash = rawSrc.split("#", 1)[0];
  const withoutQuery = withoutHash.split("?", 1)[0];
  if (!withoutQuery) {
    return null;
  }

  return resolveProjectPath(path.join(path.dirname(path.relative(projectRoot, htmlFilePath)), withoutQuery));
}

function checkExternalScripts(html, htmlFilePath) {
  const errors = [];
  const scriptPattern = /<script\b([^>]*)>\s*<\/script>/gi;
  let index = 0;

  for (const match of html.matchAll(scriptPattern)) {
    const attrs = match[1] || "";
    const srcMatch = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs);
    if (!srcMatch) continue;

    index += 1;
    const scriptPath = localAssetPath(htmlFilePath, srcMatch[1]);
    if (!scriptPath) continue;

    if (!existsSync(scriptPath)) {
      errors.push(`External script ${index} is missing: ${srcMatch[1]}`);
      continue;
    }

    try {
      new vm.Script(readFileSync(scriptPath, "utf8"), { filename: relativeProjectPath(scriptPath) });
    } catch (error) {
      errors.push(`External script ${srcMatch[1]} syntax error: ${error.message}`);
    }
  }

  return errors;
}

function checkLocalStylesheets(html, htmlFilePath) {
  const errors = [];
  const linkPattern = /<link\b([^>]*)>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const attrs = match[1] || "";
    if (!/\brel\s*=\s*["']?stylesheet["']?/i.test(attrs)) continue;

    const hrefMatch = /\bhref\s*=\s*["']([^"']+)["']/i.exec(attrs);
    if (!hrefMatch) continue;

    const stylesheetPath = localAssetPath(htmlFilePath, hrefMatch[1]);
    if (stylesheetPath && !existsSync(stylesheetPath)) {
      errors.push(`Stylesheet is missing: ${hrefMatch[1]}`);
    }
  }

  return errors;
}

function relativeProjectPath(filePath) {
  return path.relative(projectRoot, filePath) || ".";
}

function checkHtmlJs({ file }) {
  const filePath = resolveProjectPath(file);
  if (!existsSync(filePath)) {
    return `${file}: file does not exist. Create it first with safe-edit_safe_create_file_from_lines, then run html-check_check_html_js again.`;
  }

  const html = readFileSync(filePath, "utf8");
  const errors = [
    ...checkTags(html),
    ...checkInlineScripts(html),
    ...checkExternalScripts(html, filePath),
    ...checkLocalStylesheets(html, filePath)
  ];

  if (!errors.length) {
    return `${file}: basic HTML structure, linked local assets, and JavaScript syntax look OK.`;
  }

  return `${file}: found ${errors.length} issue(s):\n${errors.map((error) => `- ${error}`).join("\n")}`;
}

server.registerTool(
  "check_html_js",
  {
    description: "Check a project HTML file for basic tag balance, local linked asset existence, and inline/external JavaScript syntax errors.",
    inputSchema: {
      file: z.string().min(1)
    }
  },
  async (input) => {
    try {
      const parsed = z.object({ file: z.string().min(1) }).parse(input || {});
      return textResult(checkHtmlJs(parsed));
    } catch (error) {
      return textResult(formatError(error));
    }
  }
);

async function main() {
  if (process.argv.includes("--self-test")) {
    const selfTestFile = ".opencode/mcp/html-check/self-test.html";
    const selfTestScriptFile = ".opencode/mcp/html-check/self-test.js";
    const selfTestPath = resolveProjectPath(selfTestFile);
    const selfTestScriptPath = resolveProjectPath(selfTestScriptFile);
    writeFileSync(selfTestScriptPath, "const externalOk = true;\n", "utf8");
    writeFileSync(selfTestPath, "<!DOCTYPE html><html><body><script>const ok = true;</script><script src=\"self-test.js\"></script></body></html>\n", "utf8");
    const output = checkHtmlJs({ file: selfTestFile });
    rmSync(selfTestPath);
    rmSync(selfTestScriptPath);
    if (!output.includes("look OK")) {
      throw new Error(output);
    }
    console.log("html-check self-test passed");
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
