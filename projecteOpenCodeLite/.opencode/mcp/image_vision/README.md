# image_vision MCP

Small MCP bridge for local multimodal models behind OpenAI-compatible endpoints.

Tool:

- `describe`: read one project-local image and ask the configured multimodal model to describe or answer a prompt about it.

Default endpoint:

- `http://127.0.0.1:8002/v1/chat/completions`

The tool only reads image files inside the project root.
