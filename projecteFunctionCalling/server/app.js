import express from "express";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const settings = await loadSettings(path.join(rootDir, "settings.env"));
const PORT = Number(settings.PORT || 3000);
const VLLM_BASE_URL = stripTrailingSlash(settings.VLLM_BASE_URL || "http://127.0.0.1:8002/v1");
const VLLM_API_KEY = settings.VLLM_API_KEY || "local";
const VLLM_MODEL = settings.VLLM_MODEL || "gemma4-8b-local";
const VLLM_TIMEOUT_MS = Number(settings.VLLM_TIMEOUT_MS || 900000);
const MAX_TOKENS = Number(settings.MAX_TOKENS || 700);
const TEMPERATURE = Number(settings.TEMPERATURE || 0.1);
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const drawingTools = [
  tool("draw_line", "Draws a straight line on the canvas.", {
    x1: randomizableNumberProperty("Initial X coordinate in pixels."),
    y1: randomizableNumberProperty("Initial Y coordinate in pixels."),
    x2: randomizableNumberProperty("Final X coordinate in pixels."),
    y2: randomizableNumberProperty("Final Y coordinate in pixels."),
    color: cssColorProperty("Line color."),
    width: randomizableNumberProperty("Line width in pixels.")
  }),
  tool("draw_circle", "Draws a circle on the canvas.", {
    x: centerXProperty(),
    y: centerYProperty(),
    radius: randomizableNumberProperty("Radius in pixels."),
    ...shapeStyleProperties()
  }),
  tool("draw_rectangle", "Draws a rectangle on the canvas.", {
    x: topLeftXProperty(),
    y: topLeftYProperty(),
    width: randomizableNumberProperty("Width in pixels."),
    height: randomizableNumberProperty("Height in pixels."),
    ...shapeStyleProperties()
  }),
  tool("draw_square", "Draws a square on the canvas.", {
    x: topLeftXProperty(),
    y: topLeftYProperty(),
    size: randomizableNumberProperty("Side length in pixels."),
    ...shapeStyleProperties()
  }),
  tool("draw_oval", "Draws an oval or ellipse on the canvas.", {
    x: centerXProperty(),
    y: centerYProperty(),
    radiusX: randomizableNumberProperty("Horizontal radius in pixels."),
    radiusY: randomizableNumberProperty("Vertical radius in pixels."),
    ...shapeStyleProperties()
  }),
  tool("draw_triangle", "Draws an approximately equilateral triangle on the canvas.", {
    x: centerXProperty(),
    y: centerYProperty(),
    size: randomizableNumberProperty("Approximate triangle size in pixels."),
    rotation: randomizableNumberProperty("Rotation in degrees."),
    ...shapeStyleProperties()
  }),
  tool("draw_star", "Draws a star on the canvas.", {
    x: centerXProperty(),
    y: centerYProperty(),
    outerRadius: randomizableNumberProperty("Outer radius in pixels."),
    innerRadius: randomizableNumberProperty("Inner radius in pixels."),
    points: randomizableNumberProperty("Number of points, normally 5."),
    rotation: randomizableNumberProperty("Rotation in degrees."),
    ...shapeStyleProperties()
  }),
  tool("set_canvas_background", "Changes the canvas background color.", {
    color: cssColorProperty("Canvas background color.")
  }),
  tool("clear_canvas", "Clears the canvas when the user requests it.", {})
];

const systemPrompt = `You are a drawing assistant. The user may write in any language.
First translate and normalize the user's drawing request internally into English, then decide which function calls to make.
Use function calling to draw on the canvas.

Logical canvas size: 800x600 pixels. Origin (0,0) is the top-left corner.
Available shapes: line, circle, rectangle, square, oval/ellipse, triangle, and star.
Shapes with an area can use fillColor for the interior/background, strokeColor for the outline/relief, and strokeWidth for outline thickness.
If the user asks to change the drawing or canvas background color, call set_canvas_background.
If the user asks for the center of the drawing, use x=400 and y=300.
For numeric arguments not provided by the user, return the string "random" instead of inventing a number. The server will replace "random" with a valid random value inside the canvas.
If the user says "size N pixels" for relief, border, outline, or stroke, interpret it as strokeWidth=N.
All function argument values should be normalized to English conventions.
Color arguments must always be valid CSS colors in English or hexadecimal. Do not return non-English color names in function arguments.
If the request is not about drawing, answer briefly without using tools.`;

app.get("/api/settings", (_req, res) => {
  res.json({
    port: PORT,
    model: VLLM_MODEL,
    baseUrl: VLLM_BASE_URL
  });
});

app.post("/api/chat", async (req, res, next) => {
  try {
    const userMessage = String(req.body?.message || "").trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!userMessage) {
      return res.status(400).json({ error: "The message cannot be empty." });
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...history
        .filter((message) => ["user", "assistant"].includes(message?.role) && typeof message.content === "string")
        .slice(-12),
      { role: "user", content: userMessage }
    ];

    const completion = await callVllm(messages);
    const assistantMessage = completion?.choices?.[0]?.message || {};
    const toolCalls = Array.isArray(assistantMessage.tool_calls) ? assistantMessage.tool_calls : [];
    const modelToolCalls = toolCalls.map(formatModelToolCall).filter(Boolean);
    const commands = toolCalls.map(normalizeToolCall).filter(Boolean);

    if (commands.length > 0) {
      return res.json({
        reply: buildDrawingReply(commands),
        commands,
        modelToolCalls
      });
    }

    const parsedCommands = parseCommandsFromText(assistantMessage.content || "");
    if (parsedCommands.length > 0) {
      return res.json({
        reply: buildDrawingReply(parsedCommands),
        commands: parsedCommands,
        modelToolCalls
      });
    }

    res.json({
      reply: assistantMessage.content || "I could not convert that request into a drawing.",
      commands: [],
      modelToolCalls
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`Server available at http://localhost:${PORT}`);
  console.log(`Configured model: ${VLLM_MODEL} (${VLLM_BASE_URL})`);
});

async function callVllm(messages) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VLLM_TIMEOUT_MS);

  try {
    const response = await fetch(`${VLLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VLLM_API_KEY}`
      },
      body: JSON.stringify({
        model: VLLM_MODEL,
        messages,
        tools: drawingTools,
        tool_choice: "auto",
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS
      }),
      signal: controller.signal
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`vLLM returned HTTP ${response.status}: ${text}`);
    }

    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeToolCall(toolCall) {
  const name = toolCall?.function?.name;
  const rawArgs = toolCall?.function?.arguments || "{}";
  let args;

  try {
    args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
  } catch {
    return null;
  }

  if (!name || typeof args !== "object" || args === null) {
    return null;
  }

  if (name === "draw_line") {
    return {
      type: "line",
      x1: numberOr(args.x1, randomInt(20, CANVAS_WIDTH - 20)),
      y1: numberOr(args.y1, randomInt(20, CANVAS_HEIGHT - 20)),
      x2: numberOr(args.x2, randomInt(20, CANVAS_WIDTH - 20)),
      y2: numberOr(args.y2, randomInt(20, CANVAS_HEIGHT - 20)),
      color: cssColor(args.color, "black"),
      width: numberOr(args.width, randomInt(2, 8))
    };
  }

  if (name === "draw_circle") {
    const radius = numberOr(args.radius, randomInt(35, 105));
    return {
      type: "circle",
      x: numberOr(args.x, randomInt(radius + 10, CANVAS_WIDTH - radius - 10)),
      y: numberOr(args.y, randomInt(radius + 10, CANVAS_HEIGHT - radius - 10)),
      radius,
      ...normalizeShapeStyle(args)
    };
  }

  if (name === "draw_rectangle") {
    const width = numberOr(args.width, randomInt(90, 240));
    const height = numberOr(args.height, randomInt(60, 180));
    return {
      type: "rectangle",
      x: numberOr(args.x, randomInt(10, CANVAS_WIDTH - width - 10)),
      y: numberOr(args.y, randomInt(10, CANVAS_HEIGHT - height - 10)),
      width,
      height,
      ...normalizeShapeStyle(args)
    };
  }

  if (name === "draw_square") {
    const size = numberOr(args.size, randomInt(70, 180));
    return {
      type: "square",
      x: numberOr(args.x, randomInt(10, CANVAS_WIDTH - size - 10)),
      y: numberOr(args.y, randomInt(10, CANVAS_HEIGHT - size - 10)),
      size,
      ...normalizeShapeStyle(args)
    };
  }

  if (name === "draw_oval") {
    const radiusX = numberOr(args.radiusX, randomInt(55, 150));
    const radiusY = numberOr(args.radiusY, randomInt(35, 100));
    return {
      type: "oval",
      x: numberOr(args.x, randomInt(radiusX + 10, CANVAS_WIDTH - radiusX - 10)),
      y: numberOr(args.y, randomInt(radiusY + 10, CANVAS_HEIGHT - radiusY - 10)),
      radiusX,
      radiusY,
      ...normalizeShapeStyle(args)
    };
  }

  if (name === "draw_triangle") {
    const size = numberOr(args.size, randomInt(80, 190));
    const margin = Math.ceil(size / 2) + 10;
    return {
      type: "triangle",
      x: numberOr(args.x, randomInt(margin, CANVAS_WIDTH - margin)),
      y: numberOr(args.y, randomInt(margin, CANVAS_HEIGHT - margin)),
      size,
      rotation: numberOr(args.rotation, randomInt(0, 359)),
      ...normalizeShapeStyle(args)
    };
  }

  if (name === "draw_star") {
    const outerRadius = numberOr(args.outerRadius, randomInt(45, 115));
    return {
      type: "star",
      x: numberOr(args.x, randomInt(outerRadius + 10, CANVAS_WIDTH - outerRadius - 10)),
      y: numberOr(args.y, randomInt(outerRadius + 10, CANVAS_HEIGHT - outerRadius - 10)),
      outerRadius,
      innerRadius: numberOr(args.innerRadius, randomInt(Math.round(outerRadius * 0.35), Math.round(outerRadius * 0.55))),
      points: clamp(Math.round(numberOr(args.points, randomInt(5, 8))), 4, 12),
      rotation: numberOr(args.rotation, randomInt(0, 359)),
      ...normalizeShapeStyle(args)
    };
  }

  if (name === "set_canvas_background") {
    return {
      type: "background",
      color: cssColor(args.color, "white")
    };
  }

  if (name === "clear_canvas") {
    return { type: "clear" };
  }

  return null;
}

function formatModelToolCall(toolCall) {
  const name = toolCall?.function?.name;
  const rawArgs = toolCall?.function?.arguments || "{}";

  if (!name) {
    return null;
  }

  return {
    name,
    arguments: parseToolArguments(rawArgs)
  };
}

function parseToolArguments(rawArgs) {
  if (typeof rawArgs !== "string") {
    return rawArgs;
  }

  try {
    return JSON.parse(rawArgs);
  } catch {
    return rawArgs;
  }
}

function parseCommandsFromText(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return items.filter((item) => item && typeof item.type === "string");
  } catch {
    return [];
  }
}

function buildDrawingReply(commands) {
  const names = commands.map((command) => {
    if (command.type === "line") return "line";
    if (command.type === "circle") return "circle";
    if (command.type === "rectangle") return "rectangle";
    if (command.type === "square") return "square";
    if (command.type === "oval") return "oval";
    if (command.type === "triangle") return "triangle";
    if (command.type === "star") return "star";
    if (command.type === "background") return "background";
    if (command.type === "clear") return "clear";
    return "shape";
  });

  return `Done: ${names.join(", ")}.`;
}

function tool(name, description, properties) {
  return {
    type: "function",
    function: {
      name,
      description,
      parameters: {
        type: "object",
        additionalProperties: false,
        properties,
        required: []
      }
    }
  };
}

function centerXProperty() {
  return randomizableNumberProperty("Center X coordinate in pixels. Use 400 if the user asks for the center of the drawing.");
}

function centerYProperty() {
  return randomizableNumberProperty("Center Y coordinate in pixels. Use 300 if the user asks for the center of the drawing.");
}

function topLeftXProperty() {
  return randomizableNumberProperty("Top-left X coordinate.");
}

function topLeftYProperty() {
  return randomizableNumberProperty("Top-left Y coordinate.");
}

function shapeStyleProperties() {
  return {
    fillColor: cssColorProperty("Interior fill color. Optional."),
    strokeColor: cssColorProperty("Outline/stroke color. Optional."),
    strokeWidth: randomizableNumberProperty("Outline/stroke width in pixels.")
  };
}

function randomizableNumberProperty(prefix) {
  return {
    type: ["number", "string"],
    description: `${prefix} Use a number when the user provides a value. Use the exact string "random" when the user does not provide this value.`
  };
}

function cssColorProperty(prefix) {
  return {
    type: "string",
    description: `${prefix} Must be a valid CSS color in English or hexadecimal, for example green, navy, lightgray, or #0f766e. Do not return non-English color names.`
  };
}

function normalizeShapeStyle(args) {
  return {
    fillColor: cssColor(args.fillColor, randomColor(["#f97316", "#22c55e", "#38bdf8", "#facc15", "#f472b6", "#a78bfa"])),
    strokeColor: cssColor(args.strokeColor, randomColor(["#111827", "#7c3aed", "#0f766e", "#b91c1c", "#1d4ed8"])),
    strokeWidth: numberOr(args.strokeWidth, randomInt(1, 8))
  };
}

async function loadSettings(filePath) {
  const result = {};

  if (!existsSync(filePath)) {
    return result;
  }

  const content = await readFile(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    result[key] = value.replace(/^["']|["']$/g, "");
  }

  return result;
}

function stripTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function randomInt(min, max) {
  const safeMin = Math.ceil(Math.min(min, max));
  const safeMax = Math.floor(Math.max(min, max));
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

function randomColor(colors) {
  return colors[randomInt(0, colors.length - 1)];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function cssColor(value, fallback) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  const colors = {
    green: "green",
    orange: "orange",
    purple: "purple",
    red: "red",
    blue: "blue",
    navy: "navy",
    skyblue: "skyblue",
    lightblue: "lightblue",
    darkblue: "darkblue",
    black: "black",
    white: "white",
    yellow: "yellow",
    gray: "gray",
    lightgray: "lightgray",
    darkgray: "darkgray",
    lightgreen: "lightgreen",
    darkgreen: "darkgreen",
    pink: "pink",
    cyan: "cyan",
    magenta: "magenta",
    brown: "brown",
    transparent: "transparent"
  };

  return colors[normalized] || normalized;
}
