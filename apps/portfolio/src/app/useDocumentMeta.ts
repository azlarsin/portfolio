import { useEffect } from 'react'
import type { ResolvedRoute, RouteDefinition, RouteMeta } from './router'
import type { PortfolioSeo } from './seo'

export type DocumentMetaSource = RouteMeta | ResolvedRoute | RouteDefinition | PortfolioSeo

function readMeta(source: DocumentMetaSource): RouteMeta {
  return 'meta' in source ? source.meta : source
}

function isPortfolioSeo(source: DocumentMetaSource): source is PortfolioSeo {
  return 'canonicalUrl' in source
}

function setMetaContent(selector: string, attributes: Record<string, string>, content: string) {
  let element = document.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    for (const [name, value] of Object.entries(attributes)) {
      element.setAttribute(name, value)
    }
    document.head.append(element)
  }
  element.content = content
}

function setCanonical(href: string) {
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.append(canonical)
  }
  canonical.href = href
}

function removeMetaContent(selector: string) {
  document.querySelector(selector)?.remove()
}

/** Apply route metadata outside React when bootstrapping or testing. */
export function setDocumentMeta(source: DocumentMetaSource) {
  if (typeof document === 'undefined') {
    return
  }

  const meta = readMeta(source)
  document.title = meta.title
  setMetaContent('meta[name="description"]', { name: 'description' }, meta.description)

  if (!isPortfolioSeo(source)) return

  setMetaContent('meta[name="robots"]', { name: 'robots' }, source.robots)
  setMetaContent('meta[property="og:type"]', { property: 'og:type' }, source.openGraphType)
  setMetaContent('meta[property="og:site_name"]', { property: 'og:site_name' }, source.siteName)
  setMetaContent('meta[property="og:title"]', { property: 'og:title' }, source.title)
  setMetaContent(
    'meta[property="og:description"]',
    { property: 'og:description' },
    source.description,
  )
  setMetaContent('meta[property="og:url"]', { property: 'og:url' }, source.canonicalUrl)
  setMetaContent('meta[property="og:locale"]', { property: 'og:locale' }, source.locale)
  setMetaContent('meta[name="twitter:card"]', { name: 'twitter:card' }, source.twitterCard)
  setMetaContent('meta[name="twitter:title"]', { name: 'twitter:title' }, source.title)
  setMetaContent(
    'meta[name="twitter:description"]',
    { name: 'twitter:description' },
    source.description,
  )
  if (source.imageUrl && source.imageAlt) {
    setMetaContent('meta[property="og:image"]', { property: 'og:image' }, source.imageUrl)
    setMetaContent('meta[property="og:image:type"]', { property: 'og:image:type' }, 'image/png')
    setMetaContent('meta[property="og:image:width"]', { property: 'og:image:width' }, '1200')
    setMetaContent('meta[property="og:image:height"]', { property: 'og:image:height' }, '630')
    setMetaContent('meta[property="og:image:alt"]', { property: 'og:image:alt' }, source.imageAlt)
    setMetaContent('meta[name="twitter:image"]', { name: 'twitter:image' }, source.imageUrl)
    setMetaContent('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, source.imageAlt)
  } else {
    for (const selector of [
      'meta[property="og:image"]',
      'meta[property="og:image:type"]',
      'meta[property="og:image:width"]',
      'meta[property="og:image:height"]',
      'meta[property="og:image:alt"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:image:alt"]',
    ]) {
      removeMetaContent(selector)
    }
  }
  setCanonical(source.canonicalUrl)

  let jsonLd = document.querySelector<HTMLScriptElement>('#portfolio-json-ld')
  if (!jsonLd) {
    jsonLd = document.createElement('script')
    jsonLd.id = 'portfolio-json-ld'
    jsonLd.type = 'application/ld+json'
    document.head.append(jsonLd)
  }
  jsonLd.textContent = JSON.stringify(source.jsonLd).replace(/</g, '\\u003c')
}

export function useDocumentMeta(source: DocumentMetaSource) {
  useEffect(() => {
    setDocumentMeta(source)
  }, [source])
}
