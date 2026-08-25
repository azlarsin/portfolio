import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = resolve(testDirectory, '..');
const workspaceDirectory = resolve(appDirectory, '../..');
const contentDirectory = join(appDirectory, 'src/content/articles');
const publicDirectory = join(appDirectory, 'public');
const distDirectory = join(appDirectory, 'dist');
const fixture = JSON.parse(readFileSync(join(testDirectory, 'fixtures/legacy-contract.json'), 'utf8'));

function listFiles(directory, predicate = () => true) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(path, predicate));
    else if (predicate(path)) files.push(path);
  }
  return files;
}

function read(path) {
  return readFileSync(path, 'utf8');
}

function standardDocument(path) {
  const value = read(path);
  const match = /^(---\r?\n)([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/u.exec(value);
  assert.ok(match, `${relative(appDirectory, path)} must use standard YAML frontmatter`);
  const data = Object.fromEntries([...match[2].matchAll(/^([^:\n]+):\s*(.*)$/gmu)].map(([, key, rawValue]) => {
    let value = rawValue;
    try {
      value = JSON.parse(rawValue);
    } catch {
      // The fixed migration schema only contains JSON strings/arrays and bare enum/boolean values.
    }
    return [key, value];
  }));
  return { data, body: match[3] };
}

function documents() {
  return listFiles(contentDirectory, (file) => extname(file) === '.md').map((file) => ({ file, ...standardDocument(file) }));
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, 'en'));
}

function legacyRouteName(value) {
  return value.replace(/\s+/gu, '-').replace(/^-|-$|\s+/gu, '').replace(/-+/gu, '-');
}

function output(path) {
  return join(distDirectory, path);
}

function expectedHtml(path, message) {
  const file = output(path);
  assert.ok(existsSync(file), `${message}: expected ${relative(appDirectory, file)}`);
  return read(file);
}

function requireBuiltArtifact() {
  assert.ok(existsSync(distDirectory), 'Build artifact is missing. Run `pnpm --filter @azlar/blog build` before `pnpm test:contracts`.');
}

test('committed content preserves the self-contained legacy inventory and game body', () => {
  assert.equal(fixture.schemaVersion, 1, 'legacy fixture schema version must be supported');
  assert.equal(fixture.publicArticleRoutes.length, fixture.resources.publicArticles, 'fixture must list every public route');
  assert.equal(fixture.tags.length, 55, 'fixture must retain all 55 legacy tags');
  assert.equal(fixture.unlistedRootRoutes.length, 7, 'fixture must retain seven unlisted root links');

  const entries = documents();
  const publicEntries = entries.filter(({ data }) => data.visibility === 'public');
  const unlistedEntries = entries.filter(({ data }) => data.visibility === 'unlisted');
  assert.equal(entries.length, fixture.resources.articles, 'all 29 legacy Markdown files must be committed');
  assert.equal(publicEntries.length, fixture.resources.publicArticles, '21 entries must be public');
  assert.equal(unlistedEntries.length, fixture.resources.unlistedArticles, '8 ignored entries must be unlisted');
  assert.equal(listFiles(join(publicDirectory, 'images')).length, fixture.resources.images, 'all 86 legacy images must be committed');
  assert.equal(listFiles(join(publicDirectory, 'demos')).length, fixture.resources.demos, 'all 7 legacy demo files must be committed');
  assert.equal(read(join(publicDirectory, 'CNAME')).trim(), 'blog.azlar.cc', 'CNAME must preserve the Blog domain');
  assert.ok(existsSync(join(publicDirectory, '.nojekyll')), 'GitHub Pages artifact must opt out of Jekyll');

  for (const { file, data } of entries) {
    for (const key of ['legacySlug', 'publishedAt', 'updatedAt', 'description', 'type']) {
      assert.ok(data[key], `${basename(file)} is missing migrated ${key}`);
    }
  }
  assert.deepEqual(sorted(publicEntries.map(({ data }) => data.legacySlug)), sorted(fixture.publicArticleRoutes), 'public entries must match the fixture');
  assert.deepEqual(
    sorted(unlistedEntries.filter(({ data }) => data.legacySlug !== 'about').map(({ data }) => data.legacySlug)),
    sorted(fixture.unlistedRootRoutes),
    'unlisted direct links must match the fixture',
  );
  assert.deepEqual(sorted(new Set(publicEntries.flatMap(({ data }) => data.tags))), sorted(fixture.tags.map(({ name }) => name)), 'public tags must match the fixture');

  const game = standardDocument(join(contentDirectory, fixture.gameBody.file));
  assert.equal(createHash('sha256').update(game.body).digest('hex'), fixture.gameBody.sha256, 'the migrated game body must match the committed legacy body hash');
});

test('build output contains all public, unlisted, and shared legacy entry points', () => {
  requireBuiltArtifact();
  for (const route of fixture.publicArticleRoutes) {
    expectedHtml(`article/${route}/index.html`, `missing legacy article route /article/${route}/`);
  }
  for (const route of fixture.unlistedRootRoutes) {
    expectedHtml(`${route}/index.html`, `missing unlisted route /${route}/`);
  }
  for (const route of ['about/index.html', 'archives/index.html', 'tags/index.html', 'search/index.html', '404.html']) {
    expectedHtml(route, `missing shared legacy route /${route.replace(/index\.html$|\.html$/u, '')}/`);
  }
});

test('all legacy tag paths use build.js-compatible slugs, including spaces', () => {
  requireBuiltArtifact();
  for (const tag of fixture.tags) {
    assert.equal(tag.legacySlug, legacyRouteName(tag.name), `fixture slug for ${JSON.stringify(tag.name)} must match old build.js`);
    expectedHtml(`tag/${tag.legacySlug}/index.html`, `missing old tag path /tag/${tag.legacySlug}/ for tag ${JSON.stringify(tag.name)}`);
  }
  const tagWithSpaces = fixture.tags.find(({ name }) => name === 'component render outside');
  assert.deepEqual(tagWithSpaces, { name: 'component render outside', legacySlug: 'component-render-outside' });
  assert.ok(!existsSync(output(`tag/${encodeURIComponent(tagWithSpaces.name)}/index.html`)), 'space-separated tag must not use an encoded %20 path');
});

test('legacy pagination deep links remain generated routes', () => {
  requireBuiltArtifact();
  for (const route of ['p/2/index.html', 'p/3/index.html']) {
    assert.ok(existsSync(output(route)), `Legacy pagination contract is not implemented: expected /${route.replace(/index\.html$/u, '')} to be generated.`);
  }
  for (const { legacySlug } of fixture.tags) {
    assert.ok(existsSync(output(`tag/${legacySlug}/p/2/index.html`)), `Legacy tag pagination contract is not implemented: expected /tag/${legacySlug}/p/2/ to be generated.`);
  }
});

test('public articles are server-rendered, indexable, and independent of GitHub Raw', () => {
  requireBuiltArtifact();
  for (const { file, data } of documents().filter(({ data }) => data.visibility === 'public')) {
    assert.ok(data.description.trim(), `${basename(file)} needs a non-empty meta description`);
    const html = expectedHtml(`article/${data.legacySlug}/index.html`, `missing public route for ${basename(file)}`);
    assert.match(html, /<meta name="description" content="[^"\n]+"/u, `${data.legacySlug} must render a non-empty description meta tag`);
    assert.match(html, /<div class="article-content"><[\s\S]+<\/div><\/div><aside class="desktop-toc">/u, `${data.legacySlug} body must be present in static HTML rather than fetched at runtime`);
    const runtimeScripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/giu)].map(([, source]) => source).join('\n');
    assert.doesNotMatch(runtimeScripts, /raw\.githubusercontent\.com|fetch\([^)]*(github|raw)/iu, `${data.legacySlug} must not runtime-fetch Markdown from GitHub Raw`);
  }
});

test('unlisted legacy routes are noindex and excluded from RSS, sitemap, and Pagefind', () => {
  requireBuiltArtifact();
  const packageJson = JSON.parse(read(join(appDirectory, 'package.json')));
  const rss = expectedHtml('rss.xml', 'RSS feed must be generated');
  const sitemap = expectedHtml('sitemap.xml', 'sitemap must be generated');
  expectedHtml('pagefind/pagefind-entry.json', 'Pagefind index must be generated');
  assert.match(packageJson.scripts.build, /--glob "article\/\*\*\/\*\.html"/u, 'Pagefind must only index public article output');
  for (const route of fixture.unlistedRootRoutes) {
    const html = expectedHtml(`${route}/index.html`, `unlisted route /${route}/ must be generated`);
    const canonicalRoute = `https://blog.azlar.cc/${route}/`;
    assert.match(html, /<meta name="robots" content="noindex"/u, `${route} must be noindex`);
    assert.ok(!rss.includes(canonicalRoute), `${route} must not appear in RSS`);
    assert.ok(!sitemap.includes(canonicalRoute), `${route} must not appear in sitemap`);
  }
  assert.match(sitemap, /https:\/\/blog\.azlar\.cc\/about\//u, 'the modern /about/ page remains a public discovery page');
});

test('core generated pages preserve accessible viewport and static search/discovery files', () => {
  requireBuiltArtifact();
  for (const route of ['index.html', 'about/index.html', 'archives/index.html', 'tags/index.html', 'search/index.html', '404.html']) {
    const html = expectedHtml(route, `missing core page /${route}`);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1"/u, `${route} must use a zoomable viewport`);
    assert.doesNotMatch(html, /user-scalable\s*=\s*no/iu, `${route} must not disable zoom`);
  }
  expectedHtml('rss.xml', 'RSS feed must be generated');
  expectedHtml('sitemap.xml', 'sitemap must be generated');
  expectedHtml('pagefind/pagefind-entry.json', 'Pagefind index must be generated');
  assert.equal(read(output('CNAME')).trim(), 'blog.azlar.cc', 'build artifact must preserve the Blog CNAME');
  assert.ok(existsSync(output('.nojekyll')), 'build artifact must opt out of Jekyll');
  assert.equal(read(join(publicDirectory, 'CNAME')).trim(), 'blog.azlar.cc');
  assert.ok(existsSync(join(publicDirectory, '.nojekyll')));
});

test('search loads Pagefind as an unbundled static module and keeps excerpts safely text-rendered', () => {
  requireBuiltArtifact();
  const source = read(join(appDirectory, 'src/pages/search.astro'));
  const html = expectedHtml('search/index.html', 'search page must be generated');

  for (const runtimeFile of ['pagefind/pagefind.js', 'pagefind/pagefind-worker.js', 'pagefind/pagefind-entry.json']) {
    assert.ok(existsSync(output(runtimeFile)), `Pagefind runtime file must be published: ${runtimeFile}`);
  }
  assert.match(source, /<script\s+is:inline\s+type="module">/u, 'search runtime must remain inline to avoid Vite rewriting the Pagefind import');
  assert.match(source, /await import\('\/pagefind\/pagefind\.js'\)/u, 'search must load the Pagefind bundle from the static site root');
  assert.match(source, /await pagefind\.init\(\)/u, 'search must explicitly initialize Pagefind before accepting queries');
  assert.doesNotMatch(source, /@vite-ignore|pagefindPath|innerHTML/u, 'search must not reintroduce Vite preload wrapping or direct HTML injection');
  assert.match(html, /<script\s+type="module">[\s\S]*await import\('\/pagefind\/pagefind\.js'\)/u, 'built search page must retain the direct Pagefind static-module import');
  assert.doesNotMatch(html, /__VITE_PRELOAD__/u, 'built search page must not reference Vite\'s omitted preload helper');
});

test('publishing stays manual and local Blog build has no git mutation command', () => {
  const workflow = read(join(workspaceDirectory, '.github/workflows/publish-blog-pages.yml'));
  const packageJson = JSON.parse(read(join(appDirectory, 'package.json')));
  const rootPackageJson = JSON.parse(read(join(workspaceDirectory, 'package.json')));
  assert.match(workflow, /^on:\s*\n\s*workflow_dispatch:\s*$/mu, 'Blog publishing workflow must only have manual workflow_dispatch trigger');
  assert.doesNotMatch(workflow, /^\s*(push|pull_request|schedule):/mu, 'Blog publishing must not add automatic triggers');
  assert.match(workflow, /repository:\s*azlarsin\/azlarsin\.github\.io/u, 'workflow must target azlarsin/azlarsin.github.io');
  assert.match(workflow, /ref:\s*master/u, 'workflow must explicitly publish the target master branch');
  assert.match(workflow, /ssh-key:\s*\$\{\{ secrets\.BLOG_PAGES_DEPLOY_KEY \}\}/u, 'workflow must use the scoped Blog SSH deploy key');
  assert.match(workflow, /ssh-strict:\s*true/u, 'workflow must verify the target SSH host');
  assert.match(workflow, /persist-credentials:\s*true/u, 'workflow must retain the deploy key only for the checkout and push job');
  assert.doesNotMatch(workflow, /BLOG_PAGES_DEPLOY_TOKEN/u, 'workflow must not use the retired broad deployment token');
  assert.match(workflow, /set -euo pipefail/u, 'workflow must stop at the first publishing failure');
  assert.match(workflow, /rsync -a --delete --exclude='\.git\/' apps\/blog\/dist\/ blog-pages\//u, 'workflow must replace the target artifact without deleting its Git metadata');
  assert.match(workflow, /rsync[^\n]*\n\s*test -d blog-pages\/\.git/u, 'workflow must verify rsync preserved the target Git metadata');
  assert.match(workflow, /if ! git -C blog-pages diff --cached --quiet; then[\s\S]*git -C blog-pages commit[\s\S]*git -C blog-pages push origin HEAD:master[\s\S]*fi/u, 'workflow must commit and push master only when staged publishing diff is non-empty');
  assert.doesNotMatch(rootPackageJson.scripts['build:blog'], /git\s+(add|commit|push)/iu, 'root Blog build must not mutate git');
  assert.doesNotMatch(packageJson.scripts.build, /git\s+(add|commit|push)/iu, 'Blog build must not mutate git');
  assert.equal(execFileSync('git', ['diff', '--', '.github/workflows/deploy-pages.yml'], { cwd: workspaceDirectory, encoding: 'utf8' }), '', 'Blog changes must not modify the portfolio deploy-pages workflow');
});
