import type { RefObject } from 'react'
import type { ResolvedRoute } from '../../app/router'
import { AppLink } from '../common/AppLink'

const routeLabels: Record<string, string> = {
  home: 'Overview',
  'meican-platform': 'Selected Work · 01',
  'layered-agent': 'Selected Work · 02',
  elpis: 'Personal Projects · Elpis',
  experience: 'Experience',
  archive: 'Personal Projects',
  'archive-poke-prototype-editor': 'Personal Projects · Poke',
  'archive-dataview-observatory': 'Personal Projects · DataView',
  'archive-turntable-motion-lab': 'Personal Projects · Turntable',
  'archive-bezier-easing-picker': 'Personal Projects · Bezier',
  resume: 'Resume',
  'not-found': 'Not Found',
}

export function Topbar({
  route,
  menuButtonRef,
  expanded,
  onOpen,
}: {
  route: ResolvedRoute
  menuButtonRef: RefObject<HTMLButtonElement | null>
  expanded: boolean
  onOpen: () => void
}) {
  return (
    <header className="mobile-topbar" inert={expanded ? true : undefined}>
      <AppLink to="/" className="mobile-wordmark" aria-label="返回首页">
        陈成
      </AppLink>
      <span>{routeLabels[route.id] || 'Portfolio'}</span>
      <button
        ref={menuButtonRef}
        type="button"
        className="menu-trigger"
        aria-label="打开导航"
        aria-controls="site-navigation"
        aria-expanded={expanded}
        onClick={onOpen}
      >
        <span />
        <span />
      </button>
    </header>
  )
}
