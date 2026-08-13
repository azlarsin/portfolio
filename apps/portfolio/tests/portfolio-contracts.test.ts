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
  archiveProjects,
  baijiahaoEditorProject,
  cocoWalletProject,
  featuredProjects,
  layeredAgentProject,
  meicanPlatformProject,
  portfolioProjectBySlug,
  portfolioProjects,
  projectNavigation,
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
  it('1. exposes the complete canonical route set with stable SEO metadata', () => {
    const expectedTitles = new Map([
      ['/', '陈成｜前端技术负责人 · 全栈与复杂系统工程'],
      ['/work/meican-platform', '企业后台架构改造｜陈成作品集'],
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
      '陈成，拥有 10+ 年前端与全栈经验。职业前期覆盖客户端、PHP / Python 服务、数据库与部署；近年聚焦复杂前端系统、业务 SDK、跨端应用与团队管理。',
    )

    const anchored = resolveRoute('/work/layered-agent?from=home#demo')
    expect(anchored.anchor).toBe('demo')
    expect(anchored.href).toBe('/work/layered-agent?from=home#demo')
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

  it('5. keeps the three selected projects in the intended order', () => {
    expect(featuredProjects.map((project) => project.slug)).toEqual([
      'meican-platform',
      'baijiahao-editor',
      'layered-agent',
    ])
    expect(featuredProjects.every((project) => project.tier === 'featured')).toBe(true)
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
      ]),
    )
    expect(archiveProjects.every((project) => project.tier === 'archive')).toBe(true)
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
      '在百度带领 5 名前端工程师，项目覆盖地图数据作业、空间统计与百家号图文编辑器，并参与 PHP / Python 数据服务与批处理交付。',
    )
  })

  it('keeps the Baidu backend evidence and infrastructure boundary explicit', () => {
    const baiduExperience = profile.experience.find(
      (experience) => experience.company === '百度',
    )
    const baiduText = JSON.stringify(baiduExperience)

    expect(baiduText).toContain('PHP / Yii2 指标 API')
    expect(baiduText).toContain('Elasticsearch count / search / scroll')
    expect(baiduText).toContain('PostgreSQL')
    expect(baiduText).toContain('JSONB 例外分析')
    expect(baiduText).not.toMatch(/Elasticsearch 集群|Kafka 平台|消息队列建设/)
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
      expect.arrayContaining(['存量系统改造', '前后端完整交付']),
    )
    expect(capabilityList).toContain('copy.home.capabilities')
    expect(JSON.stringify(siteCopy.zh.home.capabilities)).not.toMatch(/怎么|真正/)
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

    const englishHomeMeta = getLocalizedRouteMeta(resolveRoute('/'), 'en')
    expect(englishHomeMeta.title).toBe(
      'Chen Cheng | Frontend Tech Lead · Full-Stack & Complex Systems',
    )
    expect(englishHomeMeta.description).not.toHaveLength(0)
  })

  it('10. keeps present-tense employment wording out of the public profile', () => {
    expect(JSON.stringify(profile)).not.toMatch(/至今|现负责|现任/)
  })

  it('11. derives the Agent demo source from the Lab products route', () => {
    expect(layeredAgentProject.demo).toBeDefined()

    const source = new URL(layeredAgentProject.demo!.source)
    expect(source.pathname).toBe('/products')
    expect(source.searchParams.get('agent_demo')).toBe('1')
    expect(source.hash).toBe('')
    expect(layeredAgentProject.demo?.desktopPreferred).toBe(true)
    expect(
      layeredAgentProject.links?.find((link) => link.label === 'Agent Demo')?.url,
    ).toBe(layeredAgentProject.demo?.source)
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
    ]

    for (const asset of demoAssets) {
      const assetPath = fileURLToPath(
        new URL(`../src/assets/${asset}`, import.meta.url),
      )
      expect(statSync(assetPath).size, asset).toBeGreaterThan(0)
      expect(readFileSync(assetPath, 'utf8'), asset).toMatch(/<!doctype html|<html/i)
    }
  })
})
