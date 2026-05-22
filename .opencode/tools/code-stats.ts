import { tool } from "@opencode-ai/plugin"
import { readdir, readFile } from "node:fs/promises"
import { extname, join, relative } from "node:path"

const ignoredDirs = new Set([".git", "node_modules", ".opencode", "dist", "build"])

async function scan(dir: string, root: string) {
  const entries = await readdir(dir, { withFileTypes: true })
  const result: Record<string, { files: number; lines: number }> = {}

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) continue

      const child = await scan(fullPath, root)
      for (const [ext, stats] of Object.entries(child)) {
        result[ext] ??= { files: 0, lines: 0 }
        result[ext].files += stats.files
        result[ext].lines += stats.lines
      }
    }

    if (entry.isFile()) {
      const ext = extname(entry.name) || "(no extension)"

      try {
        const text = await readFile(fullPath, "utf8")
        const lines = text.split("\n").length

        result[ext] ??= { files: 0, lines: 0 }
        result[ext].files++
        result[ext].lines += lines
      } catch {
        // Ignore binary or unreadable files
      }
    }
  }

  return result
}

export default tool({
  description: "Count files and lines of code by extension",
  args: {},

  async execute() {
    const root = process.cwd()
    const stats = await scan(root, root)

    const rows = Object.entries(stats)
      .sort((a, b) => b[1].lines - a[1].lines)
      .map(([ext, s]) => `${ext}: ${s.files} files, ${s.lines} lines`)

    return rows.length ? rows.join("\n") : "No readable files found."
  },
})