---
name: code-review
description: "A skill for reviewing code changes in a simple static personal notes web app."
---

# Code Review Skill

Review code changes in a simple static personal notes web app (HTML, CSS, JavaScript).

## Checklist

1. **Acceptance criteria** — does the implementation satisfy every criterion in the current task?
2. **Existing features intact** — verify that previously working features (note creation, listing, editing, deletion, persistence) still function correctly.
3. **Readability** — are HTML, CSS, and JavaScript simple, well-structured, and easy to follow? Avoid overly complex selectors, deeply nested logic, or cryptic variable names.
4. **localStorage safety** — if localStorage is used, check for null/undefined handling, `JSON.parse` error handling, and that keys are namespaced to avoid collisions.
5. **No large refactors** — the change should not rewrite entire files or restructure the app architecture. Prefer small, concrete fixes over broad rewrites.
6. **Minimal diff** — the change should touch only what is necessary to meet the acceptance criteria. No unrelated styling tweaks, renames, or dead code removal.
