import { behaviorManifest } from '../../../../layered-route-lab/src/agent/generated/behaviorManifest'

const paths = new Set<string>(behaviorManifest.routeInstances.map((route) => route.path))
const queryKeys = new Set(['manualPay', 'demo_data', 'date', 'period', 'focus_item'])

/** Only a known Lab route and its data filters can cross the player boundary. */
export function normalizeLabLocation(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/') || value.startsWith('//')) return null
  let url: URL
  try {
    url = new URL(value, 'https://lab.invalid')
  } catch {
    return null
  }
  if (url.origin !== 'https://lab.invalid' || !paths.has(url.pathname) || url.hash) return null
  const params = new URLSearchParams()
  for (const [key, content] of url.searchParams) {
    if (!queryKeys.has(key) || content.length > 200) return null
    params.set(key, content)
  }
  const search = params.toString()
  return `${url.pathname}${search ? `?${search}` : ''}`
}

export function labSourceAtLocation(source: string, location: string, standalone = false) {
  const normalized = normalizeLabLocation(location)
  const url = new URL(source)
  if (normalized) {
    const logical = new URL(normalized, url.origin)
    for (const key of queryKeys) url.searchParams.delete(key)
    if (url.searchParams.has('route')) url.searchParams.set('route', logical.pathname)
    else url.pathname = logical.pathname
    for (const [key, value] of logical.searchParams) url.searchParams.set(key, value)
  }
  if (standalone) {
    url.searchParams.delete('embed')
    url.searchParams.delete('agent_demo')
  }
  return url.toString()
}
