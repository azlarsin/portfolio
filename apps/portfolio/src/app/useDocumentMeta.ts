import { useEffect } from 'react'
import type { ResolvedRoute, RouteDefinition, RouteMeta } from './router'

export type DocumentMetaSource = RouteMeta | ResolvedRoute | RouteDefinition

function readMeta(source: DocumentMetaSource): RouteMeta {
  return 'meta' in source ? source.meta : source
}

/** Apply route metadata outside React when bootstrapping or testing. */
export function setDocumentMeta(source: DocumentMetaSource) {
  if (typeof document === 'undefined') {
    return
  }

  const meta = readMeta(source)
  document.title = meta.title

  let description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (!description) {
    description = document.createElement('meta')
    description.name = 'description'
    document.head.append(description)
  }

  description.content = meta.description
}

export function useDocumentMeta(source: DocumentMetaSource) {
  const meta = readMeta(source)

  useEffect(() => {
    setDocumentMeta(meta)
  }, [meta.description, meta.title])
}
