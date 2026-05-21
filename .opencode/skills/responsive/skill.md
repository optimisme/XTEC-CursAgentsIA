---
name: responsive
description: Basic responsive design review for mobile, tablet and desktop layouts.
---

# Basic Responsive Design Skill

Use this skill when the user asks to make a page responsive, improve mobile layout or adapt a web interface to different screen sizes.

## Check

### Layout

- The page should work on mobile, tablet and desktop.
- Avoid fixed widths that break on small screens.
- Use flexible units when useful: `%`, `rem`, `fr`, `minmax`, `clamp`.

### Navigation

- Navigation should remain usable on small screens.
- Avoid horizontal overflow.
- Buttons and links should be easy to tap.

### Text

- Text should remain readable on small screens.
- Avoid very small font sizes.
- Use reasonable line length.

### Cards and grids

- Cards should stack on small screens.
- Grids should adapt using media queries or responsive CSS functions.

## Output

Return:

1. Responsive issues found.
2. Suggested CSS changes.
3. Files that should be modified.
4. Screen sizes affected.

## Rules

- Do not add CSS frameworks.
- Keep the existing design style.
- Avoid unnecessary rewrites.