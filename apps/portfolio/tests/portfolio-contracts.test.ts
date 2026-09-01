import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  LEGACY_HASH_ROUTES,
  getLegacyRouteMigration,
  resolveLegacyHash,
} from '../src/app/legacyRoutes'
import {
  ROUTES,
  resolveRoute,
  routeDefinitions,
} from '../src/app/router'
import {
  canInitializeGoogleAnalytics,
  createGtag,
} from '../src/app/analytics'
import {
  archiveProjects,
  baijiahaoEditorProject,
  baiduMapWorkbenchProject,
  cocoWalletProject,
  featuredProjects,
  layeredAgentProject,
  meicanPlatformProject,
  portfolioProjectBySlug,
  portfolioProjects,
  projectNavigation,
  demoExperiences,
  demoPlayerPath,
  getDemoExperience,
} from '../src/data'
import { profile } from '../src/data/profile'
import {
  getLocalizedProfile,
  getLocalizedProjects,
} from '../src/data/localized'
import { resolvePreferredLanguage } from '../src/i18n/LanguageContext'
import { siteCopy } from '../src/i18n/copy'
import { getLocalizedRouteMeta } from '../src/i18n/routeMeta'

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`
    return entry.isDirectory() ? collectSourceFiles(path) : [path]
  })
}

describe('portfolio acceptance contracts', () => {
  it('loads the GA4 stream only for the production portfolio domain', () => {
    expect(
      canInitializeGoogleAnalytics('G-HXZEF459C9', {
        hostname: 'me.azlar.cc',
        isProduction: true,
      }),
    ).toBe(true)
    expect(
      canInitializeGoogleAnalytics('UA-89586643-1', {
        hostname: 'me.azlar.cc',
        isProduction: true,
      }),
    ).toBe(false)
    expect(
      canInitializeGoogleAnalytics('G-HXZEF459C9', {
        hostname: 'localhost',
        isProduction: true,
      }),
    ).toBe(false)
    expect(
      canInitializeGoogleAnalytics('G-HXZEF459C9', {
        hostname: 'me.azlar.cc',
        isProduction: false,
      }),
    ).toBe(false)

    const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url))
    const analytics = readFileSync(`${sourceRoot}/app/analytics.ts`, 'utf8')
    const app = readFileSync(`${sourceRoot}/app/App.tsx`, 'utf8')
    const main = readFileSync(`${sourceRoot}/main.tsx`, 'utf8')

    expect(main).toContain('initializeGoogleAnalytics()')
    expect(analytics).toContain('VITE_GA_MEASUREMENT_ID')
    expect(analytics).toContain('https://www.googletagmanager.com/gtag/js')
    expect(analytics).toContain('{ send_page_view: false }')
    expect(analytics).toContain("window.gtag('event', 'page_view'")
    expect(app).toContain('if (route.needsCanonicalReplace) return')
    expect(app).toContain('`${window.location.origin}${route.pathname}${route.search}`')
    expect(app).toContain(
      '[route.needsCanonicalReplace, route.pathname, route.search]',
    )
  })

  it('queues GA4 commands in the arguments-object format expected by gtag.js', () => {
    const dataLayer: unknown[] = []
    const gtag = createGtag(dataLayer)

    gtag('config', 'G-HXZEF459C9')

    expect(dataLayer).toHaveLength(1)
    expect(Array.isArray(dataLayer[0])).toBe(false)
    expect(Array.from(dataLayer[0] as IArguments)).toEqual([
      'config',
      'G-HXZEF459C9',
    ])
  })

  it('1. exposes the complete canonical route set with stable SEO metadata', () => {
    const expectedTitles = new Map([
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
      ['/demo', '交互体验播放器｜陈成作品集'],
      ['/resume', '个人简历｜陈成'],
      ['/not-found', '页面未找到｜陈成作品集'],
    ])

    expect(routeDefinitions.map((route) => route.path)).toEqual([
      ...expectedTitles.keys(),
    ])

    for (const [path, title] of expectedTitles) {
      const resolved = resolveRoute(path)
      expect(resolved.isNotFound, path).toBe(path === '/not-found')
      expect(resolved.meta.title, path).toBe(title)
      expect(resolved.meta.description, path).not.toHaveLength(0)
    }

    expect(ROUTES.HOME.meta.description).toBe(
      '陈成，拥有 10+ 年前端与全栈经验，覆盖复杂前端架构、百度地图数据作业、PHP / Python 服务、业务 SDK、跨端应用与团队管理。',
    )

    const anchored = resolveRoute('/work/layered-agent?from=home#demo')
    expect(anchored.anchor).toBe('demo')
    expect(anchored.href).toBe('/work/layered-agent?from=home#demo')

    const resumePreview = resolveRoute('/resume#pdf-preview')
    expect(resumePreview.route).toBe(ROUTES.RESUME)
    expect(resumePreview.anchor).toBe('pdf-preview')
    expect(resumePreview.href).toBe('/resume#pdf-preview')

    const playerRoute = resolveRoute('/demo?experience=layered-route-agent')
    expect(playerRoute.route).toBe(ROUTES.DEMO)
    expect(playerRoute.search).toBe('?experience=layered-route-agent')
  })

  it('1a. resolves player experiences through the finite trusted registry only', () => {
    const expectedIds = [
      'layered-route-agent',
      'layered-agent-action-graph',
      'poke-prototype-editor',
      'dataview-observatory',
      'turntable-motion-lab',
      'bezier-easing-picker',
      'irregular-shape-arrangement',
    ]

    expect(Object.keys(demoExperiences)).toEqual(expectedIds)
    expect(demoExperiences['layered-agent-action-graph'].name).toEqual({
      zh: '行为动作图',
      en: 'Behavior Action Graph',
    })
    expect(getDemoExperience('https://example.invalid/demo')).toBeNull()
    expect(getDemoExperience('unknown-experience')).toBeNull()
    expect(getDemoExperience(null)).toBeNull()
    expect(demoPlayerPath('poke-prototype-editor')).toBe(
      '/demo?experience=poke-prototype-editor',
    )

    const layeredSource = new URL(demoExperiences['layered-route-agent'].source)
    expect(layeredSource.pathname).toBe('/products')
    expect(layeredSource.searchParams.get('agent_demo')).toBe('1')
    expect(layeredSource.searchParams.get('embed')).toBe('1')
  })

  it('1b. keeps the player shell safe and its entry points registry-backed', () => {
    const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url))
    const playerPage = readFileSync(`${sourceRoot}/pages/DemoPlayerPage.tsx`, 'utf8')
    const deferredFrame = readFileSync(
      `${sourceRoot}/components/common/DeferredFrame.tsx`,
      'utf8',
    )
    const demoDirectory = readFileSync(
      `${sourceRoot}/components/common/DemoDirectory.tsx`,
      'utf8',
    )
    const homeHero = readFileSync(`${sourceRoot}/components/home/HomeHero.tsx`, 'utf8')
    const sidebar = readFileSync(`${sourceRoot}/components/layout/Sidebar.tsx`, 'utf8')
    const playerCss = readFileSync(`${sourceRoot}/styles/demo-player.css`, 'utf8')
    const layeredSource = readFileSync(`${sourceRoot}/data/featured/layeredAgent.ts`, 'utf8')

    expect(playerPage).toContain("getDemoExperience(new URLSearchParams(route.search).get('experience'))")
    expect(playerPage).toContain('if (!experience?.source || loaded || timedOut) return')
    expect(playerPage).toContain('if (!experience?.source) return <UnavailableDemo route={route} />')
    expect(playerPage).toContain('new URLSearchParams(route.search).get(\'experience\')')
    expect(playerPage).toContain('sandbox={experience.sandbox}')
    expect(playerPage).toContain('referrerPolicy="strict-origin-when-cross-origin"')
    expect(playerPage).toContain('className="demo-player-content" inert={drawerOpen ? true : undefined}')
    expect(playerPage).toContain('className="demo-guide-drag-handle" {...dragHandlers}')
    expect(playerPage).toContain('useDesktopGuidePosition(\n    !dismissed,\n    experience.id,\n  )')
    expect(playerPage).not.toContain('className="demo-guide-titlebar" {...dragHandlers}')
    expect(playerPage).not.toMatch(/searchParams\.get\(['\"](?:src|url)['\"]\)/)
    expect(playerPage).not.toContain('const names: Record<DemoExperience')
    expect(deferredFrame).toContain('to={demoPlayerPath(demo.experienceId)}')
    expect(deferredFrame).toContain('to={demoPlayerPath(visual.experienceId)}')
    expect(deferredFrame).toContain('visual.experienceId ?')
    expect(deferredFrame).not.toContain('href={demo.source}')
    expect(demoDirectory).toContain('to={demoPlayerPath(project.demo.experienceId)}')
    expect(homeHero).toContain("demoPlayerPath(agentProject.demo?.experienceId || 'layered-route-agent')")
    expect(sidebar).toContain('handle: HTMLElement')
    expect(sidebar).toContain('dragRef.current = null')
    expect(sidebar).toContain('releaseGuidePointer(dragRef)')
    expect(playerCss).toContain('.demo-guide-drag-handle')
    expect(playerCss).toContain('@media (prefers-reduced-motion: reduce)')
    expect(getLocalizedProjects([layeredAgentProject], 'en')[0].visuals).toHaveLength(
      layeredAgentProject.visuals?.length || 0,
    )
    expect(layeredSource).toContain("source: demoExperiences['layered-agent-action-graph'].source")
  })

  it('keeps player chrome outside the embedded demo interaction area', () => {
    const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url))
    const playerCss = readFileSync(`${sourceRoot}/styles/demo-player.css`, 'utf8')

    expect(playerCss).toMatch(
      /\.demo-player-content \{[\s\S]*?grid-template-rows: auto minmax\(0, 1fr\)/,
    )
    expect(playerCss).toMatch(
      /\.demo-player-stage \{[\s\S]*?position: relative[\s\S]*?grid-row: 2/,
    )
    expect(playerCss).toMatch(
      /\.demo-player-chrome \{[\s\S]*?position: relative[\s\S]*?grid-row: 1/,
    )
    expect(playerCss).toMatch(
      /@media \(max-width: 760px\)[\s\S]*?\.demo-player-chrome \{[\s\S]*?margin: 0/,
    )
  })

  it('1c. directs contextual résumé entry to an anchored, accessible preview', () => {
    const homeHeroPath = fileURLToPath(
      new URL('../src/components/home/HomeHero.tsx', import.meta.url),
    )
    const sidebarPath = fileURLToPath(
      new URL('../src/components/layout/Sidebar.tsx', import.meta.url),
    )
    const resumePagePath = fileURLToPath(
      new URL('../src/pages/ResumePage.tsx', import.meta.url),
    )
    const generatorPath = fileURLToPath(
      new URL('../../../scripts/generate_public_resume.py', import.meta.url),
    )
    const homeHero = readFileSync(homeHeroPath, 'utf8')
    const sidebar = readFileSync(sidebarPath, 'utf8')
    const resumePage = readFileSync(resumePagePath, 'utf8')
    const generator = readFileSync(generatorPath, 'utf8')

    expect(profile.contact.website).toBe('https://me.azlar.cc')
    expect(homeHero).toContain('to="/resume#pdf-preview"')
    expect(homeHero).not.toContain('download={')
    expect(sidebar).toContain('to="/resume"')
    expect(resumePage).toContain("route.anchor === 'pdf-preview'")
    expect(resumePage).toContain('id="pdf-preview"')
    expect(resumePage).toContain('aria-expanded={isPreviewOpen}')
    expect(resumePage).toContain('aria-controls="pdf-preview-content"')
    expect(resumePage).toContain('{isPreviewOpen ? (')
    expect(resumePage.indexOf('id="pdf-preview"')).toBeLessThan(
      resumePage.indexOf('className="resume-summary"'),
    )
    expect(resumePage.indexOf('id="pdf-preview"')).toBeLessThan(
      resumePage.lastIndexOf('resume-website'),
    )
    expect(resumePage).toContain('profile.contact.website')
    expect(generator).toContain("contact['website']")
    expect(generator).toContain("More: {plain_text(contact['website'])}")
    expect(generator).not.toContain("Website: {plain_text(contact['website'])}")
    expect(generator).toContain('drawCentredString(A4[0] / 2, 13 * mm, website)')
  })

  it('2. resolves every unknown path to an explicit NotFound route', () => {
    const resolved = resolveRoute('/work/unknown-project?from=test#missing')

    expect(resolved.route).toBe(ROUTES.NOT_FOUND)
    expect(resolved.isNotFound).toBe(true)
    expect(resolved.pathname).toBe('/work/unknown-project')
    expect(resolved.canonicalHref).toBe('/not-found?from=test#missing')
  })

  it('3. migrates only the exact legacy hash map and preserves search/anchors', () => {
    const expectedLegacyRoutes = {
      resume: '/resume',
      'operations-agent-demo': '/work/layered-agent#demo',
      'operations-agent': '/work/layered-agent',
      'layered-route-lab': '/work/layered-agent#demo',
      'layered-route-lab-notes': '/work/layered-agent#route-model',
      'enterprise-console-platform': '/work/meican-platform#platform-shell',
      'embedded-operations-platform': '/work/meican-platform#embedded-pages',
      'embedded-business-sdk': '/work/meican-platform#business-sdk',
      'payment-platform': '/work/meican-platform#payment',
      'business-finance-platform': '/work/meican-platform#finance',
      'operations-design-system': '/work/meican-platform#design-system',
      'poke-prototype-editor': '/archive/poke-prototype-editor',
      'dataview-observatory': '/archive/dataview-observatory',
      'turntable-motion-lab': '/archive/turntable-motion-lab',
      'bezier-easing-picker': '/archive/bezier-easing-picker',
    } as const

    expect(LEGACY_HASH_ROUTES).toEqual(expectedLegacyRoutes)

    for (const [legacyId, destination] of Object.entries(expectedLegacyRoutes)) {
      expect(resolveLegacyHash(`#${legacyId}`), legacyId).toBe(destination)
      expect(resolveLegacyHash(`#/${legacyId}`), legacyId).toBe(destination)
    }

    expect(
      getLegacyRouteMigration({
        pathname: '/',
        search: '?source=legacy',
        hash: '#operations-agent-demo',
      }),
    ).toMatchObject({
      href: '/work/layered-agent?source=legacy#demo',
    })
    expect(resolveLegacyHash('operations-agent')).toBeNull()
    expect(resolveLegacyHash('#operations-agent/')).toBeNull()
    expect(resolveLegacyHash('#unknown')).toBeNull()
  })

  it('4. keeps project slugs unique and URL-safe', () => {
    const slugs = portfolioProjects.map((project) => project.slug)

    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(portfolioProjectBySlug.get(slug)?.slug).toBe(slug)
    }
  })

  it('5. keeps the four selected projects in the intended order', () => {
    expect(featuredProjects.map((project) => project.slug)).toEqual([
      'meican-platform',
      'baidu-map-workbench',
      'baijiahao-editor',
      'layered-agent',
    ])
    expect(featuredProjects.every((project) => project.tier === 'featured')).toBe(true)
  })

  it('keeps the two dense case diagrams vertically readable', () => {
    const cssPath = fileURLToPath(new URL('../src/styles/components.css', import.meta.url))
    const css = readFileSync(cssPath, 'utf8')

    expect(css).toMatch(
      /\.system-evolution-visual ol \{[\s\S]*?grid-template-columns: 1fr/,
    )
    expect(css).toMatch(
      /\.map-workbench-tracks \{[\s\S]*?grid-template-columns: 1fr/,
    )
    expect(css).toMatch(/\.map-rendering-flow \{\s*grid-template-columns: 1fr/)
    expect(css).toMatch(/\.map-data-flow \{\s*grid-template-columns: 1fr/)
  })

  it('keeps the Meican delivery metric and current platform status explicit', () => {
    expect(meicanPlatformProject.period).toBe('2019.11—2026.06')
    expect(meicanPlatformProject.impact[0]).toBe(
      '两个同类页面的开发周期由 5 个工作日缩短至 2 个工作日，周期缩短 60%。',
    )
    expect(meicanPlatformProject.status).toContain('仍在使用和迭代')
    expect(meicanPlatformProject.thesis).toContain('我负责美餐多个企业后台的核心架构设计')
    expect(meicanPlatformProject.thesis).toContain('并带领团队完成存量迁移与后续开发')
    expect(meicanPlatformProject.thesis).toContain('后续财务项目亦沿用')

    const deliveryChapter = meicanPlatformProject.chapters.find(
      (chapter) => chapter.id === 'page-delivery',
    )
    expect(deliveryChapter?.paragraphs.join('')).toContain('周期缩短 60%')
    expect(deliveryChapter?.phase).toBe('2020 年完成核心设计 · 持续维护至今')
  })

  it('6. keeps Elpis and the public reconstructions in the personal project collection', () => {
    expect(archiveProjects.length).toBeGreaterThanOrEqual(5)
    expect(archiveProjects.map((project) => project.slug)).toEqual(
      expect.arrayContaining([
        'elpis',
        'coco-wallet',
        'poke-prototype-editor',
        'dataview-observatory',
        'turntable-motion-lab',
        'bezier-easing-picker',
        'merchant-commerce',
        'irregular-shape-layout',
      ]),
    )
    expect(archiveProjects.every((project) => project.tier === 'archive')).toBe(true)
  })

  it('keeps the clean-room irregular-shape lab registry-backed and bounded', () => {
    const project = portfolioProjectBySlug.get('irregular-shape-layout')
    const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url))
    const assetPath = `${sourceRoot}/assets/irregular-shape-layout-lab.html`
    const source = readFileSync(assetPath, 'utf8')

    expect(project).toMatchObject({
      slug: 'irregular-shape-layout',
      tier: 'archive',
      provenance: 'public-reconstruction',
      period: '2025.04—2025.05 · 未完成内部原型 / 公开重建',
      demo: {
        experienceId: 'irregular-shape-arrangement',
        source: demoExperiences['irregular-shape-arrangement'].source,
        posterVariant: 'irregular-geometry',
      },
    })
    expect(project?.chapters.map((chapter) => chapter.id)).toEqual([
      'problem-input-contract',
      'sampled-geometry',
      'radial-search',
      'angle-refinement',
      'diagnostics-public-reconstruction',
      'unfinished-boundary',
    ])
    expect(demoExperiences['irregular-shape-arrangement']).toMatchObject({
      id: 'irregular-shape-arrangement',
      casePath: '/archive/irregular-shape-layout',
      provenance: 'public-reconstruction',
      sandbox: 'allow-scripts',
      posterVariant: 'irregular-geometry',
    })
    expect(demoExperiences['irregular-shape-arrangement'].source).not.toHaveLength(0)

    const centerSelect = source.match(
      /<select\b[^>]*\bid=["']center-shape["'][^>]*>([\s\S]*?)<\/select>/i,
    )?.[1] ?? ''
    const centerOptions = [...centerSelect.matchAll(/<option\b[^>]*\bvalue=["']([^"']+)["'][^>]*>/gi)]
      .map(([, value]) => value)
    const animationInput = source.match(/<input\b[^>]*\bid=["']animate-search["'][^>]*>/i)?.[0] ?? ''
    const playbackSpeedSelect = source.match(
      /<select\b[^>]*\bid=["']playback-speed["'][^>]*>([\s\S]*?)<\/select>/i,
    )?.[1] ?? ''
    const playbackSpeeds = [...playbackSpeedSelect.matchAll(/<option\b[^>]*\bvalue=["']([^"']+)["'][^>]*>/gi)]
      .map(([, value]) => value)
    const debugInput = source.match(/<input\b[^>]*\bid=["']debug["'][^>]*>/i)?.[0] ?? ''

    expect(source).toMatch(/<div\b[^>]*\bid=["']controls["'][^>]*>/i)
    expect(source).not.toMatch(/<form\b[^>]*\bid=["']controls["'][^>]*>/i)
    expect(source).toMatch(/<button\b(?=[^>]*\bid=["']arrange["'])(?=[^>]*\btype=["']button["'])[^>]*>/i)
    expect(source).toMatch(/<button\b(?=[^>]*\bid=["']reset["'])(?=[^>]*\btype=["']button["'])[^>]*>/i)

    expect(centerOptions).toEqual(['circle', 'ellipse', 'petal', 'square'])
    expect(centerSelect).toMatch(
      /<option\b(?=[^>]*\bvalue=["']circle["'])(?=[^>]*\bselected\b)[^>]*>/i,
    )
    expect(source).toMatch(/<label\b[^>]*\bfor=["']count["'][^>]*>\s*Total shape count\b/i)
    expect(source).toContain('const outerCount = settings.count - 1')
    expect(source).toContain('center fixed')

    expect(debugInput).toMatch(/\btype=["']checkbox["']/i)
    expect(debugInput).not.toContain('debug-layer')
    expect(source).toMatch(/<g\b[^>]*\bid=["']debug-layer["'][^>]*>/i)
    expect(source).toMatch(
      /label\.textContent\s*=\s*String\(shape\.id\s*\+\s*1\)\s*;?\s*layers\.labels\.append\(label\)/,
    )

    expect(animationInput).toMatch(/\btype=["']checkbox["']/i)
    expect(animationInput).not.toMatch(/\bchecked\b/i)
    expect(playbackSpeeds).toEqual(['0.5', '1', '2', '4'])
    expect(playbackSpeedSelect).toMatch(
      /<option\b(?=[^>]*\bvalue=["']1["'])(?=[^>]*\bselected\b)[^>]*>/i,
    )

    expect(source).toContain('placementObjective')
    expect(source).toContain('localExcessGap')
    expect(source).toContain('getTotalLength()')
    expect(source).toContain('getPointAtLength')
    expect(source).toContain('segmentsIntersect')
    expect(source).toContain('pointInPolygon')
    expect(source).toContain('MAX_RADIAL_STEPS')
    expect(source).toContain('MAX_ANGLE_ROUNDS')
    expect(source).toContain('MAX_ANGLE_STEPS')
    expect(source).toContain('localToWorld')
    expect(source).toContain('mulberry32')
    expect(source).toMatch(/function outerSeed\(seed, outerIndex\)/)
    expect(source).toMatch(
      /const random\s*=\s*mulberry32\(outerSeed\(settings\.seed,\s*outerIndex\)\)/,
    )
    expect(source).not.toMatch(/\bMath\.random\s*\(/)
    expect(source).not.toMatch(/https?:\/\//)
    expect(source).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket)\b/)

    expect(source).toMatch(/function\*\s+searchIterator\s*\(/)
    expect(source.match(/\bsearchIterator\s*\(/g)).toHaveLength(2)
    expect(source).toMatch(
      /run\.iterator\s*=\s*searchIterator\(\s*(?:state\.)?shapes,\s*settings,\s*run\.metrics\)/,
    )
    expect(source).toContain('const next = run.iterator.next()')
    expect(source).toMatch(/function drainRun\(run\)[\s\S]*?advanceRun\(run\)/)
    expect(source).toMatch(/function scheduleFrame\(run\)[\s\S]*?advanceRun\(run\)/)
    expect(source).toMatch(
      /if\s*\(\s*immediate\s*\|\|\s*!settings\.animate\s*\|\|\s*reducedMotion\.matches\s*\)\s*\{\s*drainRun\(run\)/,
    )
    expect(source).toMatch(
      /function cancelRun\(\)\s*\{\s*state\.runToken\s*\+=\s*1\s*if\s*\(state\.raf\)\s*cancelAnimationFrame\(state\.raf\)\s*state\.raf\s*=\s*0\s*if\s*\(state\.run\)\s*state\.run\.cancelled\s*=\s*true\s*state\.run\s*=\s*null/s,
    )
    expect(source).toMatch(/function arrange\([\s\S]*?cancelRun\(\)\s*const settings\s*=\s*readSettings\(\)/)
    expect(source).toMatch(
      /document\.addEventListener\(['"]visibilitychange['"],[\s\S]*?document\.hidden[\s\S]*?cancelAnimationFrame\(state\.raf\)[\s\S]*?scheduleFrame\(run\)/,
    )
    expect(source).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
    expect(source).toMatch(
      /const\s+handleReducedMotion\s*=\s*\(event\)\s*=>\s*\{[\s\S]*?event\.matches\s*&&\s*state\.run\)\s*drainRun\(state\.run\)/,
    )

    // Playback is time-based, rather than one evaluation per display frame. It must
    // still protect the UI with both a work-item cap and a compute-time deadline.
    expect(source).toMatch(
      /\b(?:const|let)\s+[A-Za-z_$][\w$]*(?:checkpoints|evaluations)[\w$]*_per_second\s*=\s*30\b/i,
    )
    expect(source).toMatch(
      /requestAnimationFrame\([\s\S]{0,1800}?(?:\bperformance\.now\(\)|\b(?:timestamp|now|time)\b)[\s\S]{0,1800}?run\.\w*Budget\s*=\s*Math\.min\([\s\S]{0,300}?run\.\w*Budget\s*\+/,
    )
    expect(source).toMatch(
      /\b(?:const|let)\s+[A-Za-z_$][\w$]*(?:(?:steps|evaluations)[\w$]*(?:frame|tick)|(?:frame|tick)[\w$]*(?:steps|evaluations))[\w$]*\s*=\s*[1-9]\d*\b/i,
    )
    expect(source).toMatch(
      /\b(?:const|let)\s+[A-Za-z_$][\w$]*(?:frame|tick|cpu|compute)[\w$]*(?:deadline|budget|ms)[\w$]*\s*=\s*[1-9]\d*(?:\.\d+)?\b/i,
    )
    expect(source).toMatch(
      /while\s*\([\s\S]{0,500}?(?:(?:steps|evaluations)[\w.]*\s*<|\bMAX_[A-Z_]*(?:STEPS|EVALUATIONS))[\s\S]{0,500}?advanceRun\(run\)/i,
    )
    expect(source).toMatch(
      /while\s*\([\s\S]{0,500}?(?:performance\.now\(\)\s*<[\s\S]{0,100}?(?:deadline|budget)|(?:deadline|budget)[\w.]*\s*[><=])[\s\S]{0,500}?advanceRun\(run\)/i,
    )

    // Geometry settings are staged until Arrange; they do not restart an active
    // search as a side effect. The debug overlay remains visible during playback.
    const geometryInputBinding = source.match(
      /inputs\.forEach\([\s\S]*?(?=\$\(['"]debug['"]\)\.addEventListener)/,
    )?.[0] ?? ''
    expect(geometryInputBinding).toContain('addEventListener')
    expect(geometryInputBinding).not.toMatch(/\barrange\s*\(/)
    expect(source).not.toMatch(
      /\$\(['"]center-shape['"]\)\.addEventListener\(\s*['"](?:input|change)['"][\s\S]{0,300}?\barrange\s*\(/,
    )
    expect(source).toMatch(/if\s*\(\s*settings\.debug\s*\)\s*renderDebug\(shapes\)/)

    expect(source).toMatch(/<g\b[^>]*\bid=["']search-layer["'][^>]*>/i)
    expect(source).toMatch(
      /function displayedShapes\(\)[\s\S]*?event\s*===\s*['"]candidate['"][\s\S]*?outerIndex\s*\+\s*2[\s\S]*?state\.shapes\.slice\(0,\s*visibleCount\)/,
    )
    expect(source).toMatch(/\bid=["']search-progress["']/i)
    expect(source).toContain('Measured result and search progress')
    expect(source).toContain('Compute time')

    const guide = demoExperiences['irregular-shape-arrangement'].guide
    expect(guide.zh.summary).toContain('原始用途')
    expect(guide.zh.summary).toContain('餐盘与异形食品包装')
    expect(guide.zh.summary).toContain('当前 Lab 仅')
    expect(guide.en.summary).toContain('original project intent')
    expect(guide.en.summary).toContain('plates and irregular food packaging')
    expect(guide.en.summary).toContain('this Lab demonstrates only')
    expect(guide.zh.steps.join('')).toContain('可选开启计算 / 搜索动画')
    expect(guide.en.steps.join(' ')).toContain('Optionally enable calculation/search playback')
    expect(guide.zh.steps.join('')).toContain('动画与即时模式共享同一确定性计算与结果')
    expect(guide.en.steps.join(' ')).toContain(
      'animated and immediate modes share the same deterministic calculation and result',
    )
    expect(guide.zh.boundary).toContain('clean-room')
    expect(guide.zh.boundary).toContain('不复现或还原历史内部代码、界面、节奏或速度')
    expect(guide.en.boundary).toContain('clean-room')
    expect(guide.en.boundary).toContain(
      'not a reproduction or restoration of historical internal code, UI, timing, or speed',
    )
  })

  it('keeps Merchant as a redacted, text-only independent full-stack project archive', () => {
    const merchant = portfolioProjectBySlug.get('merchant-commerce')
    const merchantText = JSON.stringify(merchant)

    expect(merchant).toMatchObject({
      tier: 'archive',
      provenance: 'personal-product',
      period: '2024.07—2025.06 · 独立全栈项目（仓库记录）',
      eyebrow: 'INDEPENDENT FULL-STACK PROJECT / ARCHIVE',
    })
    expect(merchant?.links).toBeUndefined()
    expect(merchant?.demo).toBeUndefined()
    expect(merchant?.visuals).toBeUndefined()
    expect(merchant?.chapters.map((chapter) => chapter.id)).toEqual([
      'delivery-shape',
      'customer-purchase-flow',
      'operations-console',
      'transaction-after-sales',
      'fulfillment-support',
      'service-delivery',
      'public-disclosure-boundary',
    ])
    expect(merchantText).toContain('Flutter')
    expect(merchantText).toContain('Dio')
    expect(merchantText).toContain('React 18')
    expect(merchantText).toContain('Go 1.22')
    expect(merchantText).toContain('微信支付')
    expect(merchantText).toContain('不连接服务')
    expect(merchantText).not.toMatch(/https?:\/\//)
    expect(merchantText).not.toMatch(/Alipay|支付宝/)
    expect(merchantText).not.toMatch(/外部交付|external delivery/i)
  })

  it('keeps the former Elpis URL as an alias of its personal-project route', () => {
    const resolved = resolveRoute('/work/elpis')

    expect(resolved.route).toBe(ROUTES.ELPIS)
    expect(resolved.canonicalHref).toBe('/archive/elpis')
    expect(resolved.needsCanonicalReplace).toBe(true)
  })

  it('7. keeps chapter anchors unique within every project', () => {
    for (const project of portfolioProjects) {
      const chapterIds = project.chapters.map((chapter) => chapter.id)
      expect(chapterIds.length, project.slug).toBeGreaterThan(0)
      expect(new Set(chapterIds).size, project.slug).toBe(chapterIds.length)
      for (const chapterId of chapterIds) {
        expect(chapterId, `${project.slug}#${chapterId}`).toMatch(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        )
      }
    }
  })

  it('8. maps every internal project navigation item to a canonical route and real anchor', () => {
    const navigationItems = projectNavigation.flatMap((group) => group.items)

    expect(navigationItems.map((item) => item.slug).sort()).toEqual(
      portfolioProjects.map((project) => project.slug).sort(),
    )

    for (const group of projectNavigation) {
      for (const item of group.items) {
        const project = portfolioProjectBySlug.get(item.slug)
        expect(project, item.slug).toBeDefined()
        expect(item.anchors).toEqual(
          project?.chapters.map((chapter) => ({
            id: chapter.id,
            label: chapter.title,
          })),
        )

        const route = resolveRoute(
          group.id === 'featured'
            ? `/work/${item.slug}`
            : `/archive/${item.slug}`,
        )
        expect(route.isNotFound, item.slug).toBe(false)
      }
    }

    const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url))
    const hardCodedTargets = collectSourceFiles(sourceRoot)
      .filter((path) => path.endsWith('.tsx'))
      .flatMap((path) =>
        [...readFileSync(path, 'utf8').matchAll(/\bto=(?:"([^"]+)"|'([^']+)')/g)].map(
          (match) => ({ path, target: match[1] || match[2] }),
        ),
      )

    for (const { path, target } of hardCodedTargets) {
      expect(resolveRoute(target).isNotFound, `${path}: ${target}`).toBe(false)
    }
  })

  it('9. keeps the public profile employment dates explicit and closed', () => {
    expect(
      profile.experience.map(({ company, start, end, period }) => ({
        company,
        start,
        end,
        period,
      })),
    ).toEqual([
      {
        company: '美餐网',
        start: '2019.11',
        end: '2026.06',
        period: '2019.11—2026.06',
      },
      {
        company: '百度',
        start: '2017.11',
        end: '2019.11',
        period: '2017.11—2019.11',
      },
      {
        company: '北京度家科技有限公司',
        start: '2017.03',
        end: '2017.11',
        period: '2017.03—2017.11',
      },
      {
        company: '三亚汪汪信息科技有限公司',
        start: '2015.08',
        end: '2017.03',
        period: '2015.08—2017.03',
      },
      {
        company: '爱旅行',
        start: '2012.09',
        end: '2015.08',
        period: '2012.09—2015.08',
      },
    ])
  })

  it('records the Baidu frontend team size without inventing project details', () => {
    const baiduExperience = profile.experience.find(
      (experience) => experience.company === '百度',
    )

    expect(baiduExperience?.overview).toBe(
      '在百度带领 5 名前端工程师，项目覆盖复杂 SVG 地图数据作业、空间统计与百家号图文编辑器，并直接参与 PHP / Python 数据服务与批处理交付。',
    )
  })

  it('keeps the Baidu backend evidence and infrastructure boundary explicit', () => {
    const baiduExperience = profile.experience.find(
      (experience) => experience.company === '百度',
    )
    const baiduText = JSON.stringify(baiduExperience)

    expect(baiduText).toContain('PHP / Yii2 众源统计服务及指标 API')
    expect(baiduText).toContain('Elasticsearch count / search / scroll')
    expect(baiduText).toContain('PostgreSQL')
    expect(baiduText).toContain('JSONB 例外分析')
    expect(baiduText).not.toMatch(/Elasticsearch 集群|Kafka 平台|消息队列建设/)
  })

  it('keeps the Baidu Maps case split between rendering and backend leadership', () => {
    const mapText = JSON.stringify(baiduMapWorkbenchProject)

    expect(baiduMapWorkbenchProject.tier).toBe('featured')
    expect(baiduMapWorkbenchProject.provenance).toBe('production')
    expect(mapText).toContain('Map、Layer、Feature、Element')
    expect(mapText).toContain('RBush')
    expect(mapText).toContain('Python / Tornado')
    expect(mapText).toContain('PostgreSQL / JSONB')
    expect(mapText).toContain('PHP / Yii2')
    expect(mapText).toContain('Elasticsearch count / search / scroll')
    expect(mapText).toContain('带领 5 名前端工程师')
    expect(baiduMapWorkbenchProject.provenanceNote).toContain(
      '不把缺少完整历史归属的内部地图底层整体视为个人独立成果',
    )
    expect(mapText).not.toMatch(
      /WebGL 地图引擎|Elasticsearch 集群建设|Kafka 平台建设|独立完成整套地图系统/,
    )
  })

  it('describes Baidu road-attribute work as implementation, not commit metadata', () => {
    const roadImpact = baiduMapWorkbenchProject.impact[1]
    const interactionChapter = baiduMapWorkbenchProject.chapters.find(
      (chapter) => chapter.id === 'workbench-interactions',
    )
    const interactionText = interactionChapter?.paragraphs.join(' ') || ''
    const englishProject = getLocalizedProjects(
      [baiduMapWorkbenchProject],
      'en',
    )[0]
    const englishRoadImpact = englishProject.impact[1]
    const englishInteractionText =
      englishProject.chapters
        .find((chapter) => chapter.id === 'workbench-interactions')
        ?.paragraphs.join(' ') || ''

    expect(roadImpact).toContain('实现道路属性规格适配')
    expect(roadImpact).toContain('后端数据规格与前端视觉模型之间的双向转换')
    expect(roadImpact).not.toMatch(/个人提交|提交的实现/)
    expect(interactionText).toMatch(/TTFA.*时间条件.*车辆类型位图.*车道组成/)
    expect(interactionText).toContain('兼容新旧数据规格')
    expect(englishRoadImpact).toContain('implemented road-attribute adaptation')
    expect(englishRoadImpact).not.toMatch(/personal commits|directly attributable commits/i)
    expect(englishInteractionText).toMatch(
      /time conditions.*vehicle-type bitmasks.*lane composition.*TTFA/i,
    )
    expect(englishInteractionText).toContain('compatibility across specification revisions')
  })

  it('positions full-stack delivery as an evidenced career stage', () => {
    const sanyaExperience = profile.experience.find(
      (experience) => experience.company === '三亚汪汪信息科技有限公司',
    )
    const engineeringSkills = profile.skills.find(
      (skillGroup) => skillGroup.label === '跨端与工程',
    )

    expect(profile.headline).toContain('全栈交付')
    expect(profile.summary.join('')).toContain('职业前期担任研发负责人及前后端主程')
    expect(JSON.stringify(sanyaExperience)).toContain('Yii2')
    expect(JSON.stringify(sanyaExperience)).toContain('服务器部署维护')
    expect(engineeringSkills?.items).toEqual(
      expect.arrayContaining([
        'Elasticsearch（项目使用经验）',
        'Kafka（项目使用经验）',
      ]),
    )
  })

  it('keeps the Baijiahao editor evolution and contribution boundary explicit', () => {
    expect(baijiahaoEditorProject.thesis).toContain('UEditor 1.4.3')
    expect(baijiahaoEditorProject.thesis).toContain('迁移、清理和模块化')
    expect(baijiahaoEditorProject.impact.join('')).toContain('@baidu/bjh-editor')
    expect(baijiahaoEditorProject.provenanceNote).toContain('内部开源')
    expect(baijiahaoEditorProject.provenanceNote).toContain('不代表公开 GitHub')
  })

  it('keeps Coco Wallet in the independent delivery collection with a team boundary', () => {
    expect(cocoWalletProject.tier).toBe('archive')
    expect(cocoWalletProject.period).toBe('2018 · 团队兼职项目')
    expect(cocoWalletProject.role).toContain('移动端核心贡献')
    expect(cocoWalletProject.provenanceNote).toContain('团队成果')
    expect(cocoWalletProject.demo).toBeUndefined()
  })

  it('records the Meican frontend team-size range concisely', () => {
    const meicanExperience = profile.experience.find(
      (experience) => experience.company === '美餐网',
    )
    const meicanText = JSON.stringify(meicanExperience)

    expect(meicanText).toContain('长期带领前端团队（4-8 人）')
    expect(meicanText).not.toContain('曾负责 6 人前端团队')
    expect(meicanText).not.toContain('团队通常 7 人')
  })

  it('keeps the homepage introduction formal and descriptive', () => {
    const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url))
    const homeHero = readFileSync(
      `${sourceRoot}/components/home/HomeHero.tsx`,
      'utf8',
    )
    const capabilityList = readFileSync(
      `${sourceRoot}/components/home/CapabilityList.tsx`,
      'utf8',
    )

    expect(siteCopy.zh.home.titleLines).toEqual([
      '复杂系统的前端架构',
      '与全栈交付',
    ])
    expect(homeHero).toContain('copy.home.titleLines')
    expect(JSON.stringify(siteCopy.zh.home)).not.toMatch(/真正|做出来|怎么/)
    expect(homeHero).not.toMatch(/Elasticsearch|Kafka/)
    expect(siteCopy.zh.home.capabilities.map(([title]) => title)).toEqual(
      expect.arrayContaining(['存量系统改造', '跨栈学习与完整交付']),
    )
    expect(capabilityList).toContain('copy.home.capabilities')
    expect(JSON.stringify(siteCopy.zh.home.capabilities)).not.toMatch(/怎么|真正/)
  })

  it('positions opportunity preference and learning history without overstating depth', () => {
    const learningText = `${profile.strengths.join('')} ${JSON.stringify(siteCopy.zh.experience.growth)}`

    expect(profile.availability).toBe(
      '目前考虑 AI Agent 相关研发、Full Stack Engineer 与前端相关机会。',
    )
    expect(learningText).toContain('兼职旅游项目')
    expect(learningText).toContain('前端工具创业团队')
    expect(learningText).toContain('React Native')
    expect(learningText).toContain('PHP / Python')
    expect(learningText).toContain('空间统计')
    expect(learningText).not.toMatch(/精通 React Native|精通统计计算|从零掌握/)
  })

  it('keeps prominent Demo entrances at the top of Overview and Personal Projects', () => {
    const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url))
    const homeHero = readFileSync(
      `${sourceRoot}/components/home/HomeHero.tsx`,
      'utf8',
    )
    const archivePage = readFileSync(
      `${sourceRoot}/pages/ArchivePage.tsx`,
      'utf8',
    )

    expect(homeHero).toContain('copy.home.openAgentDemo')
    expect(homeHero.indexOf('copy.home.openAgentDemo')).toBeLessThan(
      homeHero.indexOf('copy.home.viewSelectedCase'),
    )
    expect(archivePage).toContain('<DemoDirectory')
    expect(archivePage.indexOf('<DemoDirectory')).toBeLessThan(
      archivePage.indexOf('className="archive-list"'),
    )
  })

  it('keeps the public phone number in the shared contact profile', () => {
    expect(profile.contact.phone).toBe('+86 176 1171 2655')
  })

  it('supports complete English content and a persistent language preference', () => {
    expect(
      resolvePreferredLanguage({ stored: 'en', browserLanguages: ['zh-CN'] }),
    ).toBe('en')
    expect(
      resolvePreferredLanguage({ stored: null, browserLanguages: ['zh-CN', 'en'] }),
    ).toBe('zh')
    expect(
      resolvePreferredLanguage({ stored: null, browserLanguages: ['en-US'] }),
    ).toBe('en')

    const englishProjects = getLocalizedProjects(portfolioProjects, 'en')
    const englishProfile = getLocalizedProfile('en')

    expect(englishProjects.map((project) => project.slug)).toEqual(
      portfolioProjects.map((project) => project.slug),
    )
    for (const [index, project] of englishProjects.entries()) {
      expect(project.chapters.map((chapter) => chapter.id), project.slug).toEqual(
        portfolioProjects[index].chapters.map((chapter) => chapter.id),
      )
      expect(JSON.stringify(project), project.slug).not.toMatch(/[\p{Script=Han}]/u)
    }
    expect(JSON.stringify(englishProfile)).not.toMatch(/[\p{Script=Han}]/u)
    expect(siteCopy.en.home.titleLines).toEqual([
      'Frontend architecture',
      'and full-stack delivery',
    ])
    expect(siteCopy.zh.demo.player.startHere).toBe('建议体验时长')
    expect(siteCopy.en.demo.player.startHere).toBe('Start here')

    const englishHomeMeta = getLocalizedRouteMeta(resolveRoute('/'), 'en')
    expect(englishHomeMeta.title).toBe(
      'Chen Cheng | Frontend Tech Lead · Full-Stack & Complex Systems',
    )
    expect(englishHomeMeta.description).not.toHaveLength(0)
  })

  it('10. keeps present-tense employment wording out of the public profile', () => {
    expect(JSON.stringify(profile)).not.toMatch(/至今|现负责|现任/)
  })

  it('11. derives the Agent demo source from the Lab products route and player registry', () => {
    expect(layeredAgentProject.demo).toBeDefined()

    const source = new URL(layeredAgentProject.demo!.source)
    expect(source.pathname).toBe('/products')
    expect(source.searchParams.get('agent_demo')).toBe('1')
    expect(source.searchParams.get('embed')).toBe('1')
    expect(source.hash).toBe('')
    expect(layeredAgentProject.demo?.desktopPreferred).toBe(true)
    expect(layeredAgentProject.links).toBeUndefined()
    expect(
      layeredAgentProject.visuals?.find((visual) => visual.id === 'agent-action-graph'),
    ).toMatchObject({
      experienceId: 'layered-agent-action-graph',
      source: demoExperiences['layered-agent-action-graph'].source,
    })
  })

  it('12. gives the Poke demo real resize handles and a cancellable pointer gesture', () => {
    const assetPath = fileURLToPath(
      new URL('../src/assets/poke-editor-demo.html', import.meta.url),
    )
    const source = readFileSync(assetPath, 'utf8')

    expect(source).toContain("handle.className = 'resize-handle'")
    expect(source).toContain("['nw','se']")
    expect(source).toContain("mode:'resize'")
    expect(source).toContain('artboard.setPointerCapture(event.pointerId)')
    expect(source).toContain('gesture.pointerId !== event.pointerId')
    expect(source).toContain("artboard.addEventListener('pointercancel'")
    expect(source).toContain("artboard.addEventListener('lostpointercapture'")
    expect(source).toContain('MIN_RESIZE_SIZE = 16')
    expect(source).not.toMatch(/\.selected::(?:before|after)/)
  })

  it('13. retains every source-backed legacy demo asset as non-empty HTML', () => {
    const demoAssets = [
      'bezier-picker-lab.html',
      'dataview-observatory-demo.html',
      'operations-agent-actiongraph.html',
      'operations-agent-architecture.html',
      'poke-editor-architecture.html',
      'poke-editor-demo.html',
      'turntable-motion-lab.html',
      'irregular-shape-layout-lab.html',
    ]

    for (const asset of demoAssets) {
      const assetPath = fileURLToPath(
        new URL(`../src/assets/${asset}`, import.meta.url),
      )
      expect(statSync(assetPath).size, asset).toBeGreaterThan(0)
      expect(readFileSync(assetPath, 'utf8'), asset).toMatch(/<!doctype html|<html/i)
    }
  })

  it('14. keeps mobile demos focused, legible, and explicit about desktop-only interaction', () => {
    const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url))
    const player = readFileSync(`${sourceRoot}/pages/DemoPlayerPage.tsx`, 'utf8')
    const sidebar = readFileSync(
      `${sourceRoot}/components/layout/Sidebar.tsx`,
      'utf8',
    )
    const playerCss = readFileSync(`${sourceRoot}/styles/demo-player.css`, 'utf8')
    const irregular = readFileSync(
      `${sourceRoot}/assets/irregular-shape-layout-lab.html`,
      'utf8',
    )
    const turntable = readFileSync(
      `${sourceRoot}/assets/turntable-motion-lab.html`,
      'utf8',
    )
    const poke = readFileSync(`${sourceRoot}/assets/poke-editor-demo.html`, 'utf8')
    const dataview = readFileSync(
      `${sourceRoot}/assets/dataview-observatory-demo.html`,
      'utf8',
    )
    const bezier = readFileSync(`${sourceRoot}/assets/bezier-picker-lab.html`, 'utf8')

    expect(player).toContain('activePath={experience.casePath}')
    expect(player).toContain('if (dismissed) return null')
    expect(playerCss).toContain('--text: #1d1e19')
    expect(playerCss).toContain('--accent-soft: #20211b')
    expect(sidebar).toContain('archiveProjects.filter((project) => Boolean(project.demo))')
    expect(sidebar).toContain('className="nav-projects-toggle"')
    expect(sidebar).toContain('className="nav-demo"')
    expect(sidebar).toContain('to={demoPlayerPath(demo.experienceId)}')

    expect(irregular).toContain('开始计算 element-${elementNumber} 与 element-1（中心元素）位置…')
    expect(irregular).toContain('开始移动 element-${elementNumber} 至目标位置…')
    expect(irregular).toContain('计算结束 · ${state.shapes.length} 个元素已定位')
    expect(irregular).toContain("workspace.scrollIntoView({")
    expect(irregular).toContain("workspace.focus({ preventScroll: true })")

    expect(turntable).toMatch(
      /@media \(max-width: 760px\)[\s\S]*?\.panel \{[\s\S]*?position: absolute[\s\S]*?\.controls \{ grid-template-columns: repeat\(3/,
    )
    expect(turntable).toContain('id="equalize"')
    expect(turntable).toContain('id="randomSpace"')
    expect(turntable).toContain('function equalize()')
    expect(turntable).toContain('function randomizeSpace()')
    expect(turntable).toContain('id="speedRange"')
    expect(turntable).toContain('id="speedRate"')
    expect(turntable).toContain('function setPlaybackRate(value)')
    expect(turntable).toContain("speedRange.addEventListener('input'")
    expect(turntable).toContain('const dt = Math.min(32, now-last) / 1000 * playbackRate')
    expect(turntable).not.toContain('id="slowButton"')
    expect(turntable).not.toContain('function setSlow(')
    expect(turntable).toContain('color: colors[nextColorIndex++ % colors.length]')
    expect(turntable).toContain('function removeSlice(index)')
    expect(turntable).toContain('const midpoint = (removed.start+removed.end)/2')
    expect(turntable).toContain('right.targetStart = removed.start')
    expect(poke).toContain('请在 PC 平台体验')
    expect(poke).toContain('class="mobile-pc-notice"')

    expect(dataview).toContain('const tourTimeline = [')
    expect(dataview).toContain('autoTourTimer = setTimeout(runTour,320)')
    expect(dataview).toContain("{view:'flow',label:'归档完成',flowStep:3}")
    expect(bezier).toMatch(
      /@media \(max-width: 560px\)[\s\S]*?\.shell \{[^}]*overflow-x: hidden/,
    )
    expect(bezier).toMatch(/\.board-card svg \{[^}]*touch-action: pan-y/)
    expect(bezier).toMatch(/\.handle \{[^}]*touch-action: none/)
  })
})
