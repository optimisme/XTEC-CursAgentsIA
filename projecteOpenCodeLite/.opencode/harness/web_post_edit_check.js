#!/usr/bin/env node
import fs from "fs";
import path from "path";

const listFile = process.argv[2];

function fail(reason, file, detail) {
  console.error(JSON.stringify({ ok: false, reason, file, detail }));
  process.exit(1);
}

function readChangedFiles(file) {
  if (!file || !fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function extractScripts(source) {
  const scripts = [];
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(source))) {
    scripts.push(match[1]);
  }
  return scripts.join("\n");
}

function functionBodies(source) {
  const bodies = [];
  const functionRegex = /function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;
  let match;
  while ((match = functionRegex.exec(source))) {
    const name = match[1];
    let index = functionRegex.lastIndex;
    let depth = 1;
    while (index < source.length && depth > 0) {
      const char = source[index];
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;
      index += 1;
    }
    if (depth === 0) {
      bodies.push({ name, body: source.slice(functionRegex.lastIndex, index - 1) });
    }
  }
  return bodies;
}

function checkSource(file, source) {
  const timerRegex = /\b(setInterval|setTimeout|requestAnimationFrame)\s*\(\s*([A-Za-z_$][\w$]*)/g;
  const seen = new Map();
  let match;
  while ((match = timerRegex.exec(source))) {
    const key = `${match[1]}:${match[2]}`;
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  for (const [key, count] of seen) {
    if (count > 1) {
      fail("duplicate_timer_or_animation_callback", file, `${key} appears ${count} times`);
    }
  }

  for (const { name, body } of functionBodies(source)) {
    const lowerName = name.toLowerCase();
    const isRenderLike = /^(draw|render)/.test(lowerName);
    if (isRenderLike && /\brequestAnimationFrame\s*\(/.test(body)) {
      fail("request_animation_frame_inside_render_function", file, `${name} contains requestAnimationFrame`);
    }
  }
}

const changedFiles = readChangedFiles(listFile);
for (const file of changedFiles) {
  const resolved = path.resolve(file);
  if (!fs.existsSync(resolved)) continue;
  const source = fs.readFileSync(resolved, "utf8");
  if (file.endsWith(".html")) {
    checkSource(file, extractScripts(source));
  } else if (file.endsWith(".js")) {
    checkSource(file, source);
  }
}

console.log(JSON.stringify({ ok: true, files_checked: changedFiles.length }));
