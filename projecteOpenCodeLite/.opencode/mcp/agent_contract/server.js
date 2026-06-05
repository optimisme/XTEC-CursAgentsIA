#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "agent_contract",
  version: "1.0.0"
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");
const auditLog = path.join(__dirname, "contracts.jsonl");

function textResult(text) {
  return { content: [{ type: "text", text }] };
}

function formatError(error) {
  return JSON.stringify({ ok: false, error: error?.message || String(error) });
}

function assertSafeProjectFile(file) {
  if (typeof file !== "string" || !file.trim()) {
    throw new Error("file path must be a non-empty string");
  }
  if (file.includes("\0") || /<\||\|>|<tool_call|tool_call|<channel/i.test(file)) {
    throw new Error(`rejected suspicious file path: ${file}`);
  }
  const resolved = path.resolve(projectRoot, file);
  if (!resolved.startsWith(`${projectRoot}${path.sep}`)) {
    throw new Error(`file must stay inside the project root: ${file}`);
  }
}

function assertFiles(files, fieldName) {
  for (const file of files || []) {
    try {
      assertSafeProjectFile(file);
    } catch (error) {
      throw new Error(`${fieldName}: ${error.message}`);
    }
  }
}

const changeSchema = z.object({
  file: z.string().min(1),
  target: z.string().min(1),
  change_type: z.enum(["replace_lines", "insert_lines", "delete_lines", "create_file", "manual_review"]),
  instruction: z.string().min(1),
  reason: z.string().min(1),
  start_line: z.number().int().min(1).optional(),
  end_line: z.number().int().min(1).optional()
}).strict().superRefine((value, ctx) => {
  if (value.start_line !== undefined && value.end_line !== undefined && value.end_line < value.start_line) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "end_line must be greater than or equal to start_line",
      path: ["end_line"]
    });
  }
});

const planSchema = z.object({
  status: z.enum(["planned", "blocked"]),
  agent_role: z.literal("planner"),
  can_modify_files: z.literal(false),
  files_read: z.array(z.string().min(1)).default([]),
  files_changed: z.array(z.string()).max(0),
  summary: z.string().min(1),
  recommended_editor: z.enum(["safe_editor", "function_editor", "code_editor", "none"]),
  required_changes: z.array(changeSchema),
  verification_steps: z.array(z.string().min(1)),
  risks: z.array(z.string().min(1)).default([]),
  blocker: z.string().optional()
}).strict().superRefine((value, ctx) => {
  if (value.status === "planned" && value.required_changes.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "planned status requires at least one required change",
      path: ["required_changes"]
    });
  }
  if (value.status === "blocked" && !value.blocker) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "blocked status requires blocker",
      path: ["blocker"]
    });
  }
  if (value.status === "planned" && value.recommended_editor === "none") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "planned status requires a recommended editor",
      path: ["recommended_editor"]
    });
  }
});

const editChangeSchema = z.object({
  file: z.string().min(1),
  summary: z.string().min(1),
  start_line: z.number().int().min(1).optional(),
  end_line: z.number().int().min(1).optional()
}).strict().superRefine((value, ctx) => {
  if (value.start_line !== undefined && value.end_line !== undefined && value.end_line < value.start_line) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "end_line must be greater than or equal to start_line",
      path: ["end_line"]
    });
  }
});

const verificationSchema = z.object({
  safe_edit_verified: z.boolean(),
  syntax_verified: z.boolean(),
  functional_verified: z.boolean(),
  notes: z.string().min(1)
}).strict();

const editResultSchema = z.object({
  status: z.enum(["changed", "unchanged", "blocked"]),
  agent_role: z.enum(["safe_editor", "function_editor", "code_editor"]),
  files_changed: z.array(z.string().min(1)),
  tools_used: z.array(z.string().min(1)),
  changes: z.array(editChangeSchema),
  verification: verificationSchema,
  remaining_risks: z.array(z.string().min(1)).default([]),
  blocker: z.string().optional()
}).strict().superRefine((value, ctx) => {
  if (value.status === "changed" && value.files_changed.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "changed status requires files_changed",
      path: ["files_changed"]
    });
  }
  if (value.status === "changed" && value.changes.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "changed status requires changes",
      path: ["changes"]
    });
  }
  if (value.status === "unchanged" && value.files_changed.length !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "unchanged status cannot include files_changed",
      path: ["files_changed"]
    });
  }
  if (value.status === "blocked" && !value.blocker) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "blocked status requires blocker",
      path: ["blocker"]
    });
  }
  if (value.files_changed.length > 0 && !value.tools_used.some((tool) => tool.startsWith("safe_edit_"))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "changed files require at least one safe_edit_* tool in tools_used",
      path: ["tools_used"]
    });
  }
  if (value.files_changed.length > 0 && !value.verification.safe_edit_verified) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "changed files require verification.safe_edit_verified=true",
      path: ["verification", "safe_edit_verified"]
    });
  }
});

function appendAudit(kind, payload) {
  fs.appendFileSync(auditLog, `${JSON.stringify({
    kind,
    timestamp: new Date().toISOString(),
    payload
  })}\n`);
}

function registerContractTool(name, description, schema, handler) {
  server.registerTool(name, { description, inputSchema: schema.shape }, async (input) => {
    try {
      const parsed = schema.parse(input || {});
      return textResult(JSON.stringify(handler(parsed)));
    } catch (error) {
      return textResult(formatError(error));
    }
  });
}

function submitPlan(input) {
  assertFiles(input.files_read, "files_read");
  assertFiles(input.files_changed, "files_changed");
  for (const change of input.required_changes) {
    assertSafeProjectFile(change.file);
  }
  appendAudit("plan", input);
  return {
    ok: true,
    contract: "plan",
    status: input.status,
    recommended_editor: input.recommended_editor,
    changes: input.required_changes.length
  };
}

function submitEditResult(input) {
  assertFiles(input.files_changed, "files_changed");
  for (const change of input.changes) {
    assertSafeProjectFile(change.file);
  }
  appendAudit("edit_result", input);
  return {
    ok: true,
    contract: "edit_result",
    status: input.status,
    files_changed: input.files_changed
  };
}

registerContractTool(
  "submit_plan",
  "Submit the final read-only planner contract. Planners must call this as the final result; it rejects claimed file changes.",
  planSchema,
  submitPlan
);

registerContractTool(
  "submit_edit_result",
  "Submit the final editor contract after safe_edit actions and verification. Changed files require safe_edit tool names and safe_edit verification.",
  editResultSchema,
  submitEditResult
);

async function selfTest() {
  if (fs.existsSync(auditLog)) fs.unlinkSync(auditLog);

  const acceptedPlan = submitPlan({
    status: "planned",
    agent_role: "planner",
    can_modify_files: false,
    files_read: ["webs/app.js"],
    files_changed: [],
    summary: "Move drawing logic into pointer handlers.",
    recommended_editor: "code_editor",
    required_changes: [{
      file: "webs/app.js",
      target: "draw",
      change_type: "replace_lines",
      instruction: "Use pointer positions to draw continuous lines.",
      reason: "Freehand drawing requires consecutive points."
    }],
    verification_steps: ["Run syntax check."],
    risks: ["Browser interaction is not covered."]
  });
  if (!acceptedPlan.ok || acceptedPlan.contract !== "plan") {
    throw new Error("valid plan was not accepted");
  }

  const badPlan = planSchema.safeParse({
    status: "planned",
    agent_role: "planner",
    can_modify_files: false,
    files_read: ["webs/app.js"],
    files_changed: ["webs/app.js"],
    summary: "Invalid claimed change.",
    recommended_editor: "code_editor",
    required_changes: [],
    verification_steps: [],
    risks: []
  });
  if (badPlan.success) {
    throw new Error("planner contract accepted files_changed");
  }

  const badEdit = editResultSchema.safeParse({
    status: "changed",
    agent_role: "code_editor",
    files_changed: ["webs/app.js"],
    tools_used: ["read"],
    changes: [{ file: "webs/app.js", summary: "Changed draw." }],
    verification: {
      safe_edit_verified: true,
      syntax_verified: true,
      functional_verified: false,
      notes: "Verified syntax."
    },
    remaining_risks: []
  });
  if (badEdit.success) {
    throw new Error("editor contract accepted changed files without safe_edit tool");
  }

  const acceptedEdit = submitEditResult({
    status: "changed",
    agent_role: "code_editor",
    files_changed: ["webs/app.js"],
    tools_used: ["safe_edit_safe_replace_lines", "safe_edit_safe_verify_file"],
    changes: [{ file: "webs/app.js", summary: "Changed draw." }],
    verification: {
      safe_edit_verified: true,
      syntax_verified: true,
      functional_verified: false,
      notes: "Verified with safe_edit."
    },
    remaining_risks: ["No browser interaction."]
  });
  if (!acceptedEdit.ok || acceptedEdit.contract !== "edit_result") {
    throw new Error("valid edit result was not accepted");
  }

  const audit = fs.readFileSync(auditLog, "utf8").trim().split("\n");
  if (audit.length !== 2) {
    throw new Error(`expected 2 audit rows, got ${audit.length}`);
  }
}

async function main() {
  if (process.argv.includes("--self-test")) {
    try {
      await selfTest();
      console.log("agent_contract self-test passed");
    } catch (error) {
      console.error(error?.stack || error);
      process.exit(1);
    }
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
