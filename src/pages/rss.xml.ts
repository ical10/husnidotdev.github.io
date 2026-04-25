import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAllPosts } from '../lib/posts';
import { SITE } from '../site';

export async function GET(context: APIContext) {
  const posts = await getAllPosts();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description ?? '',
      link: `/posts/${post.id}/`,
      categories: [...post.data.tags, ...post.data.categories],
    })),
    customData: `<language>en</language>`,
  });
}
