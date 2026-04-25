# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Astro 5 static site, deployed to GitHub Pages. Brimble-inspired editorial
design. Posts authored either as Markdown in `src/content/posts/` or in
Notion (synced down to Markdown via `npm run sync-notion`).

## Commands

- **Dev server**: `npm run dev` (http://localhost:4321)
- **Production build**: `npm run build` (runs `astro build && pagefind --site dist`)
- **Preview build**: `npm run preview`
- **Sync from Notion**: `npm run sync-notion` (requires `.env` with `NOTION_TOKEN` and `NOTION_DATABASE_ID`)

## Project structure

- **`src/content/posts/`** — blog posts (Markdown / MDX), Zod-validated.
- **`src/content/pages/`** — about, colophon, etc.
- **`src/content.config.ts`** — front-matter schema. Edit here when adding fields.
- **`src/layouts/`** — `BaseLayout`, `PostLayout`, `PageLayout`.
- **`src/components/`** — Astro components (Header, Footer, TOC, Giscus, ShareRow, …).
- **`src/pages/`** — file-based routes. `[...slug].astro` patterns generate per-post pages.
- **`src/styles/`** — design tokens + `prose` styles. Single source of truth for color/type.
- **`src/site.ts`** — site-wide config (title, nav, Giscus, repo URLs).
- **`scripts/sync-notion.mjs`** — Notion → Markdown sync. Manual, runs locally.
- **`public/`** — static assets served at root (favicons, images). Fonts come from Fontsource via `node_modules`.

## Content conventions

- Front matter is YAML between `---` delimiters.
- Required fields: `title`, `date`. Everything else is optional with sensible defaults.
- Image references use `/images/posts/<slug>/<file>` — these live in `public/images/posts/`.
- Posts synced from Notion include a `notion_id` field; do not edit them by hand (they get overwritten on the next sync).
- Math: `$inline$` and `$$block$$` (KaTeX).
- Code fences support `language` + Shiki transformers (e.g. `// [!code highlight]`, `// [!code ++]`, `// [!code --]`).
- Callouts: GitHub-style `> [!note]`, `> [!tip]`, `> [!important]`, `> [!warning]`, `> [!caution]`.

## Important rules

- The design tokens in `src/styles/tokens.css` are the single source of truth for color, type, and spacing — change them there, never hard-code.
- Body copy is serif (Source Serif 4); UI/headings are sans (Inter); code is mono (JetBrains Mono). All self-hosted via Fontsource.
- Reading column is capped at `--measure` (68ch). Don't widen.
- Dark mode is `prefers-color-scheme` only — no toggle.
- The Notion token must NEVER be committed or used in CI.
