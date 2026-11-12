import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceDirectory = resolve(appDirectory, '../..');
const legacyDirectory = resolve(workspaceDirectory, '../../blog');
const sourceDirectory = join(legacyDirectory, 'blog-source');
const legacyPagesDirectory = join(legacyDirectory, 'azlarsin.github.io');
const targetDirectory = join(appDirectory, 'src/content/articles');
const publicDirectory = join(appDirectory, 'public');

function fail(message) {
  throw new Error(`Legacy Blog migration: ${message}`);
}

function unquote(value = '') {
  const trimmed = value.trim();
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseTags(value = '[]') {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "''" || trimmed === '[]') return [];
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return [unquote(trimmed)].filter(Boolean);
  return trimmed.slice(1, -1).split(',').map((tag) => unquote(tag)).map((tag) => tag.trim()).filter(Boolean);
}

function parseLegacyDocument(text, file) {
  const delimiter = /\r?\n---\r?\n/.exec(text);
  if (!delimiter || delimiter.index === undefined) fail(`${file} has no legacy frontmatter delimiter.`);

  const header = text.slice(0, delimiter.index).replace(/\r/g, '');
  const body = text.slice(delimiter.index + delimiter[0].length);
  const fields = Object.fromEntries([...header.matchAll(/^(title|author|date|tags|ignore|plain):\s*(.*)$/gm)].map((match) => [match[1], match[2]]));

  if (!fields.title || !fields.author || !fields.date) fail(`${file} is missing title, author, or date.`);
  return {
    body,
    title: unquote(fields.title),
    author: unquote(fields.author),
    date: unquote(fields.date),
    tags: parseTags(fields.tags),
    ignore: fields.ignore?.trim() === 'true',
    plain: fields.plain?.trim() === 'true',
  };
}

function cleanDescription(body) {
  const beforeMarker = body.split('<!-- desc -->', 1)[0] ?? '';
  const firstParagraph = beforeMarker
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .find((paragraph) => paragraph && !paragraph.startsWith('#')) ?? '';
  return firstParagraph
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_>#]/g, '')
    .replace(/\[(.*?)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

function defaultLegacySlug(fileName) {
  return fileName
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, '-');
}

function classifyArticle(fileName, tags) {
  const lower = `${fileName} ${tags.join(' ')}`.toLowerCase();
  return /游戏|梦|gtd|qnap|宝妈|读书|随记|game/.test(lower) ? 'log' : 'writing';
}

function yamlString(value) {
  return JSON.stringify(value);
}

function buildFrontmatter(article) {
  return [
    '---',
    `title: ${yamlString(article.title)}`,
    `author: ${yamlString(article.author)}`,
    `date: ${yamlString(article.date)}`,
    `tags: ${JSON.stringify(article.tags)}`,
    `ignore: ${article.ignore}`,
    `plain: ${article.plain}`,
    `legacySlug: ${yamlString(article.legacySlug)}`,
    `visibility: ${article.visibility}`,
    `publishedAt: ${yamlString(article.date)}`,
    `updatedAt: ${yamlString(article.updatedAt)}`,
    `description: ${yamlString(article.description)}`,
    `type: ${article.type}`,
    '---',
    '',
  ].join('\n');
}

if (!existsSync(sourceDirectory) || !existsSync(legacyPagesDirectory)) {
  fail('expected sibling legacy repositories were not found.');
}

const legacyConfig = JSON.parse(readFileSync(join(legacyPagesDirectory, 'config/config.json'), 'utf8'));
const legacyArticleByFile = new Map(legacyConfig.articles.map((article) => [article.fileName, article]));
const markdownFiles = readdirSync(sourceDirectory)
  .filter((file) => file.endsWith('.md') && file !== 'README.md')
  .sort((left, right) => left.localeCompare(right, 'zh-CN'));

if (markdownFiles.length !== 29) fail(`expected 29 content Markdown files, found ${markdownFiles.length}.`);

rmSync(targetDirectory, { recursive: true, force: true });
mkdirSync(targetDirectory, { recursive: true });

const report = [];
for (const file of markdownFiles) {
  const fileName = basename(file, extname(file));
  const parsed = parseLegacyDocument(readFileSync(join(sourceDirectory, file), 'utf8'), file);
  const legacyArticle = legacyArticleByFile.get(fileName);
  const legacySlug = legacyArticle?.route ?? defaultLegacySlug(fileName);
  const article = {
    ...parsed,
    legacySlug,
    visibility: parsed.ignore ? 'unlisted' : 'public',
    updatedAt: legacyArticle?.modifyTime ?? parsed.date,
    description: cleanDescription(parsed.body) || parsed.title,
    type: classifyArticle(fileName, parsed.tags),
  };

  writeFileSync(join(targetDirectory, file), `${buildFrontmatter(article)}${parsed.body}`);
  report.push({ file, legacySlug, visibility: article.visibility, tags: article.tags.length });
}

for (const directory of ['images', 'demos']) {
  cpSync(join(legacyPagesDirectory, directory), join(publicDirectory, directory), { recursive: true, force: true });
}
for (const file of ['favicon.ico', 'CNAME']) {
  cpSync(join(legacyPagesDirectory, file), join(publicDirectory, file), { force: true });
}

writeFileSync(join(appDirectory, 'migration-report.json'), `${JSON.stringify({
  source: '../../blog/blog-source',
  articleCount: report.length,
  publicCount: report.filter((article) => article.visibility === 'public').length,
  unlistedCount: report.filter((article) => article.visibility === 'unlisted').length,
  articles: report,
}, null, 2)}\n`);

console.log(`Migrated ${report.length} Markdown entries and copied legacy images, demos, favicon.ico, and CNAME.`);
