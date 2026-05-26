# Function Calling Project

Node.js and Express server with a web UI on port 3000. The app converts natural-language drawing requests into function calls against a local vLLM model compatible with the OpenAI API.

The user may write in any language, but the model is instructed to normalize requests internally to English and return function arguments using English conventions. Color values should be valid CSS color names in English or hexadecimal values. Missing numeric values should be returned as the exact string `"random"` so the server can choose valid random values.

## Development

```bash
cd projecteFunctionCalling
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

Edit `settings.env`:

```env
PORT=3000
VLLM_BASE_URL=http://127.0.0.1:8002/v1
VLLM_API_KEY=local
VLLM_MODEL=gemma4-8b-local
VLLM_TIMEOUT_MS=900000
MAX_TOKENS=700
TEMPERATURE=0.1
```

The default values target the local 16 GB VRAM vLLM provider used in this repository.

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
