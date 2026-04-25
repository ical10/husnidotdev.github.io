---
title: Colophon
description: How this site is built.
---

## Stack

- **[Astro](https://astro.build)** for the static site, with content collections
  and Markdown/MDX support.
- **[Shiki](https://shiki.style)** for syntax highlighting (dual light/dark
  themes), with diff and line-highlight transformers.
- **[KaTeX](https://katex.org)** for math, via `remark-math` and `rehype-katex`.
- **[Pagefind](https://pagefind.app)** for static, on-site search.
- **[Giscus](https://giscus.app)** for comments, backed by GitHub Discussions.

## Typography

- **Inter** for headings, navigation, UI chrome.
- **Source Serif 4** for body copy. Long-form reading is the point of this
  site, so the column is capped at ~68 characters and the leading is generous.
- **JetBrains Mono** for code.
- All three are self-hosted via Fontsource — no Google Fonts hop.

## Design

A pared-down, single-column, editorial aesthetic — inspired by Brimble's
careers page and the rhythm of well-set books. Warm near-white background,
charcoal text, restrained navy for links, hairline rules for structure. Dark
mode follows your OS.

## Authoring

Posts are written either in Markdown directly (committed to
`src/content/posts/`) or in Notion. The Notion side syncs with
`npm run sync-notion`, which converts the database into Markdown, downloads
images locally, and writes them into the same folder.

## Deployment

GitHub Actions builds on every push to `main` and deploys to GitHub Pages.

## Source

The full source lives at <a href="https://github.com/ical10/website">github.com/ical10/website</a>.
