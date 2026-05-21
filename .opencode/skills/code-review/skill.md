---
name: code-review
description: Basic pragmatic code review for web projects.
---

# Basic Code Review Skill

Use this skill when the user asks to review code, detect bugs, improve maintainability or check pending changes.

## Check

### Correctness

- Look for possible bugs.
- Check edge cases.
- Check if the code does what the user asked.

### Simplicity

- Prefer simple code.
- Avoid unnecessary abstractions.
- Avoid duplicated logic when it can be extracted clearly.

### Maintainability

- Check naming.
- Check file organization.
- Check if functions are too long or do too many things.

### Consistency

- Follow the existing style of the project.
- Do not introduce unrelated formatting changes.

### Risk

- Identify changes that could break existing behavior.
- Suggest tests when useful.

## Output

Return:

1. Main issues found.
2. Suggested fixes.
3. Risk level.
4. Files affected.

## Rules

- Do not comment on personal style unless it affects maintainability.
- Do not rewrite the whole project.
- Prefer small, reviewable changes.