import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { ResolvedRoute } from '../../app/router'
import { useMediaQuery } from '../common/useMediaQuery'
import { useLanguage } from '../../i18n/LanguageContext'
import { PortfolioNavigationContent } from './Sidebar'
import { SiteFooter } from './SiteFooter'
import { Topbar } from './Topbar'
import { RouteCompanion } from '../companion/RouteCompanion'
import { CompanionProvider } from '../companion/CompanionPreference'
import { PUBLIC_COMPANION_ENABLED } from '../companion/companionConfig'

export function AppShell({
  route,
  children,
}: {
  route: ResolvedRoute
  children: ReactNode
}) {
  const { copy } = useLanguage()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 900px)')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setDrawerOpen(false), [route.href, isMobile])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!drawerOpen) {
      dialog.close()
      return
    }

    dialog.showModal()
    firstLinkRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [drawerOpen])

  const Provider = PUBLIC_COMPANION_ENABLED ? CompanionProvider : Fragment

  return (
    <Provider>
      <div className={`app-shell${PUBLIC_COMPANION_ENABLED ? ' public-companion-enabled' : ''}`}>
        <a className="skip-link" href="#main-content">
          {copy.shell.skipToContent}
        </a>
        <Topbar
          route={route}
          menuButtonRef={menuButtonRef}
          expanded={drawerOpen}
          onOpen={() => setDrawerOpen(true)}
        />
        {PUBLIC_COMPANION_ENABLED && <RouteCompanion route={route} />}
        <dialog
          ref={dialogRef}
          id="site-navigation"
          className="site-navigation-dialog"
          aria-label={copy.navigation.label}
          onCancel={() => setDrawerOpen(false)}
          onClose={() => setDrawerOpen(false)}
          onKeyDown={(event) => {
            if (event.key !== 'Tab') return
            const controls = [
              ...event.currentTarget.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled])',
              ),
            ].filter((element) => element.getClientRects().length > 0)
            const first = controls[0]
            const last = controls.at(-1)
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault()
              last?.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault()
              first?.focus()
            }
          }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return
            const rect = event.currentTarget.getBoundingClientRect()
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            ) {
              setDrawerOpen(false)
            }
          }}
        >
          <button
            className="icon-button drawer-close"
            type="button"
            aria-label={copy.shell.closeNavigation}
            title={copy.shell.closeNavigation}
            onClick={() => setDrawerOpen(false)}
          >
            <X size={20} aria-hidden="true" />
          </button>
          <PortfolioNavigationContent
            route={route}
            firstLinkRef={firstLinkRef}
            onNavigate={() => setDrawerOpen(false)}
          />
        </dialog>
        <div className="site-main" id="main-content" tabIndex={-1}>
          {children}
          <SiteFooter />
        </div>
      </div>
    </Provider>
  )
}
