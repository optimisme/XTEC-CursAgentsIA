import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOOL_DEFINITIONS } from "./tools.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadEnvSettings() {
  const envPath = path.resolve(__dirname, "settings.env");

  if (!fs.existsSync(envPath)) {
    console.warn(`Warning: settings.env not found at ${envPath}`);
    return;
  }

  const content = fs.readFileSync(envPath, "utf-8");
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed.slice(equalIndex + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] = value;
  }
}

export function validateEnv() {
  const missing = getMissingEnvVars();
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export function getMissingEnvVars() {
  const required = ["OPENAI_BASE_URL", "OPENAI_MODEL"];
  return required.filter((k) => !process.env[k]);
}

export function getModelSettings() {
  return {
    port: Number(process.env.PORT || 3000),
    baseUrl: process.env.OPENAI_BASE_URL,
    model: process.env.OPENAI_MODEL,
    timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS || 900000),
    maxTokens: Number(process.env.MAX_TOKENS || 700),
    temperature: Number(process.env.TEMPERATURE || 0.1),
  };
}

export async function callModel(messages, options = {}) {
  validateEnv();

  const settings = getModelSettings();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), settings.timeoutMs);
  const toolChoice = options.toolChoice || "auto";

  const body = {
    model: settings.model,
    messages,
    tools: TOOL_DEFINITIONS,
    tool_choice: toolChoice,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
  };

  console.log("REQUEST SENT TO MODEL");

  try {
    const headers = {
      "Content-Type": "application/json",
    };

    if (process.env.OPENAI_API_KEY) {
      headers.Authorization = `Bearer ${process.env.OPENAI_API_KEY}`;
    }

    const response = await fetch(settings.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}: ${text}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`API error: invalid JSON response: ${text}`);
    }

    console.log("MODEL RESPONSE");
    return data.choices?.[0]?.message;
  } finally {
    clearTimeout(timeout);
  }
}
