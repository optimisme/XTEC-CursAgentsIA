#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = realpathSync(path.resolve(serverDir, "../../.."));
const endpoint = process.env.IMAGE_VISION_BASE_URL || "http://127.0.0.1:8002/v1/chat/completions";
const model = process.env.IMAGE_VISION_MODEL || "active-model";
const requireMultimodal = process.env.IMAGE_VISION_REQUIRE_MULTIMODAL !== "false";
const probeTimeoutMs = Number(process.env.IMAGE_VISION_PROBE_TIMEOUT_MS || 6000);
const greenProbePng = createSolidColorPngBase64(64, 64, [0, 255, 0]);

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
  const answer = await askVisionModel({
    prompt: userPrompt,
    imageDataUrl: `data:${image.mime};base64,${data}`,
    maxTokens: max_tokens ?? 200
  });

  return [
    `file: ${path.relative(projectRoot, image.path)}`,
    `model: ${model}`,
    `answer: ${answer.trim()}`
  ].join("\n");
}

async function askVisionModel({ prompt, imageDataUrl, maxTokens, signal }) {
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
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUrl } }
          ]
        }
      ],
      max_tokens: maxTokens,
      temperature: 0
    }),
    signal
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

  if (looksLikeVisionUnsupported(answer)) {
    throw new Error(`The configured model responded like a text-only model: ${answer.trim().slice(0, 300)}`);
  }

  return answer.trim();
}

function looksLikeVisionUnsupported(text) {
  return /cannot\s+(see|view|process|analy[sz]e)\s+images?|do not\s+(have|support)\s+(image|vision)|model does not support image|text-only/i.test(text);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  const result = Buffer.alloc(4);
  result.writeUInt32BE((~crc) >>> 0);
  return result;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  return Buffer.concat([length, name, data, crc32(Buffer.concat([name, data]))]);
}

function createSolidColorPngBase64(width, height, [red, green, blue]) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = 1 + x * 3;
      row[offset] = red;
      row[offset + 1] = green;
      row[offset + 2] = blue;
    }
    rows.push(row);
  }

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(Buffer.concat(rows))),
    pngChunk("IEND", Buffer.alloc(0))
  ]).toString("base64");
}

async function probeVisionSupport() {
  if (!requireMultimodal) {
    return true;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), probeTimeoutMs);
  try {
    const answer = await askVisionModel({
      prompt: "Inspect the attached solid-color image and answer with exactly one English color word. If you cannot inspect images, answer exactly NO_VISION.",
      imageDataUrl: `data:image/png;base64,${greenProbePng}`,
      maxTokens: 16,
      signal: controller.signal
    });
    return /\bGREEN\b/i.test(answer) && !/\bNO_VISION\b/i.test(answer);
  } catch (error) {
    console.error(`image_vision disabled: ${error?.message || String(error)}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function registerDescribeTool() {
  server.registerTool(
    "describe",
    {
      description: "Describe or answer a question about one project-local image using the local multimodal model. Use this only when the user references an explicit image path such as @pic.png.",
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
}

async function main() {
  if (process.argv.includes("--self-test")) {
    const supportsVision = await probeVisionSupport();
    if (!supportsVision) {
      throw new Error("image_vision self-test failed: configured model did not pass the multimodal probe.");
    }
    const testFile = path.join(projectRoot, "pic.png");
    if (!existsSync(testFile)) {
      console.log("image_vision self-test passed: multimodal probe succeeded; pic.png not found, file-description test skipped");
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

  if (await probeVisionSupport()) {
    registerDescribeTool();
  } else {
    console.error("image_vision disabled: configured model did not pass the multimodal probe.");
  }

  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
