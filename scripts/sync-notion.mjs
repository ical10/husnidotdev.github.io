#!/usr/bin/env node
/**
 * Notion → Hugo-style Markdown sync.
 *
 * Usage:
 *   1. Copy .env.example to .env and fill in NOTION_TOKEN + NOTION_DATABASE_ID.
 *   2. Share your Notion database with the integration.
 *   3. npm run sync-notion
 *
 * The Notion database is the source of truth for any post it owns. Re-running
 * overwrites the corresponding Markdown file. Posts authored directly in
 * Markdown (i.e. without a `notion_id` front-matter field that this script
 * sets) are never touched.
 */

import 'dotenv/config';
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const POSTS_DIR = 'src/content/posts';
const IMAGES_DIR = 'public/images/posts';

const { NOTION_TOKEN, NOTION_DATABASE_ID } = process.env;
if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
  console.error('Missing NOTION_TOKEN or NOTION_DATABASE_ID. Copy .env.example to .env first.');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

const kebab = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const yaml = (v) => {
  if (Array.isArray(v)) return `[${v.map((x) => JSON.stringify(x)).join(', ')}]`;
  if (typeof v === 'string') return JSON.stringify(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
};

function readProp(props, name, fallback = null) {
  const p = props[name];
  if (!p) return fallback;
  switch (p.type) {
    case 'title':       return p.title.map((t) => t.plain_text).join('') || fallback;
    case 'rich_text':   return p.rich_text.map((t) => t.plain_text).join('') || fallback;
    case 'date':        return p.date?.start ?? fallback;
    case 'multi_select': return p.multi_select.map((o) => o.name);
    case 'select':      return p.select?.name ?? fallback;
    case 'checkbox':    return p.checkbox;
    case 'files':
      return p.files[0]?.file?.url ?? p.files[0]?.external?.url ?? fallback;
    default:            return fallback;
  }
}

async function downloadImage(url, destDir, filename) {
  await mkdir(destDir, { recursive: true });
  const dest = path.join(destDir, filename);
  if (existsSync(dest)) return dest;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return dest;
}

function inferExtension(url, fallback = 'png') {
  const m = url.split('?')[0].match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : fallback;
}

async function processPage(page) {
  const props = page.properties;
  const title = readProp(props, 'Title') ?? readProp(props, 'Name');
  if (!title) {
    console.warn(`Skipping page ${page.id} — no Title.`);
    return;
  }
  const slug = kebab(readProp(props, 'Slug') ?? title);
  const date = readProp(props, 'Date') ?? page.created_time.slice(0, 10);
  const description = readProp(props, 'Description');
  const tags = readProp(props, 'Tags') ?? [];
  const categories = readProp(props, 'Categories') ?? [];
  const status = readProp(props, 'Status') ?? 'Draft';
  const cover = readProp(props, 'Cover') ?? page.cover?.file?.url ?? page.cover?.external?.url ?? null;
  const draft = status !== 'Published';

  // Cover image
  let imagePath = null;
  if (cover) {
    const ext = inferExtension(cover);
    const dest = path.join(IMAGES_DIR, slug);
    const filename = `cover.${ext}`;
    await downloadImage(cover, dest, filename);
    imagePath = `/images/posts/${slug}/${filename}`;
  }

  // Body
  const blocks = await n2m.pageToMarkdown(page.id);
  const md = n2m.toMarkdownString(blocks).parent ?? '';

  // Walk markdown image references and download them locally.
  const imageRegex = /!\[(.*?)\]\((https?:[^)]+)\)/g;
  let body = md;
  const matches = [...md.matchAll(imageRegex)];
  let counter = 1;
  for (const m of matches) {
    const [whole, alt, url] = m;
    if (!/notion|amazonaws|secure\.notion|prod-files/i.test(url)) continue; // only Notion-hosted
    const ext = inferExtension(url);
    const dest = path.join(IMAGES_DIR, slug);
    const filename = `${counter++}.${ext}`;
    try {
      await downloadImage(url, dest, filename);
      const local = `/images/posts/${slug}/${filename}`;
      body = body.replace(whole, `![${alt}](${local})`);
    } catch (e) {
      console.warn(`  ! image download failed: ${url} (${e.message})`);
    }
  }

  // Compose front matter
  const fm = ['---'];
  fm.push(`title: ${yaml(title)}`);
  if (description) fm.push(`description: ${yaml(description)}`);
  fm.push(`date: ${yaml(date)}`);
  fm.push(`updated: ${yaml(page.last_edited_time.slice(0, 10))}`);
  if (imagePath) fm.push(`image: ${yaml(imagePath)}`);
  fm.push(`categories: ${yaml(categories)}`);
  fm.push(`tags: ${yaml(tags)}`);
  fm.push(`authors: ["Husni"]`);
  fm.push(`draft: ${draft}`);
  fm.push(`notion_id: ${yaml(page.id)}`);
  fm.push('---', '');

  const out = fm.join('\n') + '\n' + body.trim() + '\n';
  const filePath = path.join(POSTS_DIR, `${slug}.md`);

  // Idempotent: skip if hash matches existing.
  if (existsSync(filePath)) {
    const prev = await readFile(filePath, 'utf8');
    const prevHash = createHash('sha1').update(prev).digest('hex');
    const nextHash = createHash('sha1').update(out).digest('hex');
    if (prevHash === nextHash) {
      console.log(`  = ${slug} (unchanged)`);
      return;
    }
  }

  await mkdir(POSTS_DIR, { recursive: true });
  await writeFile(filePath, out, 'utf8');
  console.log(`  ✓ ${slug}${draft ? ' (draft)' : ''}`);
}

async function* iterPages() {
  let cursor;
  do {
    const res = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      start_cursor: cursor,
      page_size: 50,
    });
    for (const page of res.results) yield page;
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
}

(async () => {
  console.log(`Syncing Notion DB ${NOTION_DATABASE_ID}…`);
  let count = 0;
  for await (const page of iterPages()) {
    await processPage(page);
    count++;
  }
  console.log(`Done. ${count} pages processed.`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
