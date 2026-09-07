import type { APIRoute } from 'astro';
import { SITE } from '../data/site';

export const GET: APIRoute = () => {
  const sitemap = new URL('/sitemap.xml', SITE.url).toString();
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
