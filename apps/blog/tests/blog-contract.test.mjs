import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = resolve(testDirectory, '..');
const workspaceDirectory = resolve(appDirectory, '../..');
const contentDirectory = join(appDirectory, 'src/content/articles');
const publicDirectory = join(appDirectory, 'public');
const distDirectory = join(appDirectory, 'dist');
const fixture = JSON.parse(readFileSync(join(testDirectory, 'fixtures/legacy-contract.json'), 'utf8'));
const gaMeasurementId = process.env.PUBLIC_GA_MEASUREMENT_ID;

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

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(left, right) {
  const leftLuminance = relativeLuminance(left);
  const rightLuminance = relativeLuminance(right);
  return (Math.max(leftLuminance, rightLuminance) + 0.05) / (Math.min(leftLuminance, rightLuminance) + 0.05);
}

function outputForUrl(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  if (decodedPath === '/') return output('index.html');
  if (decodedPath.endsWith('/')) return output(join(decodedPath.slice(1), 'index.html'));
  return output(decodedPath.slice(1));
}

function pageUrl(file) {
  const path = relative(distDirectory, file).split('\\').join('/');
  if (path === 'index.html') return new URL('https://blog.azlar.cc/');
  return new URL(`https://blog.azlar.cc/${path.replace(/index\.html$/u, '')}`);
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
    assert.notEqual(data.description.trim(), '[TOC]', `${basename(file)} needs a meaningful description rather than the legacy TOC marker`);
    for (const key of ['date', 'publishedAt', 'updatedAt']) {
      assert.match(data[key], /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/u, `${basename(file)} has an invalid ${key} format`);
      assert.ok(Number.isFinite(new Date(`${data[key].replace(' ', 'T')}+08:00`).getTime()), `${basename(file)} has an invalid ${key} value`);
    }
  }
  assert.equal(new Set(entries.map(({ data }) => data.legacySlug)).size, entries.length, 'article legacy slugs must be unique');
  assert.equal(new Set(fixture.tags.map(({ legacySlug }) => legacySlug)).size, fixture.tags.length, 'legacy tag slugs must be unique');
  assert.ok(fixture.tags.every(({ legacySlug }) => legacySlug.length > 0), 'legacy tag slugs must not be empty');
  assert.deepEqual(sorted(publicEntries.map(({ data }) => data.legacySlug)), sorted(fixture.publicArticleRoutes), 'public entries must match the fixture');
  assert.deepEqual(
    sorted(unlistedEntries.filter(({ data }) => data.legacySlug !== 'about').map(({ data }) => data.legacySlug)),
    sorted(fixture.unlistedRootRoutes),
    'unlisted direct links must match the fixture',
  );
  assert.deepEqual(sorted(new Set(publicEntries.flatMap(({ data }) => data.tags))), sorted(fixture.tags.map(({ name }) => name)), 'public tags must match the fixture');

  const game = standardDocument(join(contentDirectory, fixture.gameBody.file));
  assert.equal(game.data.updatedAt, '2025-12-27 00:00:00', 'the game log update metadata must include its latest dated entry');
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

test('GA4 is optional locally and rendered once in the static layout when configured', () => {
  requireBuiltArtifact();
  const layout = read(join(appDirectory, 'src/layouts/BaseLayout.astro'));
  const home = expectedHtml('index.html', 'missing blog homepage');

  assert.match(layout, /PUBLIC_GA_MEASUREMENT_ID/u);
  assert.match(layout, /https:\/\/www\.googletagmanager\.com\/gtag\/js/u);
  assert.match(layout, /dataLayer\.push\(arguments\)/u);

  if (!gaMeasurementId) {
    assert.doesNotMatch(home, /googletagmanager\.com\/gtag\/js/u);
    return;
  }

  const escapedId = gaMeasurementId.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  assert.match(home, new RegExp(`googletagmanager\\.com/gtag/js\\?id=${escapedId}`, 'u'));
  assert.match(home, /gtag\('config', gaMeasurementId\)/u);
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
    assert.match(html, /<div class="article-content"><[\s\S]+?<\/div>/u, `${data.legacySlug} body must be present in static HTML rather than fetched at runtime`);
    const runtimeScripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/giu)].map(([, source]) => source).join('\n');
    assert.doesNotMatch(runtimeScripts, /raw\.githubusercontent\.com|fetch\([^)]*(github|raw)/iu, `${data.legacySlug} must not runtime-fetch Markdown from GitHub Raw`);
  }
});

test('visibility is authoritative and generated pages contain no broken internal links', () => {
  requireBuiltArtifact();
  const contentSource = read(join(appDirectory, 'src/lib/content.ts'));
  assert.match(contentSource, /getPublicArticles\(\)[\s\S]*visibility === 'public'/u, 'public discovery must require explicit public visibility');
  assert.match(contentSource, /getUnlistedArticles\(\)[\s\S]*visibility === 'unlisted'/u, 'unlisted routes must require explicit unlisted visibility');

  const brokenLinks = [];
  const htmlFiles = listFiles(distDirectory, (file) => extname(file) === '.html')
    .filter((file) => !relative(distDirectory, file).startsWith(`demos${sep}`));
  for (const file of htmlFiles) {
    const html = read(file);
    const sourceUrl = pageUrl(file);
    for (const [, href] of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/giu)) {
      let target;
      try {
        target = new URL(href.replace(/&amp;/gu, '&'), sourceUrl);
      } catch {
        brokenLinks.push(`${relative(distDirectory, file)} -> invalid URL ${href}`);
        continue;
      }
      if (target.hostname !== 'blog.azlar.cc') continue;
      if (!existsSync(outputForUrl(target.pathname))) {
        brokenLinks.push(`${relative(distDirectory, file)} -> ${target.pathname}`);
      }
    }
  }
  assert.deepEqual(brokenLinks, [], `generated pages contain broken internal links:\n${brokenLinks.join('\n')}`);
});

test('article media and interaction polish keep runtime work bounded', () => {
  requireBuiltArtifact();
  const css = read(join(appDirectory, 'src/styles/global.css'));
  const commentsSource = read(join(appDirectory, 'src/components/Comments.astro'));
  const packageJson = JSON.parse(read(join(appDirectory, 'package.json')));

  assert.match(css, /--text-muted:\s*#66707c/u);
  assert.ok(contrastRatio('#66707c', '#f6f7f9') >= 4.5, 'light-theme muted text must reach WCAG AA contrast');
  assert.ok(contrastRatio('#ffffff', '#2457e6') >= 4.5, 'light-theme accent controls must reach WCAG AA contrast');
  assert.ok(contrastRatio('#111318', '#8eaeff') >= 4.5, 'dark-theme accent controls must reach WCAG AA contrast');
  assert.doesNotMatch(css, /backdrop-filter/iu, 'sticky navigation must not use a continuously repainted backdrop blur');
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)/u);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/u);
  assert.doesNotMatch(css, /\.article-page\s*\{[^}]*animation/iu, 'long article bodies must not become animated compositing layers');
  assert.match(commentsSource, /new IntersectionObserver/u, 'Disqus must wait until the comment area approaches the viewport');
  assert.match(commentsSource, /rootMargin:\s*'600px 0px'/u);
  assert.match(packageJson.scripts.build, /optimize-static-media\.mjs/u, 'media defaults must be applied before Pagefind indexing');

  let imageCount = 0;
  let iframeCount = 0;
  const generatedArticles = documents()
    .filter(({ data }) => data.visibility !== 'private' && data.legacySlug !== 'about')
    .map(({ data }) => data.visibility === 'public'
      ? expectedHtml(`article/${data.legacySlug}/index.html`, `missing public article ${data.legacySlug}`)
      : expectedHtml(`${data.legacySlug}/index.html`, `missing unlisted article ${data.legacySlug}`));
  for (const html of generatedArticles) {
    for (const [tag] of html.matchAll(/<img\b[^>]*>/giu)) {
      imageCount += 1;
      assert.match(tag, /\sloading="lazy"/iu);
      assert.match(tag, /\sdecoding="async"/iu);
      if (/\ssrc="(?:https?:)?\/\/blog\.azlar\.cc\/images\//iu.test(tag)) {
        assert.match(tag, /\swidth="\d+"/iu);
        assert.match(tag, /\sheight="\d+"/iu);
      }
    }
    for (const [tag] of html.matchAll(/<iframe\b[^>]*>/giu)) {
      iframeCount += 1;
      assert.match(tag, /\sloading="lazy"/iu);
      assert.match(tag, /\stitle="[^"]+"/iu);
    }
    for (const [, datetime] of html.matchAll(/<time\b[^>]*\sdatetime="([^"]+)"/giu)) {
      assert.match(datetime, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/u);
    }
  }
  assert.ok(imageCount > 0, 'representative generated articles must include optimized images');
  assert.ok(iframeCount > 0, 'representative generated articles must include optimized iframes');
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
  const notFoundHtml = expectedHtml('404.html', '404 page must be generated');
  assert.match(notFoundHtml, /<meta name="robots" content="noindex"/u, '404 page must not be indexed');
  assert.match(notFoundHtml, /<link rel="canonical" href="https:\/\/blog\.azlar\.cc\/404\.html"/u, '404 canonical must point to the generated file');
  expectedHtml('rss.xml', 'RSS feed must be generated');
  expectedHtml('sitemap.xml', 'sitemap must be generated');
  expectedHtml('pagefind/pagefind-entry.json', 'Pagefind index must be generated');
  assert.equal(read(output('CNAME')).trim(), 'blog.azlar.cc', 'build artifact must preserve the Blog CNAME');
  assert.ok(existsSync(output('.nojekyll')), 'build artifact must opt out of Jekyll');
  assert.equal(read(join(publicDirectory, 'CNAME')).trim(), 'blog.azlar.cc');
  assert.ok(existsSync(join(publicDirectory, '.nojekyll')));
});

test('core Blog pages use the current concise labels', () => {
  requireBuiltArtifact();
  const labels = [
    ['index.html', 'src/pages/index.astro', '文章与记录'],
    ['archives/index.html', 'src/pages/archives/index.astro', '文章归档'],
    ['tags/index.html', 'src/pages/tags/index.astro', '标签'],
    ['search/index.html', 'src/pages/search.astro', '搜索'],
  ];

  for (const [route, sourcePath, label] of labels) {
    const source = read(join(appDirectory, sourcePath));
    const html = expectedHtml(route, `missing core page /${route}`);
    assert.match(source, new RegExp(`<h1[^>]*>${label}</h1>`, 'u'), `${sourcePath} must use the current page label`);
    assert.match(html, new RegExp(`<h1[^>]*>${label}</h1>`, 'u'), `${route} must render the current page label`);
  }

  const footerSource = read(join(appDirectory, 'src/components/Footer.astro'));
  const homeHtml = expectedHtml('index.html', 'missing core page /index.html');
  assert.match(footerSource, /<p>Azlar Notes<\/p>/u, 'the footer source must use the current signature');
  assert.match(homeHtml, /<footer[^>]*>[\s\S]*<p>Azlar Notes<\/p>/u, 'the built footer must render the current signature');
});

test('home and About copy stay direct, and article comments retain the legacy Disqus identity', () => {
  requireBuiltArtifact();
  const homeSource = read(join(appDirectory, 'src/pages/index.astro'));
  const homeHtml = expectedHtml('index.html', 'home page must be generated');
  const aboutSource = read(join(appDirectory, 'src/pages/about.astro'));
  const aboutHtml = expectedHtml('about/index.html', 'About page must be generated');
  const headerSource = read(join(appDirectory, 'src/components/Header.astro'));
  const commentsSource = read(join(appDirectory, 'src/components/Comments.astro'));
  const articleHtml = expectedHtml('article/blog/index.html', 'representative article must be generated');

  for (const removed of ['技术、生活、游戏与一些尚未归类的片段', '此刻', '把分散的记录逐步收回', '一个仍在生长的个人档案']) {
    assert.doesNotMatch(`${homeSource}\n${homeHtml}\n${aboutSource}\n${aboutHtml}`, new RegExp(removed, 'u'));
  }
  assert.match(aboutHtml, /为什么写这个 Blog/u);
  assert.match(aboutHtml, /查看最新的 Portfolio/u);
  assert.doesNotMatch(headerSource, /portfolio-link|>Portfolio ↗</u, 'primary navigation must not highlight Portfolio');
  assert.match(commentsSource, /https:\/\/azlarsin\.disqus\.com\/embed\.js/u);
  assert.match(commentsSource, /this\.page\.identifier = window\.location\.pathname/u);
  assert.match(commentsSource, /IntersectionObserver/u, 'comments must not load on the initial article viewport');
  assert.match(articleHtml, /id="disqus_thread"/u);
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
  assert.match(source, /if \(!query\.trim\(\)\)[\s\S]*resultsContainer\?\.replaceChildren\(\)/u, 'clearing the query must clear stale results');
  assert.match(source, /const entries = await Promise\.all[\s\S]*request !== searchRequest[\s\S]*renderResults\(entries\)/u, 'only the latest async query may commit results');
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
