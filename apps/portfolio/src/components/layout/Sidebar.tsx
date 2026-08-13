import type { RefObject } from 'react'
import type { ResolvedRoute } from '../../app/router'
import { getLocalizedProfile } from '../../data/localized'
import { AppLink } from '../common/AppLink'
import { LanguageToggle } from '../common/LanguageToggle'
import { ThemeToggle } from '../common/ThemeToggle'
import { useLanguage } from '../../i18n/LanguageContext'

function isCurrent(route: ResolvedRoute, to: string) {
  if (to === '/archive') return route.pathname.startsWith('/archive')
  return route.pathname === to
}

export function Sidebar({
  route,
  open,
  isMobile,
  firstLinkRef,
  onNavigate,
}: {
  route: ResolvedRoute
  open: boolean
  isMobile: boolean
  firstLinkRef: RefObject<HTMLAnchorElement | null>
  onNavigate: () => void
}) {
  const { copy, language } = useLanguage()
  const localizedProfile = getLocalizedProfile(language)
  const selectedWork = [
    { to: '/work/meican-platform', index: '01', label: copy.navigation.selectedCases[0] },
    { to: '/work/baijiahao-editor', index: '02', label: copy.navigation.selectedCases[1] },
    { to: '/work/layered-agent', index: '03', label: copy.navigation.selectedCases[2] },
  ]

  return (
    <aside
      id="site-navigation"
      className={`site-sidebar ${open ? 'is-open' : ''}`}
      aria-hidden={isMobile && !open ? true : undefined}
      inert={isMobile && !open ? true : undefined}
    >
      <div className="sidebar-identity">
        <AppLink to="/" onClick={onNavigate} ref={firstLinkRef}>
          <strong>{localizedProfile.name}</strong>
          <span>{copy.navigation.role}</span>
          <small>{copy.navigation.tagline}</small>
        </AppLink>
      </div>

      <nav className="site-nav" aria-label={copy.navigation.label}>
        <AppLink
          to="/"
          onClick={onNavigate}
          aria-current={isCurrent(route, '/') ? 'page' : undefined}
          className="nav-primary"
        >
          {copy.navigation.overview}
        </AppLink>

        <div className="nav-cluster">
          <span>{copy.navigation.selectedWork}</span>
          {selectedWork.map((item) => (
            <AppLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-current={isCurrent(route, item.to) ? 'page' : undefined}
              className="nav-case"
            >
              <small>{item.index}</small>
              <span>{item.label}</span>
            </AppLink>
          ))}
        </div>

        <AppLink
          to="/experience"
          onClick={onNavigate}
          aria-current={isCurrent(route, '/experience') ? 'page' : undefined}
          className="nav-primary"
        >
          {copy.navigation.experience}
        </AppLink>
        <AppLink
          to="/archive"
          onClick={onNavigate}
          aria-current={isCurrent(route, '/archive') ? 'page' : undefined}
          className="nav-primary"
        >
          {copy.navigation.projects}
        </AppLink>
        <AppLink
          to="/resume"
          onClick={onNavigate}
          aria-current={isCurrent(route, '/resume') ? 'page' : undefined}
          className="nav-primary"
        >
          {copy.navigation.resume}
        </AppLink>
      </nav>

      <footer className="sidebar-footer">
        <p>
          <span aria-hidden="true" />
          {copy.navigation.availability}
        </p>
        <div className="sidebar-preferences">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </footer>
    </aside>
  )
}
