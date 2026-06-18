const canvas = document.querySelector("#drawing-canvas");
const ctx = canvas.getContext("2d");
const messagesEl = document.querySelector("#messages");
const form = document.querySelector("#chat-form");
const input = document.querySelector("#prompt-input");
const sendButton = document.querySelector("#send-button");
const clearButton = document.querySelector("#clear-button");
const modelStatus = document.querySelector("#model-status");

const MAX_CHAT_ITEMS = 25;
const MAX_HISTORY_MESSAGES = 25;
const history = [];
let canvasBackground = "#ffffff";

setupCanvas();
loadSettings();
addMessage("assistant", "Write a drawing request and I will convert it into function calls.");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  addMessage("user", message);
  history.push({ role: "user", content: message });
  pruneHistory();
  setBusy(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: history.slice(0, -1).slice(-MAX_HISTORY_MESSAGES) })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "The request failed.");
    }

    for (const command of payload.commands || []) {
      applyCommand(command);
    }

    const reply = payload.reply || "Fet.";
    addMessage("assistant", reply);
    addToolCallTrace(payload.modelToolCalls || []);
    history.push({ role: "assistant", content: reply });
    pruneHistory();
  } catch (error) {
    addMessage("error", error.message);
  } finally {
    setBusy(false);
    input.focus();
  }
});

clearButton.addEventListener("click", () => {
  clearCanvas();
  addMessage("assistant", "Canvas cleared.");
});

function setupCanvas() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  canvas.style.backgroundColor = canvasBackground;
  clearCanvas();
}

async function loadSettings() {
  try {
    const response = await fetch("/api/settings");
    const settings = await response.json();
    modelStatus.textContent = `${settings.model} - ${settings.baseUrl}`;
  } catch {
    modelStatus.textContent = "Configuration unavailable";
  }
}

function addMessage(role, content) {
  const item = document.createElement("div");
  item.className = `message ${role}`;
  item.textContent = content;
  messagesEl.appendChild(item);
  pruneChatItems();
  scrollMessagesToBottom();
}

function addToolCallTrace(toolCalls) {
  if (!toolCalls.length) return;

  const panel = document.createElement("div");
  panel.className = "tool-trace";

  for (const toolCall of toolCalls) {
    const block = document.createElement("div");
    block.className = "tool-trace-block";

    const title = document.createElement("div");
    title.className = "tool-trace-title";
    title.textContent = `Function: ${toolCall.name}`;

    const code = document.createElement("pre");
    code.textContent = JSON.stringify(toolCall.arguments ?? {}, null, 2);

    block.append(title, code);
    panel.appendChild(block);
  }

  messagesEl.appendChild(panel);
  pruneChatItems();
  scrollMessagesToBottom();
}

function pruneChatItems() {
  while (messagesEl.children.length > MAX_CHAT_ITEMS) {
    messagesEl.firstElementChild.remove();
  }
}

function pruneHistory() {
  if (history.length > MAX_HISTORY_MESSAGES) {
    history.splice(0, history.length - MAX_HISTORY_MESSAGES);
  }
}

function scrollMessagesToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setBusy(isBusy) {
  input.disabled = isBusy;
  sendButton.disabled = isBusy;
  sendButton.textContent = isBusy ? "Thinking..." : "Send";
}

function applyCommand(command) {
  if (command.type === "clear") {
    clearCanvas();
    return;
  }

  if (command.type === "line") {
    drawLine(command);
    return;
  }

  if (command.type === "circle") {
    drawCircle(command);
    return;
  }

  if (command.type === "rectangle") {
    drawRectangle(command);
    return;
  }

  if (command.type === "square") {
    drawSquare(command);
    return;
  }

  if (command.type === "oval") {
    drawOval(command);
    return;
  }

  if (command.type === "triangle") {
    drawTriangle(command);
    return;
  }

  if (command.type === "star") {
    drawStar(command);
    return;
  }

  if (command.type === "background") {
    setCanvasBackground(command.color);
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function setCanvasBackground(color) {
  canvasBackground = color || "#ffffff";
  canvas.style.backgroundColor = canvasBackground;
}

function drawLine(command) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(command.x1, command.y1);
  ctx.lineTo(command.x2, command.y2);
  ctx.strokeStyle = command.color || "black";
  ctx.lineWidth = positiveNumber(command.width, 3);
  ctx.stroke();
  ctx.restore();
}

function drawCircle(command) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(command.x, command.y, positiveNumber(command.radius, 70), 0, Math.PI * 2);
  ctx.fillStyle = command.fillColor || "transparent";
  ctx.strokeStyle = command.strokeColor || "black";
  ctx.lineWidth = positiveNumber(command.strokeWidth, 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawRectangle(command) {
  ctx.save();
  ctx.fillStyle = command.fillColor || "transparent";
  ctx.strokeStyle = command.strokeColor || "black";
  ctx.lineWidth = positiveNumber(command.strokeWidth, 2);
  ctx.fillRect(command.x, command.y, command.width, command.height);
  ctx.strokeRect(command.x, command.y, command.width, command.height);
  ctx.restore();
}

function drawSquare(command) {
  drawRectangle({
    ...command,
    width: command.size,
    height: command.size
  });
}

function drawOval(command) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(
    command.x,
    command.y,
    positiveNumber(command.radiusX, 90),
    positiveNumber(command.radiusY, 55),
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = command.fillColor || "transparent";
  ctx.strokeStyle = command.strokeColor || "black";
  ctx.lineWidth = positiveNumber(command.strokeWidth, 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawTriangle(command) {
  const size = positiveNumber(command.size, 120);
  const rotation = degreesToRadians(Number(command.rotation || 0) - 90);
  const points = polygonPoints(command.x, command.y, size / 2, 3, rotation);
  drawClosedPath(points, command);
}

function drawStar(command) {
  const pointsCount = Math.max(4, Math.min(12, Math.round(Number(command.points || 5))));
  const outerRadius = positiveNumber(command.outerRadius, 80);
  const innerRadius = positiveNumber(command.innerRadius, outerRadius * 0.45);
  const rotation = degreesToRadians(Number(command.rotation || -90));
  const points = [];

  for (let i = 0; i < pointsCount * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = rotation + (i * Math.PI) / pointsCount;
    points.push({
      x: command.x + Math.cos(angle) * radius,
      y: command.y + Math.sin(angle) * radius
    });
  }

  drawClosedPath(points, command);
}

function polygonPoints(x, y, radius, sides, rotation) {
  const points = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (i * Math.PI * 2) / sides;
    points.push({
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius
    });
  }
  return points;
}

function drawClosedPath(points, command) {
  if (!points.length) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
  ctx.fillStyle = command.fillColor || "transparent";
  ctx.strokeStyle = command.strokeColor || "black";
  ctx.lineWidth = positiveNumber(command.strokeWidth, 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}
