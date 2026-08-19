import type { RefObject } from 'react'
import type { ResolvedRoute } from '../../app/router'
import { AppLink } from '../common/AppLink'
import { useLanguage } from '../../i18n/LanguageContext'
import { getLocalizedProfile } from '../../data/localized'

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
  const { copy, language } = useLanguage()
  const profile = getLocalizedProfile(language)
  const routeLabels: Record<string, string> = {
    home: copy.navigation.overview,
    'meican-platform': `${copy.navigation.selectedWork} · 01`,
    'baidu-map-workbench': `${copy.navigation.selectedWork} · 02`,
    'baijiahao-editor': `${copy.navigation.selectedWork} · 03`,
    'layered-agent': `${copy.navigation.selectedWork} · 04`,
    elpis: `${copy.navigation.projects} · Elpis`,
    experience: copy.navigation.experience,
    archive: copy.navigation.projects,
    'archive-coco-wallet': `${copy.navigation.projects} · Coco Wallet`,
    'archive-poke-prototype-editor': `${copy.navigation.projects} · Poke`,
    'archive-dataview-observatory': `${copy.navigation.projects} · DataView`,
    'archive-turntable-motion-lab': `${copy.navigation.projects} · Turntable`,
    'archive-bezier-easing-picker': `${copy.navigation.projects} · Bezier`,
    'archive-merchant-commerce': `${copy.navigation.projects} · ${language === 'en' ? 'Independent Commerce' : '独立移动电商'}`,
    'archive-irregular-shape-layout': `${copy.navigation.projects} · ${language === 'en' ? 'Irregular Shapes' : '不规则布局'}`,
    resume: copy.navigation.resume,
    'not-found': 'Not Found',
  }

  return (
    <header className="mobile-topbar" inert={expanded ? true : undefined}>
      <button
        ref={menuButtonRef}
        type="button"
        className="menu-trigger"
        aria-label={copy.shell.openNavigation}
        aria-controls="site-navigation"
        aria-expanded={expanded}
        onClick={onOpen}
      >
        <span />
        <span />
      </button>
      <span>{routeLabels[route.id] || 'Portfolio'}</span>
      <AppLink to="/" className="mobile-wordmark" aria-label={copy.shell.home}>
        {profile.name}
      </AppLink>
    </header>
  )
}
