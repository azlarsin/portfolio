import type { Language } from '../i18n/LanguageContext'
import { getLocalizedRouteMeta } from '../i18n/routeMeta'
import type { ResolvedRoute, RouteId } from './router'

export const PORTFOLIO_ORIGIN = 'https://me.azlar.cc'
export const PORTFOLIO_SOCIAL_IMAGE_PATH = '/og.png'

const nonIndexableRouteIds = new Set<RouteId>(['baby', 'demo', 'poke-render', 'not-found'])
const caseStudyRouteIds = new Set<RouteId>([
  'meican-platform',
  'baidu-map-workbench',
  'baijiahao-editor',
  'layered-agent',
  'elpis',
  'archive-coco-wallet',
  'archive-poke-prototype-editor',
  'archive-dataview-observatory',
  'archive-turntable-motion-lab',
  'archive-bezier-easing-picker',
  'archive-merchant-commerce',
  'archive-irregular-shape-layout',
])

export interface PortfolioSeo {
  title: string
  description: string
  canonicalUrl: string
  imageUrl: string | null
  imageAlt: string | null
  siteName: string
  locale: 'zh_CN' | 'en_US'
  openGraphType: 'website' | 'article'
  twitterCard: 'summary' | 'summary_large_image'
  robots: string
  jsonLd: Record<string, unknown>
}

export function canonicalPath(path: string) {
  return path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`
}

export function canonicalUrl(path: string) {
  return new URL(canonicalPath(path), PORTFOLIO_ORIGIN).toString()
}

export function isIndexableRoute(route: Pick<ResolvedRoute, 'id'>) {
  return !nonIndexableRouteIds.has(route.id)
}

function pageSchemaType(route: Pick<ResolvedRoute, 'id'>) {
  if (route.id === 'archive') return 'CollectionPage'
  if (route.id === 'home' || route.id === 'experience' || route.id === 'resume') {
    return 'ProfilePage'
  }
  if (caseStudyRouteIds.has(route.id)) return 'CreativeWork'
  return 'WebPage'
}

function createJsonLd(
  route: ResolvedRoute,
  language: Language,
  title: string,
  description: string,
  url: string,
) {
  const siteName = language === 'zh' ? '陈成作品集' : 'Chen Cheng Portfolio'
  const person = {
    '@type': 'Person',
    name: language === 'zh' ? '陈成' : 'Chen Cheng',
    url: PORTFOLIO_ORIGIN,
    jobTitle:
      language === 'zh'
        ? '前端技术负责人 / 全栈工程师'
        : 'Frontend Tech Lead / Full-Stack Engineer',
    sameAs: ['https://github.com/azlarsin'],
  }
  const schemaType = pageSchemaType(route)

  return {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: title,
    description,
    url,
    inLanguage: language === 'zh' ? 'zh-CN' : 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: `${PORTFOLIO_ORIGIN}/`,
    },
    ...(schemaType === 'CreativeWork' ? { creator: person } : { about: person }),
    ...(route.id === 'home' ? { mainEntity: person } : {}),
  }
}

export function getPortfolioSeo(
  route: ResolvedRoute,
  language: Language = 'zh',
): PortfolioSeo {
  const meta = getLocalizedRouteMeta(route, language)
  const url = canonicalUrl(route.path)
  const indexable = isIndexableRoute(route)
  const isCaseStudy = caseStudyRouteIds.has(route.id)

  return {
    ...meta,
    canonicalUrl: url,
    imageUrl: isCaseStudy || route.id === 'baby'
      ? null
      : new URL(PORTFOLIO_SOCIAL_IMAGE_PATH, PORTFOLIO_ORIGIN).toString(),
    imageAlt: isCaseStudy || route.id === 'baby'
      ? null
      : language === 'zh'
        ? '陈成｜前端技术负责人 · 全栈与复杂系统工程'
        : 'Chen Cheng | Frontend Tech Lead · Full-Stack & Complex Systems',
    siteName: language === 'zh' ? '陈成作品集' : 'Chen Cheng Portfolio',
    locale: language === 'zh' ? 'zh_CN' : 'en_US',
    openGraphType: isCaseStudy ? 'article' : 'website',
    twitterCard: isCaseStudy ? 'summary' : 'summary_large_image',
    robots: route.id === 'baby' ? 'noindex,nofollow,noimageindex' : indexable
      ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
      : 'noindex,follow',
    jsonLd: createJsonLd(route, language, meta.title, meta.description, url),
  }
}
