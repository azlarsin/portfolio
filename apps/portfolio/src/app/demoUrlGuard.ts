export interface ProductionDemoUrlOptions {
  allowLocal?: boolean
}

function normalizeHostname(hostname: string) {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
}

/**
 * Recognise loopback and local bind addresses that must not leak into a public
 * portfolio build. This deliberately does not reject private-network hosts:
 * deployments may use an internal reverse proxy with a private address.
 */
export function isLocalDemoHostname(hostname: string) {
  const normalized = normalizeHostname(hostname)

  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized === '0.0.0.0' ||
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('::ffff:127.') ||
    /^127(?:\.\d{1,3}){3}$/.test(normalized)
  )
}

/** Validate and return the external Demo URL used by production builds. */
export function assertProductionDemoUrl(
  value: string | undefined,
  options: ProductionDemoUrlOptions = {},
) {
  const demoUrl = value?.trim()

  if (!demoUrl) {
    throw new Error(
      'VITE_LAYERED_ROUTE_LAB_URL is required for production builds. Copy .env.production.example and set the public Demo URL.',
    )
  }

  let parsedDemoUrl: URL
  try {
    parsedDemoUrl = new URL(demoUrl)
  } catch {
    throw new Error('VITE_LAYERED_ROUTE_LAB_URL must be an absolute URL.')
  }

  if (!['http:', 'https:'].includes(parsedDemoUrl.protocol)) {
    throw new Error('VITE_LAYERED_ROUTE_LAB_URL must use http:// or https://.')
  }

  if (isLocalDemoHostname(parsedDemoUrl.hostname) && !options.allowLocal) {
    throw new Error(
      'Production builds cannot point at localhost. Set the public Demo URL, or set ALLOW_LOCAL_DEMO_URL=1 for local verification.',
    )
  }

  return parsedDemoUrl
}
