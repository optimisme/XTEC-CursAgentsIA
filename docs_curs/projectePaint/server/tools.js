export const CANVAS_WIDTH = 700;
export const CANVAS_HEIGHT = 400;

export function normalizeToolCall(toolCall) {
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
      width: numberOr(args.width, randomInt(2, 8)),
    };
  }

  if (name === "draw_circle") {
    const radius = numberOr(args.radius, randomInt(35, 105));
    return {
      type: "circle",
      x: numberOr(args.x, randomInt(radius + 10, CANVAS_WIDTH - radius - 10)),
      y: numberOr(args.y, randomInt(radius + 10, CANVAS_HEIGHT - radius - 10)),
      radius,
      ...normalizeShapeStyle(args),
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
      ...normalizeShapeStyle(args),
    };
  }

  if (name === "draw_square") {
    const size = numberOr(args.size, randomInt(70, 180));
    return {
      type: "square",
      x: numberOr(args.x, randomInt(10, CANVAS_WIDTH - size - 10)),
      y: numberOr(args.y, randomInt(10, CANVAS_HEIGHT - size - 10)),
      size,
      ...normalizeShapeStyle(args),
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
      ...normalizeShapeStyle(args),
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
      ...normalizeShapeStyle(args),
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
      ...normalizeShapeStyle(args),
    };
  }

  if (name === "set_canvas_background") {
    return {
      type: "background",
      color: cssColor(args.color, "white"),
    };
  }

  if (name === "clear_canvas") {
    return { type: "clear" };
  }

  return null;
}

export function executeTool(toolCall) {
  const command = normalizeToolCall(toolCall);
  if (!command) {
    return { error: `Unknown or invalid tool: ${toolCall?.function?.name || "unknown"}` };
  }

  return { command };
}

export function formatModelToolCall(toolCall) {
  const name = toolCall?.function?.name;
  const rawArgs = toolCall?.function?.arguments || "{}";

  if (!name) {
    return null;
  }

  return {
    name,
    arguments: parseToolArguments(rawArgs),
  };
}

export function parseCommandsFromText(text) {
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

export function buildDrawingReply(commands) {
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

export function parseDrawingRequest(text) {
  const normalized = normalizeText(text);
  const commands = [];

  const clearCommand = parseClearRequest(normalized);
  if (clearCommand) {
    commands.push(clearCommand);
  }

  const backgroundCommand = parseBackgroundRequest(normalized);
  if (backgroundCommand) {
    commands.push(backgroundCommand);
  }

  const shapeParsers = [
    parseCircleRequest,
    parseLineRequest,
    parseRectangleRequest,
    parseSquareRequest,
    parseOvalRequest,
    parseTriangleRequest,
    parseStarRequest,
  ];

  for (const parser of shapeParsers) {
    const command = parser(normalized);
    if (command) {
      commands.push(command);
    }
  }

  return commands;
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

function parseClearRequest(text) {
  if (!/\b(clear)\b/.test(text)) {
    return null;
  }

  return { type: "clear" };
}

function parseBackgroundRequest(text) {
  if (!/\b(background)\b/.test(text)) {
    return null;
  }

  const segment = getShapeSegment(text, /\b(background)\b/);

  return {
    type: "background",
    color: detectColor(segment) || "white",
  };
}

function parseCircleRequest(text) {
  if (!/\b(circle)\b/.test(text)) {
    return null;
  }

  const segment = getShapeSegment(text, /\b(circle)\b/);
  const radius = matchNumber(segment, /\b(?:radius)\s+(\d+(?:\.\d+)?)/);
  const fillColor = detectColor(segment);
  const position = parsePosition(segment, radius || 60);

  return {
    type: "circle",
    x: position.x,
    y: position.y,
    radius: radius || randomInt(35, 105),
    fillColor: fillColor || randomColor(["#f97316", "#22c55e", "#38bdf8", "#facc15", "#f472b6", "#a78bfa"]),
    strokeColor: "black",
    strokeWidth: 2,
  };
}

function parseLineRequest(text) {
  if (!/\b(line)\b/.test(text)) {
    return null;
  }

  const segment = getShapeSegment(text, /\b(line)\b/);
  const start = segment.match(/\b(?:position)?\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/);
  if (!start) {
    return null;
  }

  const afterStart = segment.slice(start.index + start[0].length);
  const endPair = afterStart.match(/\b(?:to)\s+(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/);
  const endSingle = afterStart.match(/\b(?:to)\s+(\d+(?:\.\d+)?)/);
  const fallbackEnd = endSingle ? Number(endSingle[1]) : randomInt(20, CANVAS_WIDTH - 20);

  return {
    type: "line",
    x1: Number(start[1]),
    y1: Number(start[2]),
    x2: endPair ? Number(endPair[1]) : fallbackEnd,
    y2: endPair ? Number(endPair[2]) : fallbackEnd,
    color: detectColor(afterStart) || detectColor(segment) || "black",
    width: matchNumber(segment, /\b(?:width)\s+(\d+(?:\.\d+)?)/) || randomInt(2, 8),
  };
}

function parseRectangleRequest(text) {
  if (!/\b(rectangle)\b/.test(text)) {
    return null;
  }

  const segment = getShapeSegment(text, /\b(rectangle)\b/);
  const width = matchNumber(segment, /\b(?:width)\s+(\d+(?:\.\d+)?)/) || randomInt(90, 240);
  const height = matchNumber(segment, /\b(?:height)\s+(\d+(?:\.\d+)?)/) || randomInt(60, 180);
  const position = parsePosition(segment, Math.max(width, height) / 2);

  return {
    type: "rectangle",
    x: position.x,
    y: position.y,
    width,
    height,
    ...parseStyle(segment),
  };
}

function parseSquareRequest(text) {
  if (!/\b(square)\b/.test(text)) {
    return null;
  }

  const segment = getShapeSegment(text, /\b(square)\b/);
  const size = matchNumber(segment, /\b(?:size|side)\s+(\d+(?:\.\d+)?)/) || randomInt(70, 180);
  const position = parsePosition(segment, size / 2);

  return {
    type: "square",
    x: position.x,
    y: position.y,
    size,
    ...parseStyle(segment),
  };
}

function parseOvalRequest(text) {
  if (!/\b(oval|ellipse)\b/.test(text)) {
    return null;
  }

  const segment = getShapeSegment(text, /\b(oval|ellipse)\b/);
  const radiusX = matchNumber(segment, /\b(?:radiusx|radius x)\s+(\d+(?:\.\d+)?)/) || randomInt(55, 150);
  const radiusY = matchNumber(segment, /\b(?:radiusy|radius y)\s+(\d+(?:\.\d+)?)/) || randomInt(35, 100);
  const position = parsePosition(segment, Math.max(radiusX, radiusY));

  return {
    type: "oval",
    x: position.x,
    y: position.y,
    radiusX,
    radiusY,
    ...parseStyle(segment),
  };
}

function parseTriangleRequest(text) {
  if (!/\b(triangle)\b/.test(text)) {
    return null;
  }

  const segment = getShapeSegment(text, /\b(triangle)\b/);
  const size = matchNumber(segment, /\b(?:size|side)\s+(\d+(?:\.\d+)?)/) || randomInt(80, 190);
  const position = parsePosition(segment, size / 2);

  return {
    type: "triangle",
    x: position.x,
    y: position.y,
    size,
    rotation: matchNumber(segment, /\b(?:rotation)\s+(\d+(?:\.\d+)?)/) || 0,
    ...parseStyle(segment),
  };
}

function parseStarRequest(text) {
  if (!/\b(star)\b/.test(text)) {
    return null;
  }

  const segment = getShapeSegment(text, /\b(star)\b/);
  const outerRadius = matchNumber(segment, /\b(?:outerradius|outer radius|radius)\s+(\d+(?:\.\d+)?)/) || randomInt(45, 115);
  const position = parsePosition(segment, outerRadius);

  return {
    type: "star",
    x: position.x,
    y: position.y,
    outerRadius,
    innerRadius: Math.round(outerRadius * 0.45),
    points: matchNumber(segment, /\b(?:points)\s+(\d+(?:\.\d+)?)/) || 5,
    rotation: matchNumber(segment, /\b(?:rotation)\s+(\d+(?:\.\d+)?)/) || -90,
    ...parseStyle(segment),
  };
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getShapeSegment(text, pattern) {
  const match = text.match(pattern);
  if (!match) {
    return text;
  }

  const prefix = text.slice(0, match.index);
  const previousSeparator = Math.max(prefix.lastIndexOf(","), prefix.lastIndexOf("."));
  const start = previousSeparator === -1 ? 0 : previousSeparator + 1;
  const restStart = match.index + match[0].length;
  const rest = text.slice(restStart);
  const next = rest.search(/\b(circle|line|rectangle|square|oval|ellipse|triangle|star|background|clear)\b/);
  if (next === -1) {
    return text.slice(start);
  }

  const textBeforeNextShape = rest.slice(0, next);
  const separatorBeforeNextShape = Math.max(textBeforeNextShape.lastIndexOf(","), textBeforeNextShape.lastIndexOf("."));
  const end = separatorBeforeNextShape === -1 ? restStart + next : restStart + separatorBeforeNextShape;
  return text.slice(start, end);
}

function parsePosition(text, margin = 60) {
  const pair = text.match(/\b(?:position|at)\s+(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/);
  if (pair) {
    return { x: Number(pair[1]), y: Number(pair[2]) };
  }

  if (/\b(center)\b/.test(text)) {
    return { x: 350, y: 200 };
  }

  if (/\b(left)\b/.test(text)) {
    return { x: Math.max(80, margin + 10), y: 200 };
  }

  if (/\b(right)\b/.test(text)) {
    return { x: Math.min(CANVAS_WIDTH - 80, CANVAS_WIDTH - margin - 10), y: 200 };
  }

  if (/\b(top)\b/.test(text)) {
    return { x: 350, y: Math.max(80, margin + 10) };
  }

  if (/\b(bottom)\b/.test(text)) {
    return { x: 350, y: Math.min(CANVAS_HEIGHT - 80, CANVAS_HEIGHT - margin - 10) };
  }

  return {
    x: randomInt(Math.ceil(margin + 10), Math.floor(CANVAS_WIDTH - margin - 10)),
    y: randomInt(Math.ceil(margin + 10), Math.floor(CANVAS_HEIGHT - margin - 10)),
  };
}

function parseStyle(text) {
  return {
    fillColor: detectCssColor(text) || randomColor(["#f97316", "#22c55e", "#38bdf8", "#facc15", "#f472b6", "#a78bfa"]),
    strokeColor: "black",
    strokeWidth: matchNumber(text, /\b(?:strokewidth|stroke width)\s+(\d+(?:\.\d+)?)/) || 2,
  };
}

function matchNumber(text, pattern) {
  const match = text.match(pattern);
  return match ? Number(match[1]) : null;
}

function detectColor(text) {
  return detectCssColor(text);
}

function detectCssColor(text) {
  const hex = text.match(/#[0-9a-f]{3,8}\b/);
  if (hex) {
    return hex[0];
  }

  if (/\blight\s+gray\b|\blightgray\b/.test(text)) {
    return "lightgray";
  }

  if (/\bdark\s+gray\b|\bdarkgray\b/.test(text)) {
    return "darkgray";
  }

  const colors = [
    "green",
    "orange",
    "purple",
    "red",
    "blue",
    "navy",
    "skyblue",
    "lightblue",
    "darkblue",
    "black",
    "white",
    "yellow",
    "gray",
    "lightgray",
    "darkgray",
    "lightgreen",
    "darkgreen",
    "pink",
    "cyan",
    "magenta",
    "brown",
    "transparent",
  ];

  return colors.find((color) => new RegExp(`\\b${color}\\b`).test(text)) || null;
}

function normalizeShapeStyle(args) {
  return {
    fillColor: cssColor(args.fillColor, randomColor(["#f97316", "#22c55e", "#38bdf8", "#facc15", "#f472b6", "#a78bfa"])),
    strokeColor: cssColor(args.strokeColor, randomColor(["#111827", "#7c3aed", "#0f766e", "#b91c1c", "#1d4ed8"])),
    strokeWidth: numberOr(args.strokeWidth, randomInt(1, 8)),
  };
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
    transparent: "transparent",
  };

  return colors[normalized] || normalized;
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
        required: [],
      },
    },
  };
}

function centerXProperty() {
  return randomizableNumberProperty("Center X coordinate in pixels. Use 350 if the user asks for the center of the drawing.");
}

function centerYProperty() {
  return randomizableNumberProperty("Center Y coordinate in pixels. Use 200 if the user asks for the center of the drawing.");
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
    strokeWidth: randomizableNumberProperty("Outline/stroke width in pixels."),
  };
}

function randomizableNumberProperty(prefix) {
  return {
    type: ["number", "string"],
    description: `${prefix} Use a number when the user provides a value. Use the exact string "random" when the user does not provide this value.`,
  };
}

function cssColorProperty(prefix) {
  return {
    type: "string",
    description: `${prefix} Must be a valid CSS color in English or hexadecimal, for example green, navy, lightgray, or #0f766e. Do not return non-English color names.`,
  };
}

export const TOOL_DEFINITIONS = [
  tool("draw_line", "Draws a straight line on the canvas.", {
    x1: randomizableNumberProperty("Initial X coordinate in pixels."),
    y1: randomizableNumberProperty("Initial Y coordinate in pixels."),
    x2: randomizableNumberProperty("Final X coordinate in pixels."),
    y2: randomizableNumberProperty("Final Y coordinate in pixels."),
    color: cssColorProperty("Line color."),
    width: randomizableNumberProperty("Line width in pixels."),
  }),
  tool("draw_circle", "Draws a circle on the canvas.", {
    x: centerXProperty(),
    y: centerYProperty(),
    radius: randomizableNumberProperty("Radius in pixels."),
    ...shapeStyleProperties(),
  }),
  tool("draw_rectangle", "Draws a rectangle on the canvas.", {
    x: topLeftXProperty(),
    y: topLeftYProperty(),
    width: randomizableNumberProperty("Width in pixels."),
    height: randomizableNumberProperty("Height in pixels."),
    ...shapeStyleProperties(),
  }),
  tool("draw_square", "Draws a square on the canvas.", {
    x: topLeftXProperty(),
    y: topLeftYProperty(),
    size: randomizableNumberProperty("Side length in pixels."),
    ...shapeStyleProperties(),
  }),
  tool("draw_oval", "Draws an oval or ellipse on the canvas.", {
    x: centerXProperty(),
    y: centerYProperty(),
    radiusX: randomizableNumberProperty("Horizontal radius in pixels."),
    radiusY: randomizableNumberProperty("Vertical radius in pixels."),
    ...shapeStyleProperties(),
  }),
  tool("draw_triangle", "Draws an approximately equilateral triangle on the canvas.", {
    x: centerXProperty(),
    y: centerYProperty(),
    size: randomizableNumberProperty("Approximate triangle size in pixels."),
    rotation: randomizableNumberProperty("Rotation in degrees."),
    ...shapeStyleProperties(),
  }),
  tool("draw_star", "Draws a star on the canvas.", {
    x: centerXProperty(),
    y: centerYProperty(),
    outerRadius: randomizableNumberProperty("Outer radius in pixels."),
    innerRadius: randomizableNumberProperty("Inner radius in pixels."),
    points: randomizableNumberProperty("Number of points, normally 5."),
    rotation: randomizableNumberProperty("Rotation in degrees."),
    ...shapeStyleProperties(),
  }),
  tool("set_canvas_background", "Changes the canvas background color.", {
    color: cssColorProperty("Canvas background color."),
  }),
  tool("clear_canvas", "Clears the canvas when the user requests it.", {}),
];
