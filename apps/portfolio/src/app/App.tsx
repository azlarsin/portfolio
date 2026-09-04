import { useEffect, useLayoutEffect } from 'react'
import { AppShell } from '../components/layout/AppShell'
import {
  baijiahaoEditorProject,
  baiduMapWorkbenchProject,
  cocoWalletProject,
  elpisProject,
  layeredAgentProject,
  meicanPlatformProject,
  portfolioProjectBySlug,
} from '../data'
import { ArchivePage } from '../pages/ArchivePage'
import { CaseStudyPage } from '../pages/CaseStudyPage'
import { ExperiencePage } from '../pages/ExperiencePage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ResumePage } from '../pages/ResumePage'
import { DemoPlayerPage } from '../pages/DemoPlayerPage'
import { PokeRenderPage } from '../pages/PokeRenderPage'
import {
  getSavedScrollPosition,
  replace,
  ROUTES,
  scrollToRouteAnchor,
  useCurrentRoute,
} from './router'
import { useDocumentMeta } from './useDocumentMeta'
import { useLanguage } from '../i18n/LanguageContext'
import { getLocalizedRouteMeta } from '../i18n/routeMeta'
import { getLocalizedProject } from '../data/localized'
import { trackGoogleAnalyticsPageView } from './analytics'

function RoutePage({ route }: { route: ReturnType<typeof useCurrentRoute> }) {
  const { language } = useLanguage()
  const localized = (project: Parameters<typeof getLocalizedProject>[0]) =>
    getLocalizedProject(project, language)

  switch (route.id) {
    case ROUTES.POKE_RENDER.id:
      return <PokeRenderPage route={route} />
    case ROUTES.DEMO.id:
      return <DemoPlayerPage route={route} />
    case ROUTES.HOME.id:
      return <HomePage />
    case ROUTES.MEICAN_PLATFORM.id:
      return <CaseStudyPage project={localized(meicanPlatformProject)} pathname={route.pathname} />
    case ROUTES.BAIDU_MAP_WORKBENCH.id:
      return <CaseStudyPage project={localized(baiduMapWorkbenchProject)} pathname={route.pathname} />
    case ROUTES.BAIJIAHAO_EDITOR.id:
      return <CaseStudyPage project={localized(baijiahaoEditorProject)} pathname={route.pathname} />
    case ROUTES.LAYERED_AGENT.id:
      return <CaseStudyPage project={localized(layeredAgentProject)} pathname={route.pathname} />
    case ROUTES.ELPIS.id:
      return <CaseStudyPage project={localized(elpisProject)} pathname={route.pathname} />
    case ROUTES.EXPERIENCE.id:
      return <ExperiencePage />
    case ROUTES.ARCHIVE.id:
      return <ArchivePage />
    case ROUTES.ARCHIVE_COCO_WALLET.id:
      return <CaseStudyPage project={localized(cocoWalletProject)} pathname={route.pathname} />
    case ROUTES.RESUME.id:
      return <ResumePage route={route} />
    case ROUTES.ARCHIVE_POKE_PROTOTYPE_EDITOR.id:
      return (
        <CaseStudyPage
          project={localized(portfolioProjectBySlug.get('poke-prototype-editor')!)}
          pathname={route.pathname}
        />
      )
    case ROUTES.ARCHIVE_DATAVIEW_OBSERVATORY.id:
      return (
        <CaseStudyPage
          project={localized(portfolioProjectBySlug.get('dataview-observatory')!)}
          pathname={route.pathname}
        />
      )
    case ROUTES.ARCHIVE_TURNTABLE_MOTION_LAB.id:
      return (
        <CaseStudyPage
          project={localized(portfolioProjectBySlug.get('turntable-motion-lab')!)}
          pathname={route.pathname}
        />
      )
    case ROUTES.ARCHIVE_BEZIER_EASING_PICKER.id:
      return (
        <CaseStudyPage
          project={localized(portfolioProjectBySlug.get('bezier-easing-picker')!)}
          pathname={route.pathname}
        />
      )
    case ROUTES.ARCHIVE_MERCHANT_COMMERCE.id:
      return (
        <CaseStudyPage
          project={localized(portfolioProjectBySlug.get('merchant-commerce')!)}
          pathname={route.pathname}
        />
      )
    case ROUTES.ARCHIVE_IRREGULAR_SHAPE_LAYOUT.id:
      return (
        <CaseStudyPage
          project={localized(portfolioProjectBySlug.get('irregular-shape-layout')!)}
          pathname={route.pathname}
        />
      )
    default:
      return <NotFoundPage pathname={route.pathname} />
  }
}

export function App() {
  const route = useCurrentRoute()
  const { language } = useLanguage()
  useDocumentMeta(getLocalizedRouteMeta(route, language))

  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    if (route.needsCanonicalReplace) replace(route.canonicalHref)
  }, [route.canonicalHref, route.needsCanonicalReplace])

  useEffect(() => {
    if (route.needsCanonicalReplace) return

    trackGoogleAnalyticsPageView({
      pageLocation: `${window.location.origin}${route.pathname}${route.search}`,
      pageTitle: document.title,
    })
  }, [route.needsCanonicalReplace, route.pathname, route.search])

  useLayoutEffect(() => {
    let nestedFrame = 0
    const frame = window.requestAnimationFrame(() => {
      nestedFrame = window.requestAnimationFrame(() => {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const foundAnchor = route.anchor
          ? scrollToRouteAnchor(route, {
              block: 'start',
              behavior: reducedMotion ? 'auto' : 'smooth',
            })
          : false

        if (!foundAnchor) {
          window.scrollTo({ top: getSavedScrollPosition(), left: 0, behavior: 'auto' })
          const heading = document.querySelector<HTMLElement>('main h1')
          if (heading) {
            heading.tabIndex = -1
            heading.focus({ preventScroll: true })
          }
        }
      })
    })

    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(nestedFrame)
    }
  }, [route.href])

  if (route.id === ROUTES.DEMO.id || route.id === ROUTES.POKE_RENDER.id) {
    return <RoutePage route={route} />
  }

  return (
    <AppShell route={route}>
      <RoutePage route={route} />
    </AppShell>
  )
}
