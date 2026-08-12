import { useEffect, useLayoutEffect } from 'react'
import { AppShell } from '../components/layout/AppShell'
import {
  baijiahaoEditorProject,
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
import {
  getSavedScrollPosition,
  replace,
  ROUTES,
  scrollToRouteAnchor,
  useCurrentRoute,
} from './router'
import { useDocumentMeta } from './useDocumentMeta'

function RoutePage({ route }: { route: ReturnType<typeof useCurrentRoute> }) {
  switch (route.id) {
    case ROUTES.HOME.id:
      return <HomePage />
    case ROUTES.MEICAN_PLATFORM.id:
      return <CaseStudyPage project={meicanPlatformProject} pathname={route.pathname} />
    case ROUTES.BAIJIAHAO_EDITOR.id:
      return <CaseStudyPage project={baijiahaoEditorProject} pathname={route.pathname} />
    case ROUTES.LAYERED_AGENT.id:
      return <CaseStudyPage project={layeredAgentProject} pathname={route.pathname} />
    case ROUTES.ELPIS.id:
      return <CaseStudyPage project={elpisProject} pathname={route.pathname} />
    case ROUTES.EXPERIENCE.id:
      return <ExperiencePage />
    case ROUTES.ARCHIVE.id:
      return <ArchivePage />
    case ROUTES.ARCHIVE_COCO_WALLET.id:
      return <CaseStudyPage project={cocoWalletProject} pathname={route.pathname} />
    case ROUTES.RESUME.id:
      return <ResumePage />
    case ROUTES.ARCHIVE_POKE_PROTOTYPE_EDITOR.id:
      return (
        <CaseStudyPage
          project={portfolioProjectBySlug.get('poke-prototype-editor')!}
          pathname={route.pathname}
        />
      )
    case ROUTES.ARCHIVE_DATAVIEW_OBSERVATORY.id:
      return (
        <CaseStudyPage
          project={portfolioProjectBySlug.get('dataview-observatory')!}
          pathname={route.pathname}
        />
      )
    case ROUTES.ARCHIVE_TURNTABLE_MOTION_LAB.id:
      return (
        <CaseStudyPage
          project={portfolioProjectBySlug.get('turntable-motion-lab')!}
          pathname={route.pathname}
        />
      )
    case ROUTES.ARCHIVE_BEZIER_EASING_PICKER.id:
      return (
        <CaseStudyPage
          project={portfolioProjectBySlug.get('bezier-easing-picker')!}
          pathname={route.pathname}
        />
      )
    default:
      return <NotFoundPage pathname={route.pathname} />
  }
}

export function App() {
  const route = useCurrentRoute()
  useDocumentMeta(route)

  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    if (route.needsCanonicalReplace) replace(route.canonicalHref)
  }, [route.canonicalHref, route.needsCanonicalReplace])

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

  return (
    <AppShell route={route}>
      <RoutePage route={route} />
    </AppShell>
  )
}
