import { replace, type ResolvedRoute } from './router'

/** Exact mappings from the former hash-routed portfolio. */
export const LEGACY_HASH_ROUTES = {
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

export type LegacyRouteId = keyof typeof LEGACY_HASH_ROUTES
export type LegacyRouteDestination = (typeof LEGACY_HASH_ROUTES)[LegacyRouteId]

export interface LegacyHashMatch {
  legacyId: LegacyRouteId
  destination: LegacyRouteDestination
}

export interface LegacyRouteMigration extends LegacyHashMatch {
  href: string
}

export interface CompletedLegacyRouteMigration extends LegacyRouteMigration {
  route: ResolvedRoute
}

export interface LegacyLocationLike {
  pathname?: string
  search?: string
  hash: string
}

function isLegacyRouteId(value: string): value is LegacyRouteId {
  return Object.prototype.hasOwnProperty.call(LEGACY_HASH_ROUTES, value)
}

/** Accept only the two historical forms: #id and #/id. */
export function matchLegacyHash(hash: string): LegacyHashMatch | null {
  let legacyId: string

  if (hash.startsWith('#/')) {
    legacyId = hash.slice(2)
  } else if (hash.startsWith('#')) {
    legacyId = hash.slice(1)
  } else {
    return null
  }

  if (!legacyId || !isLegacyRouteId(legacyId)) {
    return null
  }

  return {
    legacyId,
    destination: LEGACY_HASH_ROUTES[legacyId],
  }
}

export function resolveLegacyHash(hash: string) {
  return matchLegacyHash(hash)?.destination || null
}

function addSearchToDestination(destination: LegacyRouteDestination, search = '') {
  if (!search) {
    return destination
  }

  const normalizedSearch = search.startsWith('?') ? search : `?${search}`
  const hashIndex = destination.indexOf('#')
  if (hashIndex === -1) {
    return `${destination}${normalizedSearch}`
  }

  return `${destination.slice(0, hashIndex)}${normalizedSearch}${destination.slice(hashIndex)}`
}

/** Pure first-load migration lookup; canonical-page anchors are never treated as legacy. */
export function getLegacyRouteMigration(
  location: LegacyLocationLike,
): LegacyRouteMigration | null {
  const pathname = location.pathname || '/'
  if (pathname !== '/' && pathname !== '/index.html') {
    return null
  }

  const match = matchLegacyHash(location.hash)
  if (!match) {
    return null
  }

  return {
    ...match,
    href: addSearchToDestination(match.destination, location.search),
  }
}

/** Call once during App bootstrap, before rendering the current canonical route. */
export function migrateLegacyHashOnFirstLoad(): CompletedLegacyRouteMigration | null {
  if (typeof window === 'undefined') {
    return null
  }

  const migration = getLegacyRouteMigration(window.location)
  if (!migration) {
    return null
  }

  return {
    ...migration,
    route: replace(migration.href, { state: window.history.state }),
  }
}

export const migrateLegacyHash = migrateLegacyHashOnFirstLoad
