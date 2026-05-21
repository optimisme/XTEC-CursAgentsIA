---
name: seo
description: Basic SEO review for HTML pages, metadata, links, headings and search engine visibility.
---

# Basic SEO Skill

Use this skill when the user asks to improve SEO, review metadata, optimize a page for search engines, or check how a page appears when shared.

## Goals

Improve basic search visibility without adding dependencies or changing the project architecture.

## Check

### Metadata

Every HTML page should have:

- A clear `<title>`.
- A useful `<meta name="description">`.
- A `<meta name="robots" content="index, follow">` when the page should be indexed.
- A canonical URL when the final public URL is known.

Example:

```html
<title>Running Dashboard - Training Analytics</title>
<meta name="description" content="Track running sessions, goals, distance, pace and progress from a simple dashboard.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://example.com/">