#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const args = process.argv.slice(2);
const jsonlPath = args.find((arg) => !arg.startsWith("--")) || "tasks/harness-prompt-tests.jsonl";
const idArg = args.find((arg) => arg.startsWith("--id="));
const idFilter = idArg ? idArg.slice("--id=".length) : null;
const timeoutArg = args.find((arg) => arg.startsWith("--timeout="));
const timeout = timeoutArg ? timeoutArg.slice("--timeout=".length) : "420";

function readTests(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const tests = readTests(jsonlPath).filter((test) => !idFilter || test.id === idFilter);
if (tests.length === 0) {
  console.error(`No prompt tests matched ${idFilter || jsonlPath}`);
  process.exit(2);
}

let failed = 0;
for (const test of tests) {
  console.log(`\n=== ${test.id} ===`);
  console.log(test.prompt);
  const result = spawnSync("./run_opencode.sh", ["run", test.prompt], {
    env: { ...process.env, HARNESS_RUN_TIMEOUT_SECONDS: timeout },
    encoding: "utf8",
    stdio: "inherit"
  });
  if (result.status !== 0) {
    failed += 1;
    console.error(`FAILED ${test.id}: exit ${result.status}`);
  } else {
    console.log(`PASSED ${test.id}`);
  }
}

process.exit(failed === 0 ? 0 : 1);
