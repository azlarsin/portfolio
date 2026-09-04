import { useMemo, useSyncExternalStore } from 'react'

export interface RouteMeta {
  title: string
  description: string
}

interface RouteDefinitionShape {
  id: string
  path: string
  meta: RouteMeta
}

export const ROUTES = {
  HOME: {
    id: 'home',
    path: '/',
    meta: {
      title: '陈成｜前端技术负责人 · 全栈与复杂系统工程',
      description:
        '陈成，拥有 10+ 年前端与全栈经验，覆盖复杂前端架构、百度地图数据作业、PHP / Python 服务、业务 SDK、跨端应用与团队管理。',
    },
  },
  MEICAN_PLATFORM: {
    id: 'meican-platform',
    path: '/work/meican-platform',
    meta: {
      title: '企业后台架构改造｜陈成作品集',
      description: '大型企业后台的公共宿主、独立业务应用、嵌入页面与业务 SDK 架构。',
    },
  },
  BAIDU_MAP_WORKBENCH: {
    id: 'baidu-map-workbench',
    path: '/work/baidu-map-workbench',
    meta: {
      title: '百度地图数据作业｜陈成作品集',
      description: '复杂 SVG 地图作业、Python / PHP 数据服务与 5 人前端团队交付实践。',
    },
  },
  BAIJIAHAO_EDITOR: {
    id: 'baijiahao-editor',
    path: '/work/baijiahao-editor',
    meta: {
      title: '百家号编辑器演进｜陈成作品集',
      description: '从 UEditor 深度定制、业务插件迭代到内部复用包的存量编辑器演进实践。',
    },
  },
  LAYERED_AGENT: {
    id: 'layered-agent',
    path: '/work/layered-agent',
    meta: {
      title: 'Layered Route × Verified Agent｜陈成作品集',
      description: '从源码生成页面动作清单，让 Agent 按规则规划、执行并检查复杂 Web 应用操作。',
    },
  },
  ELPIS: {
    id: 'elpis',
    path: '/archive/elpis',
    meta: {
      title: 'Elpis 独立产品｜个人项目集',
      description: '独立设计与开发的儿童作品相册，用于记录作品、故事和成长时间线。',
    },
  },
  EXPERIENCE: {
    id: 'experience',
    path: '/experience',
    meta: {
      title: '职业经历｜陈成作品集',
      description: '陈成从前后端完整交付到复杂前端架构与团队管理的职业经历。',
    },
  },
  ARCHIVE: {
    id: 'archive',
    path: '/archive',
    meta: {
      title: '个人项目集｜陈成作品集',
      description: '独立产品、产品编辑器、数据可视化、动效实验与可复用交互组件。',
    },
  },
  ARCHIVE_COCO_WALLET: {
    id: 'archive-coco-wallet',
    path: '/archive/coco-wallet',
    meta: {
      title: 'Coco Wallet 跨平台钱包｜项目档案',
      description: 'React Native 多链钱包、交易授权状态流与 DApp WebView 容器的团队交付记录。',
    },
  },
  ARCHIVE_POKE_PROTOTYPE_EDITOR: {
    id: 'archive-poke-prototype-editor',
    path: '/archive/poke-prototype-editor',
    meta: {
      title: 'Poke 高保真原型编辑器｜项目档案',
      description: '桌面与网页共用内核的高保真移动原型编辑器设计与实现记录。',
    },
  },
  ARCHIVE_DATAVIEW_OBSERVATORY: {
    id: 'archive-dataview-observatory',
    path: '/archive/dataview-observatory',
    meta: {
      title: '超宽幅实时数据可视化平台｜项目档案',
      description: '面向 32:9 超宽屏的纯前端监测大屏、图形系统与交互联动实践。',
    },
  },
  ARCHIVE_TURNTABLE_MOTION_LAB: {
    id: 'archive-turntable-motion-lab',
    path: '/archive/turntable-motion-lab',
    meta: {
      title: 'Turntable Motion Lab｜项目档案',
      description: '基于 SVG 几何与弹簧模型的数据驱动转盘动效实验。',
    },
  },
  ARCHIVE_BEZIER_EASING_PICKER: {
    id: 'archive-bezier-easing-picker',
    path: '/archive/bezier-easing-picker',
    meta: {
      title: 'Bezier Easing Picker｜项目档案',
      description: '将 cubic-bezier 参数变成可直接操作、预览与复用的可视化组件。',
    },
  },
  ARCHIVE_MERCHANT_COMMERCE: {
    id: 'archive-merchant-commerce',
    path: '/archive/merchant-commerce',
    meta: {
      title: '移动电商独立全栈项目｜项目档案',
      description: 'Flutter Android 客户端、React 运营后台与 Go 服务的独立全栈项目归档，公开内容已脱敏。',
    },
  },
  ARCHIVE_IRREGULAR_SHAPE_LAYOUT: {
    id: 'archive-irregular-shape-layout',
    path: '/archive/irregular-shape-layout',
    meta: {
      title: '不规则形状布局实验｜项目档案',
      description: '以合成 SVG 轮廓呈现边界采样、径向有界搜索和邻角细化的公开 clean-room 重建实验。',
    },
  },
  DEMO: {
    id: 'demo',
    path: '/demo',
    meta: {
      title: '交互体验播放器｜陈成作品集',
      description: '在受限的全窗口播放器中体验经过登记的公开交互案例。',
    },
  },
  POKE_RENDER: {
    id: 'poke-render',
    path: '/poke/render',
    meta: {
      title: 'Poke 手机预览',
      description: '通过二维码打开 Poke 原型，并在手机端运行页面跳转与交互动效。',
    },
  },
  RESUME: {
    id: 'resume',
    path: '/resume',
    meta: {
      title: '个人简历｜陈成',
      description: '陈成的前端技术负责人、全栈交付经历、核心能力与公开版简历。',
    },
  },
  NOT_FOUND: {
    id: 'not-found',
    path: '/not-found',
    meta: {
      title: '页面未找到｜陈成作品集',
      description: '请返回作品集首页，或通过导航继续查看项目、经历与简历。',
    },
  },
} as const satisfies Record<string, RouteDefinitionShape>

export type RouteDefinition = (typeof ROUTES)[keyof typeof ROUTES]
export type RouteId = RouteDefinition['id']
export type RoutePath = RouteDefinition['path']

export const routeDefinitions = Object.freeze(
  Object.values(ROUTES),
) as readonly RouteDefinition[]

const routeByPath = new Map<string, RouteDefinition>()
for (const route of routeDefinitions) {
  routeByPath.set(route.path, route)
}

const routeAliases = new Map<string, RouteDefinition>([
  ['/work/elpis', ROUTES.ELPIS],
])

export interface RouteLocationLike {
  pathname: string
  search?: string
  hash?: string
}

export type RouteLocationInput = RouteLocationLike | URL | string

export interface ResolvedRoute {
  route: RouteDefinition
  id: RouteId
  path: RoutePath
  pathname: string
  search: string
  hash: string
  anchor: string | null
  href: string
  canonicalHref: string
  meta: RouteMeta
  isNotFound: boolean
  needsCanonicalReplace: boolean
}

const routeResolutionBase = 'https://portfolio.invalid/'

function normalizePathname(pathname: string) {
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`
  if (withLeadingSlash === '/') {
    return withLeadingSlash
  }

  return withLeadingSlash.replace(/\/+$/, '') || '/'
}

function normalizeSearch(search = '') {
  if (!search) {
    return ''
  }

  return search.startsWith('?') ? search : `?${search}`
}

function normalizeHash(hash = '') {
  if (!hash || hash === '#') {
    return ''
  }

  return hash.startsWith('#') ? hash : `#${hash}`
}

function readLocation(location: RouteLocationInput): Required<RouteLocationLike> {
  if (typeof location === 'string') {
    const url = new URL(location, routeResolutionBase)
    return {
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
    }
  }

  return {
    pathname: location.pathname,
    search: location.search || '',
    hash: location.hash || '',
  }
}

/** Resolve a URL-like value without reading or mutating browser globals. */
export function resolveRoute(location: RouteLocationInput): ResolvedRoute {
  const source = readLocation(location)
  const pathname = normalizePathname(source.pathname || '/')
  const search = normalizeSearch(source.search)
  const hash = normalizeHash(source.hash)
  const matchedRoute = routeByPath.get(pathname) || routeAliases.get(pathname)
  const route = matchedRoute || ROUTES.NOT_FOUND
  const anchor = hash ? hash.slice(1) : null

  return {
    route,
    id: route.id,
    path: route.path,
    pathname,
    search,
    hash,
    anchor,
    href: `${pathname}${search}${hash}`,
    canonicalHref: `${route.path}${search}${hash}`,
    meta: route.meta,
    isNotFound: route.id === ROUTES.NOT_FOUND.id,
    needsCanonicalReplace: Boolean(matchedRoute && source.pathname !== route.path),
  }
}

export const ROUTE_CHANGE_EVENT = 'portfolio:routechange'

export type RouteNavigationKind = 'push' | 'replace'

export interface RouteChangeDetail {
  kind: RouteNavigationKind
  route: ResolvedRoute
}

export interface NavigationOptions {
  state?: unknown
}

export type RouteDestination = RouteLocationInput

function requireWindow() {
  if (typeof window === 'undefined') {
    throw new Error('Portfolio navigation is only available in a browser.')
  }

  return window
}

function getLocationHref() {
  if (typeof window === 'undefined') {
    return '/'
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

const scrollStateKey = '__portfolioScrollY'

function mergeHistoryState(state: unknown, scrollY: number) {
  const base = typeof state === 'object' && state !== null ? state : {}
  return { ...base, [scrollStateKey]: scrollY }
}

export function saveCurrentScrollPosition() {
  const browser = requireWindow()
  browser.history.replaceState(
    mergeHistoryState(browser.history.state, browser.scrollY),
    '',
    getLocationHref(),
  )
}

export function getSavedScrollPosition() {
  if (typeof window === 'undefined') return 0
  const value = window.history.state?.[scrollStateKey]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function destinationHref(destination: RouteDestination) {
  const browser = requireWindow()

  if (typeof destination === 'string' || destination instanceof URL) {
    const url = new URL(destination.toString(), browser.location.href)
    if (url.origin !== browser.location.origin) {
      throw new Error(`Cannot navigate the portfolio router to another origin: ${url.origin}`)
    }

    return `${url.pathname}${url.search}${url.hash}`
  }

  const pathname = normalizePathname(destination.pathname)
  const search = normalizeSearch(destination.search)
  const hash = normalizeHash(destination.hash)
  return `${pathname}${search}${hash}`
}

/** Notify subscribers after code changes history with pushState or replaceState. */
export function notifyRouteChange(kind: RouteNavigationKind = 'replace') {
  const browser = requireWindow()
  const route = resolveRoute(browser.location)
  browser.dispatchEvent(
    new CustomEvent<RouteChangeDetail>(ROUTE_CHANGE_EVENT, {
      detail: { kind, route },
    }),
  )
  return route
}

export function navigate(destination: RouteDestination, options: NavigationOptions = {}) {
  const browser = requireWindow()
  saveCurrentScrollPosition()
  browser.history.pushState(
    mergeHistoryState(options.state, 0),
    '',
    destinationHref(destination),
  )
  return notifyRouteChange('push')
}

export function replace(destination: RouteDestination, options: NavigationOptions = {}) {
  const browser = requireWindow()
  const state = options.state === undefined ? browser.history.state : options.state
  browser.history.replaceState(mergeHistoryState(state, 0), '', destinationHref(destination))
  return notifyRouteChange('replace')
}

export function subscribeToRouteChanges(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  window.addEventListener('popstate', listener)
  window.addEventListener('hashchange', listener)
  window.addEventListener(ROUTE_CHANGE_EVENT, listener)

  return () => {
    window.removeEventListener('popstate', listener)
    window.removeEventListener('hashchange', listener)
    window.removeEventListener(ROUTE_CHANGE_EVENT, listener)
  }
}

export function getCurrentRoute() {
  return resolveRoute(getLocationHref())
}

/** React route state backed by popstate, hashchange, and router notifications. */
export function useCurrentRoute() {
  const href = useSyncExternalStore(subscribeToRouteChanges, getLocationHref, () => '/')
  return useMemo(() => resolveRoute(href), [href])
}

function decodeAnchor(anchor: string) {
  try {
    return decodeURIComponent(anchor.replace(/^#/, ''))
  } catch {
    return anchor.replace(/^#/, '')
  }
}

export function findAnchorTarget(anchor: string | null | undefined) {
  if (!anchor || typeof document === 'undefined') {
    return null
  }

  const id = decodeAnchor(anchor)
  return document.getElementById(id) || document.getElementsByName(id)[0] || null
}

/** Scroll an already-rendered route anchor. Rendering and top-of-page behavior stay in App. */
export function scrollToRouteAnchor(
  routeOrAnchor: Pick<ResolvedRoute, 'anchor'> | string | null | undefined,
  options: ScrollIntoViewOptions = { block: 'start' },
) {
  const anchor =
    typeof routeOrAnchor === 'object' && routeOrAnchor !== null
      ? routeOrAnchor.anchor
      : routeOrAnchor
  const target = findAnchorTarget(anchor)
  if (!target) {
    return false
  }

  target.scrollIntoView(options)
  return true
}
