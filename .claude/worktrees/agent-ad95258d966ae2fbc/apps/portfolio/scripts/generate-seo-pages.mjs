import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const distRoot = join(appRoot, 'dist')
const serverBundleRoot = join(appRoot, '.seo-ssr')
const serverEntry = join(serverBundleRoot, 'entry-server.js')
const seoMarker = /\s*<!-- portfolio:seo:start -->[\s\S]*?<!-- portfolio:seo:end -->/
const emptyRoot = '<div id="root"></div>'
const routeAliasPages = [{ path: '/work/elpis', canonicalPath: '/archive/elpis' }]

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function renderSeoHead(seo) {
  const title = escapeHtml(seo.title)
  const description = escapeHtml(seo.description)
  const canonicalUrl = escapeHtml(seo.canonicalUrl)
  const imageMeta = seo.imageUrl && seo.imageAlt
    ? `
    <meta property="og:image" content="${escapeHtml(seo.imageUrl)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(seo.imageAlt)}" />`
    : ''
  const twitterImageMeta = seo.imageUrl && seo.imageAlt
    ? `
    <meta name="twitter:image" content="${escapeHtml(seo.imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(seo.imageAlt)}" />`
    : ''

  return `
    <!-- portfolio:seo:start -->
    <meta name="description" content="${description}" />
    <meta name="robots" content="${escapeHtml(seo.robots)}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:type" content="${escapeHtml(seo.openGraphType)}" />
    <meta property="og:site_name" content="${escapeHtml(seo.siteName)}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:locale" content="${escapeHtml(seo.locale)}" />
    ${imageMeta}
    <meta name="twitter:card" content="${escapeHtml(seo.twitterCard)}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${twitterImageMeta}
    <title>${title}</title>
    <script id="portfolio-json-ld" type="application/ld+json">${serializeJsonLd(seo.jsonLd)}</script>
    <!-- portfolio:seo:end -->`
}

function renderDocument(template, rendered) {
  if (!seoMarker.test(template)) {
    throw new Error('Portfolio HTML template is missing the SEO marker block.')
  }
  if (!template.includes(emptyRoot)) {
    throw new Error('Portfolio HTML template is missing the empty React root.')
  }

  return template
    .replace(seoMarker, renderSeoHead(rendered.seo))
    .replace(emptyRoot, `<div id="root">${rendered.body}</div>`)
}

function routeOutput(path) {
  if (path === '/') return join(distRoot, 'index.html')
  return join(distRoot, path.replace(/^\/+/, ''), 'index.html')
}

async function writeRoutePage(path, document) {
  const output = routeOutput(path)
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, document)
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character])
}

try {
  const template = await readFile(join(distRoot, 'index.html'), 'utf8')
  const {
    renderPortfolioRoute,
    staticPortfolioRoutes,
  } = await import(pathToFileURL(serverEntry).href)

  for (const route of staticPortfolioRoutes) {
    const rendered = renderPortfolioRoute(route.path)
    await writeRoutePage(route.path, renderDocument(template, rendered))
  }

  for (const alias of routeAliasPages) {
    const rendered = renderPortfolioRoute(alias.canonicalPath)
    await writeRoutePage(alias.path, renderDocument(template, rendered))
  }

  const notFound = renderPortfolioRoute('/not-found')
  await writeFile(join(distRoot, '404.html'), renderDocument(template, notFound))

  const sitemapUrls = staticPortfolioRoutes
    .filter((route) => route.indexable)
    .map((route) => renderPortfolioRoute(route.path).seo.canonicalUrl)
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}\n</urlset>\n`
  await writeFile(join(distRoot, 'sitemap.xml'), sitemap)
} finally {
  await rm(serverBundleRoot, { recursive: true, force: true })
}
