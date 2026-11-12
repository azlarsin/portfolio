import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const distRoot = join(appRoot, 'dist')
const indexedRoutes = new Map([
  ['/', '陈成｜前端技术负责人 · 全栈与复杂系统工程'],
  ['/work/meican-platform', '企业后台架构改造｜陈成作品集'],
  ['/work/baidu-map-workbench', '百度地图数据作业｜陈成作品集'],
  ['/work/baijiahao-editor', '百家号编辑器演进｜陈成作品集'],
  ['/work/layered-agent', 'Layered Route × Verified Agent｜陈成作品集'],
  ['/archive/elpis', 'Elpis 独立产品｜个人项目集'],
  ['/experience', '职业经历｜陈成作品集'],
  ['/archive', '个人项目集｜陈成作品集'],
  ['/archive/coco-wallet', 'Coco Wallet 跨平台钱包｜项目档案'],
  ['/archive/poke-prototype-editor', 'Poke 高保真原型编辑器｜项目档案'],
  ['/archive/dataview-observatory', '超宽幅实时数据可视化平台｜项目档案'],
  ['/archive/turntable-motion-lab', 'Turntable Motion Lab｜项目档案'],
  ['/archive/bezier-easing-picker', 'Bezier Easing Picker｜项目档案'],
  ['/archive/merchant-commerce', '移动电商独立全栈项目｜项目档案'],
  ['/archive/irregular-shape-layout', '不规则形状布局实验｜项目档案'],
  ['/resume', '个人简历｜陈成'],
])
const caseStudyRoutes = new Set([
  '/work/meican-platform',
  '/work/baidu-map-workbench',
  '/work/baijiahao-editor',
  '/work/layered-agent',
  '/archive/elpis',
  '/archive/coco-wallet',
  '/archive/poke-prototype-editor',
  '/archive/dataview-observatory',
  '/archive/turntable-motion-lab',
  '/archive/bezier-easing-picker',
  '/archive/merchant-commerce',
  '/archive/irregular-shape-layout',
])

function routeFile(path) {
  return path === '/'
    ? join(distRoot, 'index.html')
    : join(distRoot, path.replace(/^\/+/, ''), 'index.html')
}

function routeUrl(path) {
  return path === '/' ? 'https://me.azlar.cc/' : `https://me.azlar.cc${path}/`
}

function read(path) {
  assert.ok(existsSync(path), `missing build artifact: ${path}`)
  return readFileSync(path, 'utf8')
}

describe('portfolio SEO build', () => {
  it('pre-renders every public route with unique crawlable metadata and body content', () => {
    for (const [path, title] of indexedRoutes) {
      const html = read(routeFile(path))
      const url = routeUrl(path)

      assert.match(html, new RegExp(`<title>${title}</title>`, 'u'), path)
      assert.match(html, /<meta name="description" content="[^"\n]+" \/>/u, path)
      assert.match(html, /<meta name="robots" content="index,follow,[^"]+" \/>/u, path)
      assert.ok(html.includes(`<link rel="canonical" href="${url}" />`), path)
      assert.ok(html.includes(`<meta property="og:url" content="${url}" />`), path)
      if (caseStudyRoutes.has(path)) {
        assert.match(html, /<meta name="twitter:card" content="summary" \/>/u, path)
        assert.doesNotMatch(html, /<meta property="og:image"/u, path)
        assert.doesNotMatch(html, /<meta name="twitter:image"/u, path)
      } else {
        assert.match(html, /<meta name="twitter:card" content="summary_large_image" \/>/u, path)
        assert.match(html, /<meta property="og:image" content="https:\/\/me\.azlar\.cc\/og\.png" \/>/u, path)
        assert.match(html, /<meta name="twitter:image" content="https:\/\/me\.azlar\.cc\/og\.png" \/>/u, path)
      }
      assert.match(html, /<script id="portfolio-json-ld" type="application\/ld\+json">.+<\/script>/u, path)
      assert.match(html, /<div id="root"><div/u, path)
      assert.match(html, /<main\b/u, path)
      assert.match(html, /<h1\b/u, path)
    }
  })

  it('keeps utility, missing, and compatibility pages out of the index', () => {
    const demo = read(routeFile('/demo'))
    const notFound = read(join(distRoot, '404.html'))
    const alias = read(routeFile('/work/elpis'))

    assert.match(demo, /<meta name="robots" content="noindex,follow" \/>/u)
    assert.match(notFound, /<meta name="robots" content="noindex,follow" \/>/u)
    assert.match(notFound, /<title>页面未找到｜陈成作品集<\/title>/u)
    assert.match(
      alias,
      /<link rel="canonical" href="https:\/\/me\.azlar\.cc\/archive\/elpis\/" \/>/u,
    )
  })

  it('publishes a complete sitemap and crawler policy', () => {
    const sitemap = read(join(distRoot, 'sitemap.xml'))
    const robots = read(join(distRoot, 'robots.txt'))

    for (const path of indexedRoutes.keys()) {
      assert.ok(sitemap.includes(`<loc>${routeUrl(path)}</loc>`), path)
    }
    assert.doesNotMatch(sitemap, /\/demo\/|\/not-found\/|\/work\/elpis\//u)
    assert.match(robots, /^User-agent: \*\nAllow: \/\n/mu)
    assert.match(robots, /Sitemap: https:\/\/me\.azlar\.cc\/sitemap\.xml/u)
  })

  it('keeps the family album behind its gate and absent from public HTML and sitemap', () => {
    const baby = read(routeFile('/baby'))
    assert.match(baby, /noindex,nofollow,noimageindex/u)
    assert.match(baby, /家庭暗号/u)
    assert.doesNotMatch(baby, /\/portraits\/|<image\b/u)
    assert.doesNotMatch(read(join(distRoot, 'sitemap.xml')), /\/baby/u)
    for (const path of indexedRoutes.keys()) {
      const html = read(routeFile(path))
      assert.doesNotMatch(html, /route-companion|companion-home|companion-dock-slot|companion-style-switch|\/portraits\//u, path)
      assert.doesNotMatch(html, /href="[^"]*\/baby/u, path)
    }
  })

  it('ships a correctly sized social-preview image', () => {
    const image = readFileSync(join(distRoot, 'og.png'))

    assert.equal(image.toString('ascii', 1, 4), 'PNG')
    assert.equal(image.readUInt32BE(16), 1200)
    assert.equal(image.readUInt32BE(20), 630)
  })
})
