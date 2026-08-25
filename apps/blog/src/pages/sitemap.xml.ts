import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { articleUrl, getPublicArticles, getTagCounts, tagUrl, updatedAt } from '../lib/content';

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }[character] ?? character));
}

export const GET: APIRoute = async () => {
  const articles = await getPublicArticles();
  const urls = [
    { path: '/', modified: undefined },
    { path: '/about/', modified: undefined },
    { path: '/archives/', modified: undefined },
    { path: '/tags/', modified: undefined },
    ...articles.map((article) => ({ path: articleUrl(article), modified: updatedAt(article) })),
    ...getTagCounts(articles).map(([tag]) => ({ path: tagUrl(tag), modified: undefined })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(({ path, modified }) => `  <url><loc>${escapeXml(new URL(path, SITE.url).toString())}</loc>${modified ? `<lastmod>${modified.slice(0, 10)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
