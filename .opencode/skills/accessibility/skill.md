---
name: accessibility
description: Basic accessibility review for HTML, CSS and JavaScript web projects.
---

# Basic Accessibility Skill

Use this skill when the user asks to improve accessibility, review A11y issues, or make the interface easier to use with keyboard and screen readers.

## Check

### HTML structure

- Use semantic HTML when possible.
- Use `<button>` for actions.
- Use `<a>` for navigation.
- Use one clear `<h1>` per page.
- Keep heading levels logical.

### Forms

- Every input should have a visible or accessible label.
- Use `for` and `id` correctly.
- Error messages should be clear.

### Images

- Informative images need meaningful `alt` text.
- Decorative images should use `alt=""`.

### Keyboard

- Interactive elements must be reachable with the keyboard.
- Avoid removing visible focus styles.
- Custom controls must support keyboard interaction.

### ARIA

- Prefer semantic HTML before ARIA.
- Do not add ARIA when native HTML already solves the problem.

## Output

Return:

1. Accessibility problems found.
2. Concrete fixes.
3. Files that should be changed.

## Rules

- Do not add external libraries.
- Keep changes simple.
- Prefer native HTML elements.