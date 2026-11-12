export function createLayeredRouteLabUrl(
  baseUrl: string,
  routePath: string,
  params: Record<string, string> = {},
) {
  const url = new URL(`${baseUrl.replace(/\/+$/, '')}/`)
  const basePath = url.pathname.replace(/\/+$/, '')
  const searchParams = new URLSearchParams(params)

  url.hash = ''
  url.search = ''

  if (basePath) {
    url.pathname = `${basePath}/`
    const readableRoutePath = encodeURIComponent(routePath).replace(/%2F/gi, '/')
    const search = searchParams.toString()
    url.search = `?route=${readableRoutePath}${search ? `&${search}` : ''}`
  } else {
    url.pathname = routePath
    const search = searchParams.toString()
    url.search = search ? `?${search}` : ''
  }

  return url.toString()
}
