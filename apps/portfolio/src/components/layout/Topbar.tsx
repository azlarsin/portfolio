import { Menu } from 'lucide-react'
import type { RefObject } from 'react'
import type { ResolvedRoute } from '../../app/router'
import { AppLink } from '../common/AppLink'
import { LanguageToggle } from '../common/LanguageToggle'
import { ThemeToggle } from '../common/ThemeToggle'
import { useLanguage } from '../../i18n/LanguageContext'
import { CompanionStyleSwitch } from '../companion/CompanionPreference'

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
  const { copy } = useLanguage()
  const links = [
    {
      to: '/#selected-work',
      label: copy.navigation.selectedWork,
      active: route.pathname === '/' || route.pathname.startsWith('/work/'),
    },
    {
      to: '/archive',
      label: copy.navigation.projects,
      active: route.pathname.startsWith('/archive'),
    },
    {
      to: '/experience',
      label: copy.navigation.experience,
      active: route.pathname === '/experience',
    },
    {
      to: '/resume',
      label: copy.navigation.resume,
      active: route.pathname === '/resume',
    },
  ]

  return (
    <header className="site-topbar">
      <div className="topbar-inner" data-companion-home={route.pathname === '/'}>
        <AppLink to="/" className="site-wordmark" aria-label={copy.shell.home}>
          azlar<span aria-hidden="true">.</span>
        </AppLink>
        <span className="companion-dock-slot" data-companion-slot="dock" aria-hidden="true" />
        {route.pathname === '/' ? <CompanionStyleSwitch compact /> : null}
        <nav className="topbar-navigation" aria-label={copy.navigation.label}>
          {links.map(({ to, label, active }) => (
            <AppLink
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
            >
              {label}
            </AppLink>
          ))}
        </nav>
        <div className="topbar-preferences">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          className="icon-button menu-trigger"
          aria-label={copy.shell.openNavigation}
          title={copy.shell.openNavigation}
          aria-controls="site-navigation"
          aria-expanded={expanded}
          onClick={onOpen}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
