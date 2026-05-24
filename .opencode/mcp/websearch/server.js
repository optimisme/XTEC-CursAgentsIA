#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "websearch",
  version: "1.0.0"
});

function textResult(text) {
  return {
    content: [{ type: "text", text }]
  };
}

function formatError(error) {
  return `Error: ${error?.message || String(error)}`;
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function cleanDuckDuckGoUrl(url) {
  try {
    const parsed = new URL(decodeHtml(url), "https://duckduckgo.com");
    const target = parsed.searchParams.get("uddg");
    if (target) return decodeURIComponent(target);
    return parsed.href;
  } catch {
    return decodeHtml(url);
  }
}

async function searchWeb({ query, max_results = 5 }) {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(searchUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; OpenCode project websearch MCP)"
    }
  });

  if (!response.ok) {
    return `Search failed with HTTP ${response.status} for query: ${query}`;
  }

  const html = await response.text();
  const rows = [];
  const pattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  for (const match of html.matchAll(pattern)) {
    rows.push({
      title: stripTags(match[2]),
      url: cleanDuckDuckGoUrl(match[1]),
      snippet: stripTags(match[3])
    });
    if (rows.length >= max_results) break;
  }

  if (!rows.length) {
    return `No parseable results returned for query: ${query}. Try a more specific query or use webfetch with a known URL.`;
  }

  return rows
    .map((result, index) => `${index + 1}. ${result.title}\n${result.url}\n${result.snippet}`)
    .join("\n\n");
}

server.registerTool(
  "websearch",
  {
    description: "Search the web and return concise text results with titles, URLs, and snippets.",
    inputSchema: {
      query: z.string().min(1),
      max_results: z.number().int().min(1).max(10).optional()
    }
  },
  async (input) => {
    try {
      const parsed = z.object({
        query: z.string().min(1),
        max_results: z.number().int().min(1).max(10).optional()
      }).parse(input || {});
      return textResult(await searchWeb(parsed));
    } catch (error) {
      return textResult(formatError(error));
    }
  }
);

async function main() {
  if (process.argv.includes("--self-test")) {
    const output = await searchWeb({ query: "Swiss railway clock design", max_results: 2 });
    if (!output.includes("http")) {
      throw new Error(`Unexpected search output: ${output}`);
    }
    console.log("websearch self-test passed");
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
