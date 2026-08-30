import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;

export const PAGE_SIZE = 10;

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'Asia/Taipei',
});

function dateValue(value: string) {
  return new Date(`${value.replace(' ', 'T')}+08:00`).getTime();
}

export function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value.replace(' ', 'T')}+08:00`));
}

export function htmlDateTime(value: string) {
  return `${value.replace(' ', 'T')}+08:00`;
}

export function publishedAt(article: Article) {
  return article.data.publishedAt ?? article.data.date;
}

export function updatedAt(article: Article) {
  return article.data.updatedAt ?? publishedAt(article);
}

export function articleUrl(article: Article) {
  return `/article/${encodeURIComponent(article.data.legacySlug)}/`;
}

/**
 * Preserve the legacy build.js route algorithm exactly. This is deliberately
 * kept separate from editorial slugs: historical links are a public contract.
 */
export function legacyRouteName(value: string) {
  return value
    .replace(/\s+/g, '-')
    .replace(/\[+|]+|[,]+|%+|\.+|\\+|(\s-\s)+/g, '-')
    .replace(/^-|-$|\s+/g, '')
    .replace(/-+/g, '-');
}

export function legacyTagSlug(tag: string) {
  return legacyRouteName(tag);
}

export function tagUrl(tag: string) {
  return `/tag/${encodeURIComponent(legacyTagSlug(tag))}/`;
}

export function pageCount<T>(items: T[]) {
  return Math.max(1, Math.ceil(items.length / PAGE_SIZE));
}

export function pageItems<T>(items: T[], page: number) {
  const start = (page - 1) * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
}

export function paginatedUrl(basePath: string, page: number) {
  const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return page === 1 ? normalizedBasePath : `${normalizedBasePath}p/${page}/`;
}

export async function getAllArticles() {
  const articles = await getCollection('articles');
  return articles.sort((left, right) => dateValue(publishedAt(right)) - dateValue(publishedAt(left)));
}

/**
 * `visibility` is the publishing boundary. The legacy `ignore` flag remains in
 * committed Markdown only for migration compatibility and must never turn an
 * unlisted or private entry into a public route.
 */
export async function getPublicArticles() {
  const articles = await getAllArticles();
  return articles.filter((article) => article.data.visibility === 'public');
}

export async function getUnlistedArticles() {
  const articles = await getAllArticles();
  return articles.filter((article) => article.data.visibility === 'unlisted');
}

export function getTagCounts(articles: Article[]) {
  return [...articles.reduce((counts, article) => {
    for (const tag of article.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return counts;
  }, new Map<string, number>()).entries()].sort(([leftTag, leftCount], [rightTag, rightCount]) => (
    rightCount - leftCount || leftTag.localeCompare(rightTag, 'zh-CN')
  ));
}

export function isModernAbout(article: Article) {
  return article.data.legacySlug === 'about';
}
