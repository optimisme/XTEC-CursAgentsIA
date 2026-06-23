# Function Calling Project

Node.js and Express server with a web UI on port 3000. The app converts natural-language drawing requests into OpenAI-compatible function calls.

The user may write in any language, but the model is instructed to normalize requests internally to English and return function arguments using English conventions. Color values should be valid CSS color names in English or hexadecimal values. Missing numeric values should be returned as the exact string `"random"` so the server can choose valid random values.

## Development

```bash
cd projectePaint
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production With PM2

```bash
npm run pm2start
npm run pm2logs
npm run pm2restart
npm run pm2stop
```

## Configuration

Edit `server/settings.env`:

```env
PORT=3000
OPENAI_BASE_URL="http://127.0.0.1:8002/v1/chat/completions"
OPENAI_API_KEY=""
OPENAI_MODEL="active-model"
OPENAI_TIMEOUT_MS=900000
MAX_TOKENS=700
TEMPERATURE=0.1
```

The settings follow the same structure as `projecteCMD`: `OPENAI_BASE_URL` points to the chat completions endpoint and `OPENAI_MODEL` selects the model. `OPENAI_API_KEY` is optional; leave it empty for local providers such as Ollama.

## Test Prompts

```text
draw a green line from 50,75 to 200,300
draw a circle at the center of the drawing with orange fill and purple stroke of 2.5 pixels
draw a rectangle with blue fill and yellow stroke of 6 pixels
draw a red square
draw an oval with pink fill and black outline
draw a star with yellow fill and purple outline
change the canvas background to gray
clear the canvas
```

If a request omits coordinates, sizes, or stroke widths, the model should return `"random"` for those numeric arguments and the server fills them with random valid numbers inside the canvas range.
