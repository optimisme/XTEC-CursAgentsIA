---
name: static-web
description: Rules for small static websites in the webs/ folder (plain HTML, CSS and JavaScript, no build step). Use it when creating, modifying or reviewing a page in webs/.
---

# Static web

## Goal

Small pages that open directly in a browser and are easy to read and to review.

## When to use it

- Creating a new page in `webs/`.
- Modifying or reviewing a page in `webs/`.

## Procedure

1. **Files.** One page is one `webs/<name>.html` file. Keep CSS and JavaScript inside it while it is short; when the script grows, move it to `webs/<name>.js`.
2. **No dependencies.** No frameworks, libraries, CDNs or build step. Only what the browser provides.
3. **HTML.** `<!DOCTYPE html>`, `<html lang>`, `<meta charset="utf-8">`, a viewport meta tag and a `<title>`. Use semantic elements (`main`, `button`, `label`).
4. **CSS.** A few custom properties for colours and sizes. The page must work on a narrow screen without horizontal scroll.
5. **JavaScript.** `const` and `let`, small functions, no globals beyond what the page needs. Keep the logic separate from the code that touches the DOM.
6. **Canvas.** Draw with `requestAnimationFrame` for animations, take the size from the element and scale for `devicePixelRatio`.
7. **Accessibility.** Controls reachable with the keyboard, visible focus, text alternatives for images and canvas, enough contrast.
8. **Language.** Code, names and comments in English. Texts shown to the user in the language the request asks for.

## Expected result

A page that opens without errors in the browser console, with no external requests, and that follows every rule above.
