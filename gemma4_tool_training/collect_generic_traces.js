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
const DEFAULT_MODEL = "vram16-local/active-model";
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
const TOOL_DISCIPLINE_TAGS = [
  "fake_tool_call",
  "tool_result_ignored",
  "verification_missing",
  "final_without_evidence",
  "unbounded_tool_loop",
  "premature_final",
  "wrong_file_or_context",
  "no_recovery_after_tool_failure",
  "web_tool_missing",
  "subagent_tool_missing",
  "unneeded_subagent",
  "harness_command_missing",
];

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
    keepTemp: false,
    allowTask: false,
    allowWeb: false,
  };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const nextValue = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--keep-temp") args.keepTemp = true;
    else if (arg === "--allow-task") args.allowTask = true;
    else if (arg === "--allow-web") args.allowWeb = true;
    else if (arg === "--dangerously-skip-permissions") args.dangerouslySkipPermissions = true;
    else if (arg.startsWith("--tasks=")) args.tasks = arg.slice("--tasks=".length);
    else if (arg === "--tasks") args.tasks = nextValue();
    else if (arg.startsWith("--resume-manifest=")) args.resumeManifest = arg.slice("--resume-manifest=".length);
    else if (arg === "--resume-manifest") args.resumeManifest = nextValue();
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

function completedTaskIds(manifestPath) {
  const completed = new Set();
  if (!manifestPath) return completed;
  if (!fs.existsSync(manifestPath)) throw new Error(`--resume-manifest does not exist: ${manifestPath}`);
  for (const [index, line] of fs.readFileSync(manifestPath, "utf8").split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row && row.task_id) completed.add(row.task_id);
    } catch (error) {
      throw new Error(`${manifestPath}:${index + 1}: invalid JSON: ${error.message}`);
    }
  }
  return completed;
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
  const provider = model.split("/")[0] || "vram16-local";
  const taskPermission = options.allowTask ? "allow" : "deny";
  const webPermission = options.allowWeb ? "allow" : "deny";
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
      task: taskPermission,
      todowrite: "deny",
      webfetch: webPermission,
      websearch: webPermission,
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
        name: "Local OpenAI-compatible",
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
        tool_focus: task.tool_focus || [],
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
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        code: 127,
        signal: null,
        timedOut,
        stdout,
        stderr: `${stderr}\n${error.stack || error.message}`,
        startedAt,
        endedAt: new Date().toISOString(),
      });
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, timedOut, stdout, stderr, startedAt, endedAt: new Date().toISOString() });
    });
  });
}

function classifyTrace(run, task) {
  const text = `${run.stdout}\n${run.stderr}`;
  const events = [];
  const assistantText = run.stdout
    .split(/\r?\n/)
    .map((line) => {
      try {
        const event = JSON.parse(line);
        events.push(event);
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
  const dryRun = run.stdout.startsWith("Dry run");
  const toolUse = dryRun
    ? {
        counts: { read: 1, edit: 1, bash: 1 },
        totalCalls: 3,
        verificationRun: true,
        expectedVerify: task.verify || [],
        readExpectedFile: true,
        editedExpectedFile: true,
        emptyToolResults: 0,
        repeatedEmptyToolResults: 0,
        calls: [],
      }
    : summarizeToolUse(events, task);
  const issueTags = classifyIssueTags({
    run,
    task,
    forbidden,
    missingFinalMarkers,
    missingExpectations,
    toolUse,
    visibleText,
  });
  const accepted =
    run.code === 0 &&
    !run.timedOut &&
    forbidden.length === 0 &&
    missingFinalMarkers.length === 0 &&
    missingExpectations.length === 0 &&
    !issueTags.some((tag) => TOOL_DISCIPLINE_TAGS.includes(tag));
  return {
    accepted,
    forbidden,
    missingFinalMarkers,
    missingExpectations,
    issueTags,
    toolUse,
    assistantTextChars: assistantText.length,
  };
}

function summarizeToolUse(events, task) {
  const calls = [];
  const counts = {};
  for (const event of events) {
    if (!event || event.type !== "tool_use" || !event.part) continue;
    const part = event.part;
    const tool = part.tool || "unknown";
    counts[tool] = (counts[tool] || 0) + 1;
    const state = part.state || {};
    const input = state.input || {};
    const output = typeof state.output === "string" ? state.output : "";
    calls.push({
      tool,
      status: state.status || null,
      filePath: input.filePath || input.path || null,
      command: input.command || input.cmd || null,
      outputChars: output.length,
      emptyOutput: output.trim().length === 0 || /No files found/i.test(output),
    });
  }
  const verifyCommands = task.verify || [];
  const bashCommands = calls.filter((call) => call.tool === "bash").map((call) => call.command || "");
  const verificationRun = verifyCommands.some((verify) =>
    bashCommands.some((command) => normalizeCommand(command).includes(normalizeCommand(String(verify))))
  );
  const expectedFiles = new Set(
    (task.files || [])
      .map((file) => file.path)
      .concat((task.expect || []).filter((item) => String(item).includes("/")))
      .map((item) => String(item))
  );
  const readFiles = new Set(calls.filter((call) => call.tool === "read" && call.filePath).map((call) => relativeToolPath(call.filePath)));
  const editedFiles = new Set(calls.filter((call) => call.tool === "edit" && call.filePath).map((call) => relativeToolPath(call.filePath)));
  return {
    counts,
    totalCalls: calls.length,
    verificationRun,
    expectedVerify: verifyCommands,
    readExpectedFile: [...expectedFiles].some((file) => readFiles.has(file)),
    editedExpectedFile: [...expectedFiles].some((file) => editedFiles.has(file)),
    emptyToolResults: calls.filter((call) => call.emptyOutput).length,
    repeatedEmptyToolResults: repeatedEmptyToolResults(calls),
    calls: calls.slice(0, 30),
  };
}

function normalizeCommand(command) {
  return String(command || "").replace(/\s+/g, " ").trim();
}

function relativeToolPath(filePath) {
  const text = String(filePath || "");
  const marker = "/src/";
  if (text.includes(marker)) return `src/${text.split(marker).pop()}`;
  const testMarker = "/tests/";
  if (text.includes(testMarker)) return `tests/${text.split(testMarker).pop()}`;
  const jsTestMarker = "/test/";
  if (text.includes(jsTestMarker)) return `test/${text.split(jsTestMarker).pop()}`;
  return text;
}

function repeatedEmptyToolResults(calls) {
  let streak = 0;
  let maxStreak = 0;
  for (const call of calls) {
    if (call.emptyOutput) {
      streak += 1;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 0;
    }
  }
  return maxStreak;
}

function classifyIssueTags({ run, task, forbidden, missingFinalMarkers, missingExpectations, toolUse, visibleText }) {
  const tags = [];
  if (run.timedOut) tags.push("timeout_or_loop", "unbounded_tool_loop");
  if (forbidden.length > 0) tags.push("visible_pseudo_tool_or_hidden_channel", "fake_tool_call");
  if (missingFinalMarkers.length > 0) tags.push("missing_final_markers");
  if (missingExpectations.length > 0) tags.push("missed_required_task_context");
  if ((task.verify || []).length > 0 && !toolUse.verificationRun) tags.push("verification_missing");
  if (toolUse.totalCalls > 0 && !toolUse.verificationRun && missingFinalMarkers.length === 0) tags.push("final_without_evidence");
  if ((task.kind || "").includes("programming") && !toolUse.editedExpectedFile) tags.push("wrong_file_or_context");
  if (toolUse.repeatedEmptyToolResults >= 2) tags.push("no_recovery_after_tool_failure");
  if (toolUse.totalCalls === 0 && /Changed files|Verification|Remaining risk/i.test(visibleText)) tags.push("premature_final");
  if (toolUse.totalCalls > 0 && missingExpectations.length > 0) tags.push("tool_result_ignored");
  const focus = new Set(task.tool_focus || []);
  if (focus.has("web") && !((toolUse.counts.webfetch || 0) + (toolUse.counts.websearch || 0))) tags.push("web_tool_missing");
  if (focus.has("subagent") && !(toolUse.counts.task || 0)) tags.push("subagent_tool_missing");
  if (focus.has("no_subagent") && (toolUse.counts.task || 0)) tags.push("unneeded_subagent");
  if (focus.has("harness") && !(toolUse.counts.bash || 0)) tags.push("harness_command_missing");
  if (tags.length === 0) tags.push(run.code === 0 && !run.timedOut ? "accepted_trace_pattern" : "uncategorized_trace_rewrite");
  return [...new Set(tags)];
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

  try {
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
      permissions: {
        task: args.allowTask,
        web: args.allowWeb,
      },
      prompt: task.prompt,
      verify: task.verify || [],
      expect: task.expect || [],
      status: run.timedOut ? "timeout" : run.code === 0 ? "completed" : "failed",
      exit_code: run.code,
      signal: run.signal,
      accepted: classification.accepted,
      classification,
      workspace: args.keepTemp ? projectDir : null,
      temp_cleaned: !args.keepTemp,
      log_file: logFile,
      started_at: run.startedAt,
      ended_at: run.endedAt,
      note: classification.accepted
        ? "candidate accepted trace; inspect before dataset inclusion"
        : "raw failure or incomplete trace; rewrite into corrected assistant target before training",
    };
  } finally {
    if (!args.keepTemp) {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
      fs.rmSync(stateRoot, { recursive: true, force: true });
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const selectedIds = args.ids ? new Set(args.ids) : undefined;
  const completedIds = completedTaskIds(args.resumeManifest);
  const tasks = readJsonl(args.tasks)
    .filter((task) => {
      if (args.id) return task.id === args.id;
      if (selectedIds) return selectedIds.has(task.id);
      return true;
    })
    .filter((task) => !completedIds.has(task.id))
    .slice(0, args.limit || undefined);
  if (tasks.length === 0) {
    if (args.resumeManifest && completedIds.size > 0) {
      console.error(`resume complete: all selected tasks already exist in ${args.resumeManifest}`);
      return;
    }
    throw new Error(args.id ? `unknown task id: ${args.id}` : "no tasks selected");
  }

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
