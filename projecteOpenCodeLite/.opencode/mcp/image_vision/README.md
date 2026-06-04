# image_vision MCP

Small MCP bridge for local multimodal models behind OpenAI-compatible endpoints.

On startup, the MCP sends a tiny image probe to the configured model. If the model does not pass the probe, the server stays connected but does not register the `describe` tool, so OpenCode will not expose `image_vision_describe` to the agent.

Tool:

- `describe`: read one project-local image and ask the configured multimodal model to describe or answer a prompt about it.

Default endpoint:

- `http://127.0.0.1:8002/v1/chat/completions`

Environment:

- `IMAGE_VISION_BASE_URL`: OpenAI-compatible chat completions endpoint.
- `IMAGE_VISION_MODEL`: model name, default `active-model`.
- `IMAGE_VISION_REQUIRE_MULTIMODAL=false`: skip the startup capability probe and always expose the tool.
- `IMAGE_VISION_PROBE_TIMEOUT_MS`: startup probe timeout, default `6000`.

The tool only reads image files inside the project root.
