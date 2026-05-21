import { tool } from "@opencode-ai/plugin"
import Database from "better-sqlite3"

export default tool({
  description: "Search students in the local SQLite database",
  args: {
    name: tool.schema.string().describe("Student name to search"),
  },

  async execute(args) {
    const db = new Database("data/school.db", { readonly: true })

    const rows = db
      .prepare(`
        SELECT id, name, email, group_name
        FROM students
        WHERE name LIKE ?
        LIMIT 10
      `)
      .all(`%${args.name}%`)

    db.close()

    return JSON.stringify(rows, null, 2)
  },
})