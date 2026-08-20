import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent,
  type RefObject,
} from 'react'
import { getLocalizedProfile } from '../../data/localized'
import type { ResolvedRoute } from '../../app/router'
import { AppLink } from '../common/AppLink'
import { LanguageToggle } from '../common/LanguageToggle'
import { ThemeToggle } from '../common/ThemeToggle'
import { useLanguage } from '../../i18n/LanguageContext'

const selectedWork = [
  { to: '/work/meican-platform', index: '01', labelIndex: 0 },
  { to: '/work/baidu-map-workbench', index: '02', labelIndex: 1 },
  { to: '/work/baijiahao-editor', index: '03', labelIndex: 2 },
  { to: '/work/layered-agent', index: '04', labelIndex: 3 },
] as const

function isCurrent(pathname: string, to: string) {
  if (to === '/archive') return pathname.startsWith('/archive')
  return pathname === to
}

export function PortfolioNavigationContent({
  route,
  activePath,
  firstLinkRef,
  onNavigate,
}: {
  route: ResolvedRoute
  activePath?: string
  firstLinkRef?: RefObject<HTMLAnchorElement | null>
  onNavigate: () => void
}) {
  const { copy, language } = useLanguage()
  const localizedProfile = getLocalizedProfile(language)
  const currentPath = activePath || route.pathname

  return (
    <>
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
          aria-current={isCurrent(currentPath, '/') ? 'page' : undefined}
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
              aria-current={isCurrent(currentPath, item.to) ? 'page' : undefined}
              className="nav-case"
            >
              <small>{item.index}</small>
              <span>{copy.navigation.selectedCases[item.labelIndex]}</span>
            </AppLink>
          ))}
        </div>

        <AppLink
          to="/experience"
          onClick={onNavigate}
          aria-current={isCurrent(currentPath, '/experience') ? 'page' : undefined}
          className="nav-primary"
        >
          {copy.navigation.experience}
        </AppLink>
        <AppLink
          to="/archive"
          onClick={onNavigate}
          aria-current={isCurrent(currentPath, '/archive') ? 'page' : undefined}
          className="nav-primary"
        >
          {copy.navigation.projects}
        </AppLink>
        <AppLink
          to="/resume"
          onClick={onNavigate}
          aria-current={isCurrent(currentPath, '/resume') ? 'page' : undefined}
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
    </>
  )
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
  return (
    <aside
      id="site-navigation"
      className={`site-sidebar ${open ? 'is-open' : ''}`}
      aria-hidden={isMobile && !open ? true : undefined}
      inert={isMobile && !open ? true : undefined}
    >
      <PortfolioNavigationContent
        route={route}
        firstLinkRef={firstLinkRef}
        onNavigate={onNavigate}
      />
    </aside>
  )
}

interface GuidePosition {
  x: number
  y: number
}

function clampGuidePosition(position: GuidePosition, element: HTMLElement): GuidePosition {
  const margin = 16
  const maxX = Math.max(margin, window.innerWidth - element.offsetWidth - margin)
  const maxY = Math.max(margin, window.innerHeight - element.offsetHeight - margin)
  return {
    x: Math.min(Math.max(margin, position.x), maxX),
    y: Math.min(Math.max(margin, position.y), maxY),
  }
}

export function DemoNavigationDrawer({
  route,
  activePath,
  open,
  firstLinkRef,
  onClose,
}: {
  route: ResolvedRoute
  activePath: string
  open: boolean
  firstLinkRef: RefObject<HTMLAnchorElement | null>
  onClose: () => void
}) {
  const { copy } = useLanguage()

  return (
    <>
      <button
        type="button"
        className={`demo-drawer-backdrop ${open ? 'is-visible' : ''}`}
        aria-label={copy.demo.player.closeMenu}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        id="demo-navigation"
        className={`demo-navigation-drawer ${open ? 'is-open' : ''}`}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <PortfolioNavigationContent
          route={route}
          activePath={activePath}
          firstLinkRef={firstLinkRef}
          onNavigate={onClose}
        />
      </aside>
    </>
  )
}

interface GuideDrag {
  handle: HTMLElement
  pointerId: number
  offsetX: number
  offsetY: number
}

const defaultGuidePosition: GuidePosition = { x: 24, y: 78 }

function releaseGuidePointer(dragRef: MutableRefObject<GuideDrag | null>) {
  const drag = dragRef.current
  if (!drag) return
  dragRef.current = null
  if (!drag.handle.hasPointerCapture(drag.pointerId)) return
  try {
    drag.handle.releasePointerCapture(drag.pointerId)
  } catch {
    // The browser may release capture before a cancellation or unmount cleanup runs.
  }
}

export function useDesktopGuidePosition(active: boolean, experienceId: string) {
  const guideRef = useRef<HTMLElement>(null)
  const [position, setPosition] = useState<GuidePosition>(defaultGuidePosition)
  const dragRef = useRef<GuideDrag | null>(null)

  useEffect(() => {
    releaseGuidePointer(dragRef)
    setPosition(defaultGuidePosition)
  }, [experienceId])

  useEffect(() => {
    if (!active) {
      releaseGuidePointer(dragRef)
      setPosition(defaultGuidePosition)
      return
    }

    const clampToViewport = () => {
      const element = guideRef.current
      if (!element) return
      setPosition((current) => clampGuidePosition(current, element))
    }

    const element = guideRef.current
    if (!element) return
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(clampToViewport) : null
    observer?.observe(element)
    window.addEventListener('resize', clampToViewport)
    return () => {
      releaseGuidePointer(dragRef)
      observer?.disconnect()
      window.removeEventListener('resize', clampToViewport)
    }
  }, [active, experienceId])

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (
      !active ||
      event.button !== 0 ||
      !event.isPrimary ||
      event.pointerType === 'touch' ||
      window.matchMedia('(max-width: 760px)').matches
    ) {
      return
    }

    const guide = guideRef.current
    if (!guide) return

    const handle = event.currentTarget
    if (!handle.isConnected) return
    releaseGuidePointer(dragRef)
    const rect = guide.getBoundingClientRect()
    dragRef.current = {
      handle,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    }
    try {
      handle.setPointerCapture(event.pointerId)
    } catch {
      dragRef.current = null
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    const element = guideRef.current
    if (
      !active ||
      !drag ||
      drag.handle !== event.currentTarget ||
      drag.pointerId !== event.pointerId ||
      !element ||
      !event.isPrimary
    ) {
      return
    }
    setPosition(
      clampGuidePosition(
        { x: event.clientX - drag.offsetX, y: event.clientY - drag.offsetY },
        element,
      ),
    )
  }

  const releasePointer = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.handle !== event.currentTarget || drag.pointerId !== event.pointerId) return
    releaseGuidePointer(dragRef)
  }

  return {
    guideRef,
    position,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: releasePointer,
      onPointerCancel: releasePointer,
      onLostPointerCapture: releasePointer,
    },
  }
}
