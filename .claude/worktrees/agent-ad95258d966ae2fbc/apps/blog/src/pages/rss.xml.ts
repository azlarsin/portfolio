import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { articleUrl, getPublicArticles, publishedAt } from '../lib/content';

export const GET: APIRoute = async (context) => {
  const articles = await getPublicArticles();
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      link: articleUrl(article),
      pubDate: new Date(`${publishedAt(article).replace(' ', 'T')}+08:00`),
      author: article.data.author,
      categories: article.data.tags,
    })),
  });
};
