import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { ResolvedRoute } from '../../app/router'
import { useMediaQuery } from '../common/useMediaQuery'
import { useLanguage } from '../../i18n/LanguageContext'
import { Sidebar } from './Sidebar'
import { SiteFooter } from './SiteFooter'
import { Topbar } from './Topbar'

export function AppShell({ route, children }: { route: ResolvedRoute; children: ReactNode }) {
  const { copy } = useLanguage()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 900px)')
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    setDrawerOpen(false)
  }, [route.href])

  useEffect(() => {
    if (!drawerOpen) {
      if (wasOpenRef.current) menuButtonRef.current?.focus()
      wasOpenRef.current = false
      return
    }

    wasOpenRef.current = true
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => firstLinkRef.current?.focus())
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [drawerOpen])

  return (
    <div className="app-shell">
      <Topbar
        route={route}
        menuButtonRef={menuButtonRef}
        expanded={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
      />
      <button
        type="button"
        className={`drawer-backdrop ${drawerOpen ? 'is-visible' : ''}`}
        aria-label={copy.shell.closeNavigation}
        tabIndex={drawerOpen ? 0 : -1}
        onClick={() => setDrawerOpen(false)}
      />
      <Sidebar
        route={route}
        open={drawerOpen}
        isMobile={isMobile}
        firstLinkRef={firstLinkRef}
        onNavigate={() => setDrawerOpen(false)}
      />
      <div className="site-main" inert={drawerOpen ? true : undefined}>
        {children}
        <SiteFooter />
      </div>
    </div>
  )
}
