---
name: performance
description: Basic web performance review for HTML, CSS, JavaScript, assets and loading speed.
---

# Basic Web Performance Skill

Use this skill when the user asks to improve performance, loading speed, responsiveness or reduce unnecessary work in the browser.

## Check

### HTML

- Avoid unnecessary DOM depth.
- Avoid duplicated markup.
- Load scripts at the end of the body or with `defer` when appropriate.

### CSS

- Remove unused or duplicated CSS.
- Avoid overly complex selectors.
- Avoid unnecessary animations.
- Prefer transform and opacity for animations.

### JavaScript

- Avoid repeated DOM queries inside loops.
- Avoid unnecessary intervals or timers.
- Debounce expensive events like scroll, resize or input.
- Avoid blocking the main thread.

### Assets

- Use optimized image sizes.
- Avoid loading unused fonts, images or scripts.
- Prefer local assets when appropriate.

## Output

Return:

1. Performance problems found.
2. Concrete improvements.
3. Estimated impact: low, medium or high.
4. Files that should be changed.

## Rules

- Do not add dependencies unless explicitly requested.
- Do not rewrite everything.
- Prefer small targeted improvements.