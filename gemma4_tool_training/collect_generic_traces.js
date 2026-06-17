#!/usr/bin/env node
/*
 * Collect OpenCode-like programming traces from isolated generic fixtures.
 *
 * Raw failures are useful for diagnosis, but should be rewritten into corrected
 * assistant targets before they enter the SFT dataset.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const DEFAULT_TASKS = "tasks/generic_programming_tasks.jsonl";
const DEFAULT_OUTPUT_DIR = "traces/generic";
const DEFAULT_MODEL = "vram16-vllm/active-model";
const DEFAULT_ENDPOINT = "http://127.0.0.1:8002/v1";
const DEFAULT_TIMEOUT_MS = 12 * 60 * 1000;
const FORBIDDEN_PATTERNS = [
  /<\|tool_call/i,
  /<tool_call\|>/i,
  /<\|channel/i,
  /<channel\|>/i,
  /call:task/i,
  /safe_editor/i,
  /agent_contract/i,
];
const FINAL_MARKERS = ["Changed files", "Verification", "Remaining risk"];

function parseArgs(argv) {
  const args = {
    tasks: DEFAULT_TASKS,
    outputDir: DEFAULT_OUTPUT_DIR,
    model: DEFAULT_MODEL,
    endpoint: DEFAULT_ENDPOINT,
    sourceLabel: "vram16",
    timeoutMs: DEFAULT_TIMEOUT_MS,
    parallel: 1,
    reasoning: false,
    outputTokens: 8192,
    dryRun: false,
    dangerouslySkipPermissions: false,
  };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const nextValue = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--dangerously-skip-permissions") args.dangerouslySkipPermissions = true;
    else if (arg.startsWith("--tasks=")) args.tasks = arg.slice("--tasks=".length);
    else if (arg === "--tasks") args.tasks = nextValue();
    else if (arg.startsWith("--output-dir=")) args.outputDir = arg.slice("--output-dir=".length);
    else if (arg === "--output-dir") args.outputDir = nextValue();
    else if (arg.startsWith("--model=")) args.model = arg.slice("--model=".length);
    else if (arg === "--model") args.model = nextValue();
    else if (arg.startsWith("--endpoint=")) args.endpoint = arg.slice("--endpoint=".length);
    else if (arg === "--endpoint") args.endpoint = nextValue();
    else if (arg.startsWith("--source-label=")) args.sourceLabel = arg.slice("--source-label=".length);
    else if (arg === "--source-label") args.sourceLabel = nextValue();
    else if (arg.startsWith("--id=")) args.id = arg.slice("--id=".length);
    else if (arg === "--id") args.id = nextValue();
    else if (arg.startsWith("--ids=")) args.ids = arg.slice("--ids=".length).split(",").filter(Boolean);
    else if (arg === "--ids") args.ids = nextValue().split(",").filter(Boolean);
    else if (arg.startsWith("--limit=")) args.limit = Number.parseInt(arg.slice("--limit=".length), 10);
    else if (arg === "--limit") args.limit = Number.parseInt(nextValue(), 10);
    else if (arg.startsWith("--parallel=")) args.parallel = Number.parseInt(arg.slice("--parallel=".length), 10);
    else if (arg === "--parallel") args.parallel = Number.parseInt(nextValue(), 10);
    else if (arg.startsWith("--reasoning=")) args.reasoning = parseBool(arg.slice("--reasoning=".length), "--reasoning");
    else if (arg === "--reasoning") args.reasoning = parseBool(nextValue(), "--reasoning");
    else if (arg.startsWith("--output-tokens=")) args.outputTokens = Number.parseInt(arg.slice("--output-tokens=".length), 10);
    else if (arg === "--output-tokens") args.outputTokens = Number.parseInt(nextValue(), 10);
    else if (arg.startsWith("--timeout-ms=")) args.timeoutMs = Number.parseInt(arg.slice("--timeout-ms=".length), 10);
    else if (arg === "--timeout-ms") args.timeoutMs = Number.parseInt(nextValue(), 10);
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
    throw new Error("--timeout-ms must be a positive integer");
  }
  if (args.limit !== undefined && (!Number.isFinite(args.limit) || args.limit <= 0)) {
    throw new Error("--limit must be a positive integer");
  }
  if (!Number.isFinite(args.parallel) || args.parallel <= 0) {
    throw new Error("--parallel must be a positive integer");
  }
  if (!Number.isFinite(args.outputTokens) || args.outputTokens <= 0) {
    throw new Error("--output-tokens must be a positive integer");
  }
  if (args.id && args.ids) {
    throw new Error("use either --id or --ids, not both");
  }
  return args;
}

function parseBool(value, name) {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be true or false`);
}

function readJsonl(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${filePath}:${index + 1}: invalid JSON: ${error.message}`);
      }
    });
}

function ensureTask(task) {
  for (const field of ["id", "scenario", "kind", "prompt", "files", "expect"]) {
    if (!(field in task)) throw new Error(`${task.id || "<unknown>"}: missing ${field}`);
  }
  if (!Array.isArray(task.files) || task.files.length === 0) {
    throw new Error(`${task.id}: files must be a non-empty array`);
  }
  for (const file of task.files) {
    if (!file.path || file.path.includes("..")) throw new Error(`${task.id}: unsafe file path`);
    if (typeof file.content !== "string") throw new Error(`${task.id}:${file.path}: content must be a string`);
  }
}

function writeOpencodeConfig(projectDir, model, endpoint, options) {
  const provider = model.split("/")[0] || "vram16-vllm";
  const config = {
    $schema: "https://opencode.ai/config.json",
    model,
    enabled_providers: [provider],
    permission: {
      read: "allow",
      grep: "allow",
      glob: "allow",
      bash: "allow",
      edit: "allow",
      task: "deny",
      todowrite: "deny",
      webfetch: "deny",
      websearch: "deny",
      lsp: "deny",
      skill: "deny",
    },
    compaction: {
      auto: true,
      prune: true,
      reserved: 4096,
    },
    snapshot: false,
    instructions: ["AGENTS.md"],
    provider: {
      [provider]: {
        npm: "@ai-sdk/openai-compatible",
        name: "Local vLLM",
        options: {
          baseURL: endpoint,
          apiKey: "local",
          timeout: 900000,
          chunkTimeout: 600000,
        },
        models: {
          "active-model": {
            name: "Active Model",
            limit: {
              context: 32768,
              output: options.outputTokens,
            },
            max_tokens: options.outputTokens,
            tool_call: true,
            reasoning: options.reasoning,
          },
        },
      },
    },
  };
  fs.writeFileSync(path.join(projectDir, "opencode.json"), JSON.stringify(config, null, 2) + "\n");
}

function materializeProject(task, rootDir, model, endpoint, options) {
  const projectDir = path.join(rootDir, task.id);
  fs.mkdirSync(projectDir, { recursive: true });
  for (const file of task.files) {
    const destination = path.join(projectDir, file.path);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, file.content, "utf8");
  }
  fs.writeFileSync(
    path.join(projectDir, "AGENTS.md"),
    [
      "You are working in an isolated programming fixture.",
      "",
      "Use real OpenCode tools for repository work. Inspect relevant files before editing, make a targeted change, and run the focused verification command when available.",
      "Do not print fake tool-call markup, hidden-channel text, XML-like tool tags, or raw JSON tool-call simulations.",
      "If a tool result is empty or fails twice, stop and report the blocker instead of looping.",
      "",
      "Final response:",
      "- Changed files: exact paths only.",
      "- Verification: command/check and result.",
      "- Remaining risk: none or one concrete risk.",
      "",
    ].join("\n"),
    "utf8"
  );
  fs.writeFileSync(
    path.join(projectDir, "task.json"),
    JSON.stringify(
      {
        id: task.id,
        scenario: task.scenario,
        kind: task.kind,
        prompt: task.prompt,
        verify: task.verify || [],
        expect: task.expect || [],
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
  writeOpencodeConfig(projectDir, model, endpoint, options);
  return projectDir;
}

function runCommand(command, args, options, timeoutMs) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env || {}) },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5000).unref();
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, timedOut, stdout, stderr, startedAt, endedAt: new Date().toISOString() });
    });
  });
}

function classifyTrace(run, task) {
  const text = `${run.stdout}\n${run.stderr}`;
  const assistantText = run.stdout
    .split(/\r?\n/)
    .map((line) => {
      try {
        const event = JSON.parse(line);
        if (event && event.type === "text" && event.part && typeof event.part.text === "string") {
          return event.part.text;
        }
      } catch {
        if (run.stdout.startsWith("Dry run")) return line;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
  const visibleText = assistantText || run.stdout;
  const forbidden = FORBIDDEN_PATTERNS.filter((pattern) => pattern.test(visibleText)).map((pattern) => pattern.source);
  const missingFinalMarkers = FINAL_MARKERS.filter((marker) => !visibleText.includes(marker));
  const missingExpectations = (task.expect || []).filter((expected) => !text.toLowerCase().includes(String(expected).toLowerCase()));
  const accepted =
    run.code === 0 &&
    !run.timedOut &&
    forbidden.length === 0 &&
    missingFinalMarkers.length === 0 &&
    missingExpectations.length === 0;
  return { accepted, forbidden, missingFinalMarkers, missingExpectations, assistantTextChars: assistantText.length };
}

async function collectTask(task, args) {
  ensureTask(task);
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), `gemma4-tool-${task.id}-`));
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), `gemma4-opencode-state-${task.id}-`));
  const projectDir = materializeProject(task, workspaceRoot, args.model, args.endpoint, args);
  const logDir = path.resolve(args.outputDir);
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `${new Date().toISOString().replace(/[:.]/g, "-")}_${args.sourceLabel}_${task.id}.log`);

  const commandArgs = [
    "run",
    "--model",
    args.model,
    "--format",
    "json",
    "--dir",
    projectDir,
    task.prompt,
  ];
  if (args.dangerouslySkipPermissions) {
    commandArgs.splice(1, 0, "--dangerously-skip-permissions");
  }

  let run;
  if (args.dryRun) {
    run = {
      code: 0,
      signal: null,
      timedOut: false,
      stdout: [
        `Dry run for ${task.id}`,
        "Changed files: none",
        "Verification: not run in dry-run mode",
        "Remaining risk: real model trace not collected",
        ...(task.expect || []),
      ].join("\n"),
      stderr: "",
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
    };
  } else {
    const env = {
      XDG_DATA_HOME: path.join(stateRoot, "data"),
      XDG_CONFIG_HOME: path.join(stateRoot, "config"),
      XDG_CACHE_HOME: path.join(stateRoot, "cache"),
    };
    run = await runCommand("opencode", commandArgs, { cwd: projectDir, env }, args.timeoutMs);
  }

  fs.writeFileSync(logFile, `STDOUT\n${run.stdout}\n\nSTDERR\n${run.stderr}\n`, "utf8");
  const classification = classifyTrace(run, task);
  return {
    id: `${args.sourceLabel}_${task.id}_${Date.now()}`,
    task_id: task.id,
    scenario: task.scenario,
    kind: task.kind,
    source_label: args.sourceLabel,
    endpoint: args.endpoint,
    model: args.model,
    prompt: task.prompt,
    verify: task.verify || [],
    expect: task.expect || [],
    status: run.timedOut ? "timeout" : run.code === 0 ? "completed" : "failed",
    exit_code: run.code,
    signal: run.signal,
    accepted: classification.accepted,
    classification,
    workspace: projectDir,
    log_file: logFile,
    started_at: run.startedAt,
    ended_at: run.endedAt,
    note: classification.accepted
      ? "candidate accepted trace; inspect before dataset inclusion"
      : "raw failure or incomplete trace; rewrite into corrected assistant target before training",
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const selectedIds = args.ids ? new Set(args.ids) : undefined;
  const tasks = readJsonl(args.tasks)
    .filter((task) => {
      if (args.id) return task.id === args.id;
      if (selectedIds) return selectedIds.has(task.id);
      return true;
    })
    .slice(0, args.limit || undefined);
  if (tasks.length === 0) throw new Error(args.id ? `unknown task id: ${args.id}` : "no tasks selected");

  fs.mkdirSync(args.outputDir, { recursive: true });
  const manifestPath = path.join(args.outputDir, `manifest_${args.sourceLabel}_${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < tasks.length) {
      const task = tasks[nextIndex];
      nextIndex += 1;
      const result = await collectTask(task, args);
      fs.appendFileSync(manifestPath, JSON.stringify(result) + "\n", "utf8");
      console.log(JSON.stringify({
        task_id: result.task_id,
        status: result.status,
        accepted: result.accepted,
        log_file: result.log_file,
      }));
    }
  }
  const workerCount = Math.min(args.parallel, tasks.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  console.error(`manifest: ${manifestPath}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
