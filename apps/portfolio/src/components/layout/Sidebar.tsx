import type { RefObject } from 'react'
import type { ResolvedRoute } from '../../app/router'
import { profile } from '../../data/profile'
import { AppLink } from '../common/AppLink'
import { ThemeToggle } from '../common/ThemeToggle'

const selectedWork = [
  { to: '/work/meican-platform', index: '01', label: '企业后台架构改造' },
  { to: '/work/baijiahao-editor', index: '02', label: '百家号编辑器演进' },
  { to: '/work/layered-agent', index: '03', label: 'Layered Route × Agent' },
]

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
  return (
    <aside
      id="site-navigation"
      className={`site-sidebar ${open ? 'is-open' : ''}`}
      aria-hidden={isMobile && !open ? true : undefined}
      inert={isMobile && !open ? true : undefined}
    >
      <div className="sidebar-identity">
        <AppLink to="/" onClick={onNavigate} ref={firstLinkRef}>
          <strong>{profile.name}</strong>
          <span>前端技术负责人 · 全栈</span>
          <small>复杂系统架构与交付</small>
        </AppLink>
      </div>

      <nav className="site-nav" aria-label="主导航">
        <AppLink
          to="/"
          onClick={onNavigate}
          aria-current={isCurrent(route, '/') ? 'page' : undefined}
          className="nav-primary"
        >
          Overview
        </AppLink>

        <div className="nav-cluster">
          <span>Selected Work</span>
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
          Experience
        </AppLink>
        <AppLink
          to="/archive"
          onClick={onNavigate}
          aria-current={isCurrent(route, '/archive') ? 'page' : undefined}
          className="nav-primary"
        >
          Personal Projects
        </AppLink>
        <AppLink
          to="/resume"
          onClick={onNavigate}
          aria-current={isCurrent(route, '/resume') ? 'page' : undefined}
          className="nav-primary"
        >
          Resume
        </AppLink>
      </nav>

      <footer className="sidebar-footer">
        <p>
          <span aria-hidden="true" />
          开放工作机会与项目交流
        </p>
        <ThemeToggle />
      </footer>
    </aside>
  )
}
