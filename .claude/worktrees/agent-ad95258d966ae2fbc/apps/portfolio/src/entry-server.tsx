import { renderToStaticMarkup } from 'react-dom/server'
import { RoutePage } from './app/App'
import { resolveRoute, routeDefinitions } from './app/router'
import {
  getPortfolioSeo,
  isIndexableRoute,
  type PortfolioSeo,
} from './app/seo'
import { AppShell } from './components/layout/AppShell'
import { LanguageProvider } from './i18n/LanguageContext'

export interface RenderedPortfolioRoute {
  body: string
  seo: PortfolioSeo
}

export function renderPortfolioRoute(path: string): RenderedPortfolioRoute {
  const route = resolveRoute(path)
  const content = <RoutePage route={route} />
  const body = renderToStaticMarkup(
    <LanguageProvider>
      {route.id === 'baby' || route.id === 'demo' || route.id === 'poke-render' ? (
        content
      ) : (
        <AppShell route={route}>{content}</AppShell>
      )}
    </LanguageProvider>,
  )

  return {
    body,
    seo: getPortfolioSeo(route, 'zh'),
  }
}

export const staticPortfolioRoutes = routeDefinitions.map((route) => ({
  id: route.id,
  path: route.path,
  indexable: isIndexableRoute(route),
}))
