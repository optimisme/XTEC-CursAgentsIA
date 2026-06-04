#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "web_research",
  version: "1.0.0"
});

const USER_AGENT = "Mozilla/5.0 (compatible; OpenCodeWebResearch/1.0; +https://opencode.ai)";
const DEFAULT_TIMEOUT_MS = 12000;
const MAX_RESULTS = 8;
const MAX_SUMMARY_CHARS = 1800;
const MAX_SEARCHES_PER_SESSION = 3;
const searchHistory = [];

function textResult(text) {
  return { content: [{ type: "text", text }] };
}

function formatError(error) {
  return JSON.stringify({ ok: false, error: error?.message || String(error) });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function normalizeQuery(query) {
  const stopWords = new Set(["and", "or", "the", "a", "an", "of", "for", "to", "summary", "description"]);
  return String(query || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word && !stopWords.has(word))
    .sort()
    .join(" ");
}

function jaccardSimilarity(left, right) {
  const a = new Set(left.split(/\s+/).filter(Boolean));
  const b = new Set(right.split(/\s+/).filter(Boolean));
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  return intersection / (a.size + b.size - intersection);
}

function guardSearchLoop(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return;

  const similar = searchHistory.find((entry) => jaccardSimilarity(normalized, entry.normalized) >= 0.5);
  if (similar) {
    throw new Error(`Repeated similar web search detected. Previous query: "${similar.query}". New query: "${query}". Stop searching and use the previous results to answer or continue the requested task.`);
  }

  if (searchHistory.length >= MAX_SEARCHES_PER_SESSION) {
    throw new Error(`Search limit reached (${MAX_SEARCHES_PER_SESSION} searches in this session). Stop searching and use the results already returned.`);
  }

  searchHistory.push({ query, normalized });
}

function decodeHtml(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
}

function stripHtml(html) {
  return decodeHtml(String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

function normalizeDuckDuckGoUrl(rawUrl) {
  let url = decodeHtml(rawUrl);
  if (url.startsWith("//")) url = `https:${url}`;
  try {
    const parsed = new URL(url);
    const redirected = parsed.searchParams.get("uddg");
    return redirected ? decodeURIComponent(redirected) : url;
  } catch {
    return url;
  }
}

async function fetchText(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
        "Accept-Language": "ca-ES,es-ES,en;q=0.8"
      }
    });
    return {
      url: response.url || url,
      status: response.status,
      text: await response.text()
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, "i")
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match) return decodeHtml(match[1]).trim();
  }
  return "";
}

function extractTitle(html) {
  return decodeHtml(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDates(html) {
  const fields = ["article:published_time", "article:modified_time", "date", "dc.date", "dcterms.created", "pubdate", "lastmod"];
  const dates = new Set();
  for (const field of fields) {
    const value = extractMeta(html, field);
    if (value) dates.add(value);
  }
  for (const match of html.matchAll(/\b(?:20\d{2})[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])\b/g)) {
    dates.add(match[0]);
    if (dates.size >= 6) break;
  }
  return [...dates].slice(0, 6);
}

function summarizeHtml(html, maxChars = MAX_SUMMARY_CHARS) {
  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripHtml(match[1]))
    .filter((text) => text.length >= 50);
  const source = paragraphs.length ? paragraphs.join(" ") : stripHtml(html);
  return source.slice(0, maxChars).trim();
}

function parseDuckDuckGoResults(html, maxResults) {
  const results = [];
  const seen = new Set();
  const resultPattern = /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(resultPattern)) {
    const url = normalizeDuckDuckGoUrl(match[1]);
    if (!url || seen.has(url) || url.startsWith("https://duckduckgo.com/")) continue;
    seen.add(url);
    results.push({ title: stripHtml(match[2]), url });
    if (results.length >= maxResults) break;
  }

  if (results.length) return results;

  const fallbackPattern = /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(fallbackPattern)) {
    const url = normalizeDuckDuckGoUrl(match[1]);
    if (!url || seen.has(url) || url.includes("duckduckgo.com")) continue;
    seen.add(url);
    results.push({ title: stripHtml(match[2]).slice(0, 160), url });
    if (results.length >= maxResults) break;
  }

  return results;
}

async function searchDuckDuckGo(query, maxResults) {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetchText(url);
  return {
    engine: "duckduckgo_html",
    query,
    fetched_url: response.url,
    status: response.status,
    results: parseDuckDuckGoResults(response.text, maxResults)
  };
}

async function fetchSummary({ url, max_chars }) {
  const limit = clampInteger(max_chars, MAX_SUMMARY_CHARS, 300, 5000);
  const response = await fetchText(url);
  const html = response.text;
  return {
    ok: response.status >= 200 && response.status < 400,
    tool: "fetch_summary",
    fetched_at: new Date().toISOString(),
    url: response.url || url,
    status: response.status,
    title: extractMeta(html, "og:title") || extractTitle(html),
    description: extractMeta(html, "og:description") || extractMeta(html, "description"),
    dates: extractDates(html),
    summary: summarizeHtml(html, limit)
  };
}

async function searchWeb({ query, site, freshness, locale, max_results }) {
  const maxResults = clampInteger(max_results, 5, 1, MAX_RESULTS);
  const siteText = site ? `site:${site} ` : "";
  const freshnessText = freshness === "today" ? ` ${todayIso()}` : freshness && freshness !== "any" ? ` ${freshness}` : "";
  const localeText = locale ? ` ${locale}` : "";
  const searchQuery = `${siteText}${query}${freshnessText}${localeText}`.trim();
  guardSearchLoop(searchQuery);
  const search = await searchDuckDuckGo(searchQuery, maxResults);
  return {
    ok: true,
    tool: "search",
    searched_at: new Date().toISOString(),
    date_context: todayIso(),
    site: site || null,
    freshness: freshness || "any",
    ...search
  };
}

function registerJsonTool(name, description, schema, handler) {
  server.registerTool(
    name,
    {
      description,
      inputSchema: schema.shape
    },
    async (input) => {
      try {
        return textResult(JSON.stringify(await handler(schema.parse(input || {})), null, 2));
      } catch (error) {
        return textResult(formatError(error));
      }
    }
  );
}

registerJsonTool(
  "search",
  "Search the web once and return a compact JSON list of results. Use this instead of raw websearch.",
  z.object({
    query: z.string().min(2),
    site: z.string().min(3).optional().describe("Optional domain to limit results, for example rtve.es."),
    freshness: z.enum(["any", "today", "week", "month"]).optional().describe("Optional freshness hint. Use today for current-day prompts."),
    locale: z.string().optional().describe("Optional locale or language hint, for example ca-ES, es-ES, en-US."),
    max_results: z.number().int().min(1).max(MAX_RESULTS).optional()
  }),
  searchWeb
);

registerJsonTool(
  "fetch_summary",
  "Fetch one URL and return compact JSON with title, dates, description, and summary. Use only for URLs from web_research search tools or user-provided URLs.",
  z.object({
    url: z.string().url(),
    max_chars: z.number().int().min(300).max(5000).optional()
  }),
  fetchSummary
);

async function main() {
  if (process.argv.includes("--self-test")) {
    const normalized = normalizeQuery("Galaxian arcade game mechanics and visual style summary");
    if (!normalized.includes("galaxian") || normalized.includes("summary")) {
      throw new Error(`normalizeQuery self-test failed: ${normalized}`);
    }
    console.log("web_research self-test passed");
    return;
  }

  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
