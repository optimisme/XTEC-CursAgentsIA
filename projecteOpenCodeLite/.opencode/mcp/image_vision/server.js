#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = realpathSync(path.resolve(serverDir, "../../.."));
const endpoint = process.env.IMAGE_VISION_BASE_URL || "http://127.0.0.1:8002/v1/chat/completions";
const model = process.env.IMAGE_VISION_MODEL || "active-model";

const mimeByExtension = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"]
]);

const server = new McpServer({
  name: "image_vision",
  version: "1.0.0"
});

function textResult(text) {
  return { content: [{ type: "text", text }] };
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
  if (/[{}[\]"'\r\n\t]/.test(file) || /<\||\|>|tool_call|<channel/i.test(file)) {
    throw new Error(`Rejected suspicious file path: ${file}`);
  }
}

function normalizeRequestedFile(file) {
  return file.trim().replace(/^@+/, "");
}

function resolveProjectImage(file) {
  validateRequestedFile(file);
  const normalizedFile = normalizeRequestedFile(file);
  const target = path.resolve(projectRoot, path.normalize(normalizedFile));
  if (!existsSync(target)) {
    throw new Error(`Image file does not exist: ${normalizedFile}`);
  }

  const realTarget = realpathSync(target);
  if (!isInsideRoot(realTarget)) {
    throw new Error(`Path escapes the project root: ${normalizedFile}`);
  }

  const ext = path.extname(realTarget).toLowerCase();
  const mime = mimeByExtension.get(ext);
  if (!mime) {
    throw new Error(`Unsupported image type: ${ext || "none"}. Use png, jpg, jpeg, webp, or gif.`);
  }

  return { path: realTarget, mime };
}

async function describeImage({ file, prompt, max_tokens }) {
  const image = resolveProjectImage(file);
  const data = readFileSync(image.path).toString("base64");
  const userPrompt = prompt?.trim() || "Describe this image briefly.";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer local"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: `data:${image.mime};base64,${data}` } }
          ]
        }
      ],
      max_tokens: max_tokens ?? 200,
      temperature: 0
    })
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Vision request failed with HTTP ${response.status}: ${text.slice(0, 1000)}`);
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Vision response was not JSON: ${text.slice(0, 1000)}`);
  }

  const answer = payload?.choices?.[0]?.message?.content;
  if (!answer) {
    throw new Error(`Vision response did not contain assistant content: ${text.slice(0, 1000)}`);
  }

  return [
    `file: ${path.relative(projectRoot, image.path)}`,
    `model: ${model}`,
    `answer: ${answer.trim()}`
  ].join("\n");
}

server.registerTool(
  "describe",
  {
    description: "Describe or answer a question about one project-local image using the local multimodal model. Use this when the user references an image path such as @pic.png.",
    inputSchema: {
      file: z.string().min(1),
      prompt: z.string().optional(),
      max_tokens: z.number().int().min(16).max(1024).optional()
    }
  },
  async (input) => {
    try {
      const parsed = z.object({
        file: z.string().min(1),
        prompt: z.string().optional(),
        max_tokens: z.number().int().min(16).max(1024).optional()
      }).parse(input || {});
      return textResult(await describeImage(parsed));
    } catch (error) {
      return textResult(formatError(error));
    }
  }
);

async function main() {
  if (process.argv.includes("--self-test")) {
    const testFile = path.join(projectRoot, "pic.png");
    if (!existsSync(testFile)) {
      console.log("image_vision self-test skipped: pic.png not found");
      return;
    }
    const output = await describeImage({
      file: "pic.png",
      prompt: "Describe this image in five words.",
      max_tokens: 40
    });
    if (!output.includes("answer:")) {
      throw new Error(output);
    }
    console.log("image_vision self-test passed");
    return;
  }

  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
