import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { callModel, getMissingEnvVars, getModelSettings, loadEnvSettings } from "./llm.js";
import { buildDrawingReply, executeTool, formatModelToolCall, parseCommandsFromText, parseDrawingRequest } from "./tools.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnvSettings();

const settings = getModelSettings();
const app = express();

const SYSTEM_MESSAGE = `You are a drawing assistant. The user may write in any language.
First translate and normalize the user's drawing request internally into English, then decide which function calls to make.
Use function calling to draw on the canvas.
If the user asks for a drawing, always call one or more tools. Do not return only reasoning or an empty response for drawing requests.

Logical canvas size: 700x400 pixels. Origin (0,0) is the top-left corner.
Available shapes: line, circle, rectangle, square, oval/ellipse, triangle, and star.
Shapes with an area can use fillColor for the interior/background, strokeColor for the outline/relief, and strokeWidth for outline thickness.
If the user asks to change the drawing or canvas background color, call set_canvas_background.
If the user asks for the center of the drawing, use x=350 and y=200.
For numeric arguments not provided by the user, return the string "random" instead of inventing a number. The server will replace "random" with a valid random value inside the canvas.
If a line endpoint is partially specified, use the provided coordinate and return "random" for the missing coordinate.
If the user says "size N pixels" for relief, border, outline, or stroke, interpret it as strokeWidth=N.
All function argument values should be normalized to English conventions.
Color arguments must always be valid CSS colors in English or hexadecimal. Do not return non-English color names in function arguments.
If the request is not about drawing, answer briefly without using tools.`;

const MAX_HISTORY = 20;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/settings", (_req, res) => {
  const missing = getMissingEnvVars();

  res.json({
    port: settings.port,
    model: settings.model,
    baseUrl: settings.baseUrl,
    configured: missing.length === 0,
    missing,
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
      { role: "system", content: SYSTEM_MESSAGE },
      ...history
        .filter((message) => ["user", "assistant"].includes(message?.role) && typeof message.content === "string")
        .slice(-MAX_HISTORY),
      { role: "user", content: userMessage },
    ];

    const result = await runConversation(messages, isDrawingRequest(userMessage));
    const assistantMessage = result.message;
    const commands = result.commands;
    const modelToolCalls = result.modelToolCalls;

    if (commands.length > 0) {
      return res.json({
        reply: assistantMessage.content || buildDrawingReply(commands),
        commands,
        modelToolCalls,
      });
    }

    const parsedCommands = parseCommandsFromText(assistantMessage.content || "");
    if (parsedCommands.length > 0) {
      return res.json({
        reply: buildDrawingReply(parsedCommands),
        commands: parsedCommands,
        modelToolCalls,
      });
    }

    const fallbackCommands = parseDrawingRequest(userMessage);
    if (fallbackCommands.length > 0) {
      return res.json({
        reply: buildDrawingReply(fallbackCommands),
        commands: fallbackCommands,
        modelToolCalls,
      });
    }

    res.json({
      reply: assistantMessage.content || "I could not convert that request into drawing commands. Check that the coordinates are complete.",
      commands: [],
      modelToolCalls,
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);

  if (error.message?.startsWith("Missing required environment variables:")) {
    return res.status(503).json({ error: error.message });
  }

  if (error.message?.startsWith("API error:")) {
    return res.status(502).json({ error: error.message });
  }

  res.status(500).json({ error: error.message || "Internal server error." });
});

app.listen(settings.port, () => {
  console.log(`Server available at http://localhost:${settings.port}`);
  console.log(`Configured model: ${settings.model} (${settings.baseUrl})`);
});

async function runConversation(messages, requireInitialTool = false) {
  let conversationMessages = limitMessages(messages);
  const commands = [];
  const modelToolCalls = [];

  while (true) {
    const toolChoice = requireInitialTool && commands.length === 0 ? "required" : "auto";
    const message = await callModel(conversationMessages, { toolChoice });

    console.log("\nMODEL RESPONSE");
    console.log(message?.content || "(tool calls)", "\n");

    if (message?.tool_calls && message.tool_calls.length > 0) {
      console.log("TOOL CALL DETECTED\n");

      conversationMessages.push(message);

      for (const toolCall of message.tool_calls) {
        const result = executeTool(toolCall);
        modelToolCalls.push(formatModelToolCall(toolCall));

        if (result.command) {
          commands.push(result.command);
        }

        console.log("FUNCTION EXECUTED");
        console.log(`  Tool: ${toolCall.function.name}\n`);

        conversationMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      console.log("TOOL RESULT SENT BACK TO MODEL\n");
      conversationMessages = limitMessages(conversationMessages);
      continue;
    }

    console.log("FINAL MODEL RESPONSE");
    console.log(message?.content || "");
    return {
      message: message || {},
      commands,
      modelToolCalls: modelToolCalls.filter(Boolean),
    };
  }
}

function limitMessages(messages) {
  const systemMessage = messages[0];
  const history = messages.slice(1);

  if (history.length > MAX_HISTORY) {
    return [systemMessage, ...history.slice(history.length - MAX_HISTORY)];
  }

  return messages;
}

function isDrawingRequest(text) {
  const normalized = text.toLowerCase();
  return /\b(draw|drawing|paint|circle|line|rectangle|square|oval|triangle|star|canvas|background)\b/.test(normalized);
}
