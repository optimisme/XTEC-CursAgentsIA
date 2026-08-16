#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SETTINGS_FILE="$SCRIPT_DIR/settings.env"
CONFIG_FILE="$SCRIPT_DIR/opencode.json"
DEFAULT_BASE_URL="https://agents.ieti.site/v1"
CAPABILITIES_TMP=""
CONFIG_TMP=""
SETTINGS_TMP=""
SETTINGS_NEEDS_WRITE=0
SETTINGS_FILE_EXISTED=0
SETTINGS_HAS_BASE_URL=0
SETTINGS_HAS_KEY=0

cleanup() {
  [ -z "$CAPABILITIES_TMP" ] || rm -f "$CAPABILITIES_TMP"
  [ -z "$CONFIG_TMP" ] || rm -f "$CONFIG_TMP"
  [ -z "$SETTINGS_TMP" ] || rm -f "$SETTINGS_TMP"
}
trap cleanup EXIT

read_masked() {
  local prompt="$1"
  local character=""
  local secret=""

  printf '%s' "$prompt"
  while true; do
    if ! IFS= read -r -s -n 1 character; then
      echo
      return 1
    fi
    if [ -z "$character" ]; then
      break
    fi
    case "$character" in
      $'\177'|$'\b')
        if [ -n "$secret" ]; then
          secret="${secret%?}"
          printf '\b \b'
        fi
        ;;
      *)
        secret+="$character"
        printf '*'
        ;;
    esac
  done
  echo
  PROXY_AGENTS_KEY="$secret"
  export PROXY_AGENTS_KEY
}

trim_value() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

load_dotenv() {
  local path="$1"
  local line=""
  local name=""
  local value=""
  local first=""
  local last=""

  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$ ]]; then
      name="${BASH_REMATCH[2]}"
      value="$(trim_value "${BASH_REMATCH[3]}")"
      if [ "${#value}" -ge 2 ]; then
        first="${value:0:1}"
        last="${value: -1}"
        if { [ "$first" = '"' ] && [ "$last" = '"' ]; } || { [ "$first" = "'" ] && [ "$last" = "'" ]; }; then
          value="${value:1:${#value}-2}"
        fi
      fi
      printf -v "$name" '%s' "$value"
      export "$name"
      case "$name" in
        PROXY_AGENTS_BASE_URL) [ -z "$value" ] || SETTINGS_HAS_BASE_URL=1 ;;
        PROXY_AGENTS_KEY) [ -z "$value" ] || SETTINGS_HAS_KEY=1 ;;
      esac
    fi
  done < "$path"
}

cd "$SCRIPT_DIR"

for command_name in curl node; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Error: required command was not found: $command_name"
    exit 1
  fi
done

if [ -f "$SETTINGS_FILE" ]; then
  SETTINGS_FILE_EXISTED=1
  chmod 600 "$SETTINGS_FILE"
  load_dotenv "$SETTINGS_FILE"
fi

if [ "$SETTINGS_FILE_EXISTED" -eq 0 ] || [ "$SETTINGS_HAS_BASE_URL" -eq 0 ] || [ "$SETTINGS_HAS_KEY" -eq 0 ]; then
  SETTINGS_NEEDS_WRITE=1
  if [ -t 0 ]; then
    if [ "$SETTINGS_FILE_EXISTED" -eq 0 ]; then
      echo "settings.env was not found."
    else
      echo "settings.env does not contain PROXY_AGENTS_BASE_URL and PROXY_AGENTS_KEY."
    fi
    suggested_url="${PROXY_AGENTS_BASE_URL:-$DEFAULT_BASE_URL}"
    read -r -p "IETI Agents base URL [$suggested_url]: " entered_url
    PROXY_AGENTS_BASE_URL="${entered_url:-$suggested_url}"
    export PROXY_AGENTS_BASE_URL
    if ! read_masked "Paste your IETI Agents API key: "; then
      echo "Error: API key input was interrupted."
      exit 1
    fi
  elif [ -z "${PROXY_AGENTS_BASE_URL:-}" ] || [ -z "${PROXY_AGENTS_KEY:-}" ]; then
    echo "Error: settings.env is missing required settings and they cannot be requested without an interactive terminal."
    echo "Run this script from a terminal or define PROXY_AGENTS_BASE_URL and PROXY_AGENTS_KEY for this invocation."
    exit 1
  fi
fi

if [ -z "${PROXY_AGENTS_BASE_URL:-}" ]; then
  echo "Error: PROXY_AGENTS_BASE_URL is not defined in settings.env."
  exit 1
fi
if [ -z "${PROXY_AGENTS_KEY:-}" ]; then
  echo "Error: PROXY_AGENTS_KEY is not defined in settings.env."
  exit 1
fi
if [[ ! "$PROXY_AGENTS_KEY" =~ ^ieti_sk_[A-Za-z0-9_-]+$ ]]; then
  echo "Error: the API key must start with ieti_sk_ and contain only letters, numbers, underscores, or hyphens."
  exit 1
fi

if ! API_BASE_URL="$(node -e '
  try {
    const url = new URL(process.argv[1]);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
    url.pathname = url.pathname.replace(/\/+$/, "");
    if (!url.pathname.endsWith("/v1")) url.pathname += "/v1";
    process.stdout.write(url.toString().replace(/\/$/, ""));
  } catch { process.exit(1); }
' "$PROXY_AGENTS_BASE_URL")"; then
  echo "Error: PROXY_AGENTS_BASE_URL must be a valid HTTP(S) base URL without credentials, query, or fragment."
  exit 1
fi
PROXY_AGENTS_BASE_URL="$API_BASE_URL"
export PROXY_AGENTS_BASE_URL PROXY_AGENTS_KEY

CAPABILITIES_TMP="$(mktemp "${TMPDIR:-/tmp}/ieti-capabilities.XXXXXX")"
if ! HTTP_STATUS="$(curl --silent --show-error \
  --output "$CAPABILITIES_TMP" \
  --write-out '%{http_code}' \
  --connect-timeout 15 \
  --max-time 60 \
  --header "Authorization: Bearer $PROXY_AGENTS_KEY" \
  --header 'Accept: application/json' \
  "$API_BASE_URL/model-capabilities")"; then
  echo "Error: could not connect to the IETI model capabilities endpoint."
  exit 1
fi

if [ "$HTTP_STATUS" != "200" ]; then
  ERROR_MESSAGE="$(node -e '
    try {
      const body = JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8"));
      process.stdout.write(String(body?.error?.message || body?.message || "the server rejected the request"));
    } catch { process.stdout.write("the server rejected the request"); }
  ' "$CAPABILITIES_TMP")"
  echo "Error: PROXY_AGENTS_KEY is not valid or the model catalog is unavailable (HTTP $HTTP_STATUS): $ERROR_MESSAGE"
  exit 1
fi

CONFIG_TMP="$(mktemp "$CONFIG_FILE.tmp.XXXXXX")"
node - "$CONFIG_FILE" "$CAPABILITIES_TMP" "$CONFIG_TMP" "$API_BASE_URL" <<'NODE'
const fs = require('node:fs');
const [configPath, capabilitiesPath, configOutputPath, baseURL] = process.argv.slice(2);

let config = {};
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot update ${configPath}: ${error.message}`);
  }
}
if (!config || typeof config !== 'object' || Array.isArray(config)) {
  throw new Error(`Cannot update ${configPath}: the root value must be an object.`);
}

const catalog = JSON.parse(fs.readFileSync(capabilitiesPath, 'utf8'));
if (catalog?.object !== 'ieti.model_capabilities.list' || catalog?.schema_version !== 1 || !Array.isArray(catalog.data) || catalog.data.length === 0) {
  throw new Error('The authenticated server returned no available models.');
}

const models = {};
const canonicalReasoningEfforts = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
for (const published of catalog.data) {
  const id = String(published?.id || '').trim();
  const context = Number(published?.context_window);
  const output = Number(published?.max_output_tokens);
  if (!id || !Number.isFinite(context) || context <= 0 || !Number.isFinite(output) || output <= 0) {
    throw new Error(`Model metadata is incomplete for ${id || '<unknown model>'}.`);
  }
  const capabilities = published.capabilities || {};
  const capabilityNames = ['text', 'image', 'tools', 'reasoning', 'parallel_tools'];
  if (capabilityNames.some((name) => typeof capabilities[name] !== 'boolean')) {
    throw new Error(`Model capabilities are incomplete for ${id}.`);
  }
  const inputModalities = Array.isArray(published?.modalities?.input)
    ? published.modalities.input.filter((value) => ['text', 'audio', 'image', 'video', 'pdf'].includes(value))
    : [capabilities.text === false ? null : 'text', capabilities.image ? 'image' : null].filter(Boolean);
  const advertisedReasoningEfforts = Array.isArray(published.reasoning_efforts)
    ? published.reasoning_efforts.map((value) => String(value).toLowerCase())
    : [];
  const supportedReasoningEfforts = canonicalReasoningEfforts
    .filter((effort) => advertisedReasoningEfforts.includes(effort));
  const defaultReasoningEffort = supportedReasoningEfforts.includes(published.default_reasoning_effort)
    ? published.default_reasoning_effort
    : null;
  const variants = capabilities.reasoning === true
    ? Object.fromEntries(canonicalReasoningEfforts.map((effort) => [
        effort,
        supportedReasoningEfforts.includes(effort) ? { reasoningEffort: effort } : { disabled: true }
      ]))
    : {};
  models[id] = {
    name: String(published?.name || id),
    attachment: capabilities.image === true,
    temperature: true,
    limit: { context, output },
    tool_call: capabilities.tools === true,
    reasoning: capabilities.reasoning === true,
    modalities: { input: inputModalities, output: ['text'] },
    variants,
    ...(defaultReasoningEffort ? { options: { reasoningEffort: defaultReasoningEffort } } : {})
  };
}

config.$schema ||= 'https://opencode.ai/config.json';
config.provider = config.provider && typeof config.provider === 'object' && !Array.isArray(config.provider) ? config.provider : {};
const existingProvider = config.provider['ieti-agents'] && typeof config.provider['ieti-agents'] === 'object'
  ? config.provider['ieti-agents']
  : {};
const existingOptions = existingProvider.options && typeof existingProvider.options === 'object'
  ? existingProvider.options
  : {};
config.provider['ieti-agents'] = {
  ...existingProvider,
  npm: '@ai-sdk/openai-compatible',
  name: 'IETI Agents',
  options: {
    ...existingOptions,
    baseURL,
    apiKey: '{env:PROXY_AGENTS_KEY}',
    timeout: 900000,
    chunkTimeout: 600000
  },
  models
};

const selected = typeof config.model === 'string' ? config.model : '';
const selectedIetiModel = selected.startsWith('ieti-agents/') ? selected.slice('ieti-agents/'.length) : '';
if (!selected || (selectedIetiModel && !models[selectedIetiModel])) {
  config.model = `ieti-agents/${Object.keys(models)[0]}`;
}

fs.writeFileSync(configOutputPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
NODE
chmod 600 "$CONFIG_TMP"

if [ "$SETTINGS_NEEDS_WRITE" -eq 1 ]; then
  SETTINGS_TMP="$(mktemp "$SETTINGS_FILE.tmp.XXXXXX")"
  node - "$SETTINGS_FILE" "$SETTINGS_TMP" "$API_BASE_URL" "$PROXY_AGENTS_KEY" <<'NODE'
const fs = require('node:fs');
const [settingsPath, outputPath, baseURL, apiKey] = process.argv.slice(2);
const managed = new Map([
  ['PROXY_AGENTS_BASE_URL', baseURL],
  ['PROXY_AGENTS_KEY', apiKey]
]);
const source = fs.existsSync(settingsPath) ? fs.readFileSync(settingsPath, 'utf8').split(/\r?\n/) : [];
const seen = new Set();
const output = [];
for (const line of source) {
  const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
  if (!match || !managed.has(match[1])) {
    if (line !== '' || output.length) output.push(line);
    continue;
  }
  if (!seen.has(match[1])) {
    output.push(`${match[1]}=${managed.get(match[1])}`);
    seen.add(match[1]);
  }
}
for (const [name, value] of managed) {
  if (!seen.has(name)) output.push(`${name}=${value}`);
}
while (output.length && output.at(-1) === '') output.pop();
fs.writeFileSync(outputPath, `${output.join('\n')}\n`, { mode: 0o600 });
NODE
  chmod 600 "$SETTINGS_TMP"
  mv "$SETTINGS_TMP" "$SETTINGS_FILE"
  SETTINGS_TMP=""
  if [ "$SETTINGS_FILE_EXISTED" -eq 1 ]; then
    echo "Updated $SETTINGS_FILE with the required IETI settings."
  else
    echo "Created $SETTINGS_FILE with permissions 600."
  fi
fi

mv "$CONFIG_TMP" "$CONFIG_FILE"
CONFIG_TMP=""

MODEL_COUNT="$(node -e 'const c=require(process.argv[1]); process.stdout.write(String(Object.keys(c.provider["ieti-agents"].models).length))' "$CONFIG_FILE")"
echo "IETI API key validated. Updated only the ieti-agents provider in $CONFIG_FILE with $MODEL_COUNT available model(s)."

MODE="${1:-desktop}"

if [ "$MODE" = "--sync-only" ]; then
  exit 0
fi

if [ "$MODE" = "cmd" ]; then
  shift
  if ! command -v opencode >/dev/null 2>&1; then
    echo "Error: opencode executable was not found."
    exit 1
  fi
  exec opencode "$@"
fi

if [ "$MODE" != "desktop" ]; then
  echo "Error: unknown mode '$MODE'. Use 'desktop', 'cmd', or '--sync-only'."
  exit 1
fi
if [ "$#" -gt 0 ]; then
  shift
fi

PROJECT_DEEP_LINK="$(node -e '
  const url = new URL("opencode://open-project");
  url.searchParams.set("directory", process.argv[1]);
  process.stdout.write(url.toString());
' "$SCRIPT_DIR")"

launch_desktop() {
  local desktop_bin="$1"
  local desktop_pid=""
  shift

  echo "Opening OpenCode Desktop project: $SCRIPT_DIR"
  "$desktop_bin" "$@" &
  desktop_pid=$!

  # Desktop restores its last workspace and intentionally does not use the
  # launching shell's current directory. A second-instance deep link selects
  # this script's project after the main process has registered its handler.
  sleep 1
  if ! "$desktop_bin" "$PROJECT_DEEP_LINK" >/dev/null 2>&1; then
    echo "Error: OpenCode Desktop started, but the project directory could not be sent to it."
    return 1
  fi

  wait "$desktop_pid"
}

if [ -n "${OPENCODE_DESKTOP_BIN:-}" ]; then
  launch_desktop "$OPENCODE_DESKTOP_BIN" "$@"
  exit $?
fi

OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
  APP="/Applications/OpenCode.app"
  if [ ! -d "$APP" ]; then
    echo "Error: OpenCode.app was not found in /Applications"
    exit 1
  fi
  BIN=""
  for candidate in "$APP/Contents/MacOS/"*; do
    if [ -f "$candidate" ]; then
      BIN="$candidate"
      break
    fi
  done
  if [ -z "$BIN" ]; then
    echo "Error: OpenCode desktop binary was not found."
    exit 1
  fi
  launch_desktop "$BIN" "$@"
  exit $?
fi

if [ "$OS" = "Linux" ]; then
  if command -v opencode-desktop >/dev/null 2>&1; then
    launch_desktop "$(command -v opencode-desktop)" "$@"
    exit $?
  fi
  if command -v OpenCode >/dev/null 2>&1; then
    launch_desktop "$(command -v OpenCode)" "$@"
    exit $?
  fi
  echo "Error: OpenCode Desktop was not found. Use '$0 cmd' for the command-line client."
  exit 1
fi

echo "Error: unsupported OS: $OS"
exit 1
