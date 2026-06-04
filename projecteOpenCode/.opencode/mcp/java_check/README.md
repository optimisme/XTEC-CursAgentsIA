# java_check MCP

Local MCP server for basic Java validation.

## Tools

- `check_java`: compiles one or more project-relative `.java` files with `javac -d <temporary-dir>`. Class files are written outside the project and removed after the check.

Example:

```json
{
  "files": ["src/Main.java"]
}
```

## Install

From the project root:

```sh
npm install --prefix .opencode/mcp/java_check
```

## Test

```sh
npm --prefix .opencode/mcp/java_check test
```
