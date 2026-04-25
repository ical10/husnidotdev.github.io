import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

const isProd = import.meta.env.PROD;

export async function getAllPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !isProd || !data.draft);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

type Group = { display: string; posts: Post[] };

function groupBy(posts: Post[], pick: (p: Post) => string[]): Map<string, Group> {
  const map = new Map<string, Group>();
  for (const post of posts) {
    for (const raw of pick(post)) {
      const key = raw.toLowerCase();
      const entry = map.get(key) ?? { display: raw, posts: [] };
      entry.posts.push(post);
      map.set(key, entry);
    }
  }
  return map;
}

export function getAllTags(posts: Post[]): Map<string, Group> {
  return groupBy(posts, (p) => p.data.tags);
}

export function getAllCategories(posts: Post[]): Map<string, Group> {
  return groupBy(posts, (p) => p.data.categories);
}

const WORDS_PER_MINUTE = 220;

export function readingMeta(body: string): { words: number; minutes: number } {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return { words, minutes };
}

export function postPath(post: Post): string {
  return `/posts/${post.id}/`;
}

export function postSourcePath(post: Post): string {
  return `src/content/posts/${post.id}.md`;
}
