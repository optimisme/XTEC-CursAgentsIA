import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reportsPath = path.join(__dirname, "reports.jsonl");

function ensureReportsFile() {
  if (!fs.existsSync(reportsPath)) {
    fs.writeFileSync(reportsPath, "", "utf-8");
  }
}

async function main() {
  const server = new McpServer({
    name: "task-contract",
    version: "1.0.0"
  });

  server.tool(
    "submit_task_report",
    {
      taskId: z.string().describe("The task identifier (required)"),
      status: z.enum(["done", "blocked"]).describe("Status of the task: 'done' or 'blocked'"),
      changedFiles: z.array(z.string()).describe("Array of file paths that were changed"),
      verification: z.array(z.string()).describe("Array of verification checks performed"),
      notes: z.string().optional().describe("Optional notes about the report")
    },
    async ({ taskId, status, changedFiles, verification, notes }) => {
      const report = {
        taskId,
        status,
        changedFiles,
        verification,
        notes: notes || "",
        submittedAt: new Date().toISOString()
      };

      try {
        ensureReportsFile();

        const reportLine = JSON.stringify(report);
        fs.appendFileSync(reportsPath, reportLine + "\n", "utf-8");

        return {
          content: [
            {
              type: "text",
              text: `Task report submitted successfully.\nTask: ${taskId}\nStatus: ${status}\nFiles: ${changedFiles.join(", ")}\nChecks: ${verification.join(", ")}${notes ? `\nNotes: ${notes}` : ""}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Failed to write report to file: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("task-contract MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
