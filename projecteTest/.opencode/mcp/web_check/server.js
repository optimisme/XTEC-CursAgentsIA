#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import * as csstree from "css-tree";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = realpathSync(path.resolve(serverDir, "../../.."));
const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

const server = new McpServer({
  name: "web_check",
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

function checkCssSyntax(css, filename) {
  try {
    csstree.parse(css, { filename, positions: true });
    return [];
  } catch (error) {
    const location = error?.line && error?.column ? ` at ${error.line}:${error.column}` : "";
    return [`${filename} CSS syntax error${location}: ${error.message}`];
  }
}

function checkInlineStyles(html) {
  const errors = [];
  const stylePattern = /<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi;
  let index = 0;

  for (const match of html.matchAll(stylePattern)) {
    index += 1;
    errors.push(...checkCssSyntax(match[1], `inline-style-${index}.css`));
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
    if (!stylesheetPath) continue;

    if (!existsSync(stylesheetPath)) {
      errors.push(`Stylesheet is missing: ${hrefMatch[1]}`);
      continue;
    }

    errors.push(...checkCssSyntax(readFileSync(stylesheetPath, "utf8"), relativeProjectPath(stylesheetPath)));
  }

  return errors;
}

function relativeProjectPath(filePath) {
  return path.relative(projectRoot, filePath) || ".";
}

function formatCheckResult(file, errors, okMessage) {
  if (!errors.length) {
    return `${file}: ${okMessage}`;
  }

  return `${file}: found ${errors.length} issue(s):\n${errors.map((error) => `- ${error}`).join("\n")}`;
}

function checkJsSyntax(js, filename) {
  try {
    new vm.Script(js, { filename });
    return [];
  } catch (error) {
    return [`${filename} JavaScript syntax error: ${error.message}`];
  }
}

function checkWeb({ file }) {
  const filePath = resolveProjectPath(file);
  if (!existsSync(filePath)) {
    return `${file}: file does not exist. Create it first, then run web_check_check_web again.`;
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".css") {
    return formatCheckResult(file, checkCssSyntax(readFileSync(filePath, "utf8"), relativeProjectPath(filePath)), "CSS syntax looks OK.");
  }

  if (ext === ".js") {
    return formatCheckResult(file, checkJsSyntax(readFileSync(filePath, "utf8"), relativeProjectPath(filePath)), "JavaScript syntax looks OK.");
  }

  const html = readFileSync(filePath, "utf8");
  const errors = [
    ...checkTags(html),
    ...checkInlineScripts(html),
    ...checkInlineStyles(html),
    ...checkExternalScripts(html, filePath),
    ...checkLocalStylesheets(html, filePath)
  ];

  return formatCheckResult(file, errors, "basic HTML structure, linked local assets, JavaScript syntax, and CSS syntax look OK.");
}

server.registerTool(
  "check_web",
  {
    description: "Check a project HTML, CSS, or JavaScript file. HTML checks also follow linked local CSS and JS.",
    inputSchema: {
      file: z.string().min(1)
    }
  },
  async (input) => {
    try {
      const parsed = z.object({ file: z.string().min(1) }).parse(input || {});
      return textResult(checkWeb(parsed));
    } catch (error) {
      return textResult(formatError(error));
    }
  }
);

async function main() {
  if (process.argv.includes("--self-test")) {
    const selfTestFile = ".opencode/mcp/web_check/self-test.html";
    const selfTestScriptFile = ".opencode/mcp/web_check/self-test.js";
    const selfTestCssFile = ".opencode/mcp/web_check/self-test.css";
    const selfTestPath = resolveProjectPath(selfTestFile);
    const selfTestScriptPath = resolveProjectPath(selfTestScriptFile);
    const selfTestCssPath = resolveProjectPath(selfTestCssFile);
    writeFileSync(selfTestScriptPath, "const externalOk = true;\n", "utf8");
    writeFileSync(selfTestCssPath, ".external-ok { color: rebeccapurple; }\n", "utf8");
    writeFileSync(selfTestPath, "<!DOCTYPE html><html><head><link rel=\"stylesheet\" href=\"self-test.css\"><style>.inline-ok { display: block; }</style></head><body><script>const ok = true;</script><script src=\"self-test.js\"></script></body></html>\n", "utf8");
    const output = checkWeb({ file: selfTestFile });
    const scriptOutput = checkWeb({ file: selfTestScriptFile });
    const cssOutput = checkWeb({ file: selfTestCssFile });
    rmSync(selfTestPath);
    rmSync(selfTestScriptPath);
    rmSync(selfTestCssPath);
    const combinedOutput = `${output}\n${scriptOutput}\n${cssOutput}`;
    if (!combinedOutput.includes("basic HTML") || !combinedOutput.includes("JavaScript syntax looks OK") || !combinedOutput.includes("CSS syntax looks OK")) {
      throw new Error(combinedOutput);
    }
    console.log("web_check self-test passed");
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
