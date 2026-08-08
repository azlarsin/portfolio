import { useEffect, useMemo, useRef, useState } from 'react'
import {
  portfolioItems,
  projectGroups,
  sections,
  type PortfolioItem,
} from './content'

function getItemFromHash() {
  const id = window.location.hash.replace(/^#\/?/, '')
  return portfolioItems.find((item) => item.id === id) ?? portfolioItems[0]
}

const mobileMediaQuery = '(max-width: 820px)'

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)

    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}

export function App() {
  const [activeItem, setActiveItem] = useState<PortfolioItem>(getItemFromHash)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [frameKey, setFrameKey] = useState(0)
  const contentStageRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery(mobileMediaQuery)

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', `#/${portfolioItems[0].id}`)
    }

    const onHashChange = () => {
      setActiveItem(getItemFromHash())
      setSidebarOpen(false)
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (contentStageRef.current) {
      contentStageRef.current.scrollTop = 0
    }
  }, [activeItem.id])

  useEffect(() => {
    if (!sidebarOpen) {
      return
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [sidebarOpen])

  const groupedItems = useMemo(
    () =>
      sections.map((section) => ({
        section,
        items: portfolioItems.filter((item) => item.section === section),
      })),
    [],
  )

  const navigate = (item: PortfolioItem) => {
    if (item.id === activeItem.id) {
      if (contentStageRef.current) {
        contentStageRef.current.scrollTop = 0
      }
      setSidebarOpen(false)
      return
    }

    window.location.hash = `/${item.id}`
  }

  return (
    <div className="portfolio-shell">
      <button
        className={`sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`}
        aria-label="关闭目录"
        tabIndex={sidebarOpen ? 0 : -1}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}
        id="portfolio-navigation"
        aria-hidden={isMobile && !sidebarOpen ? true : undefined}
        inert={isMobile && !sidebarOpen ? true : undefined}
      >
        <div className="identity">
          <div className="avatar" aria-hidden="true">
            C
          </div>
          <div>
            <strong>陈成</strong>
            <span>前端负责人 · 产品工程</span>
          </div>
        </div>

        <nav className="navigation" aria-label="作品集目录">
          {groupedItems.map(({ section, items }) => (
            <section className="nav-section" key={section}>
              <div className="nav-section-title">
                <span className="folder-mark" aria-hidden="true" />
                {section}
              </div>
              {section === '项目描述' ? (
                <ProjectNavigation
                  items={items}
                  activeId={activeItem.id}
                  onNavigate={navigate}
                />
              ) : (
                items.map((item) => (
                  <NavigationItem
                    item={item}
                    activeId={activeItem.id}
                    onNavigate={navigate}
                    key={item.id}
                  />
                ))
              )}
            </section>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          开放工作机会与项目交流
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button
            className="menu-button"
            aria-label="打开目录"
            aria-controls="portfolio-navigation"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="title-block">
            <span>{activeItem.eyebrow}</span>
            <div>
              <h1>{activeItem.title}</h1>
              <p>{activeItem.description}</p>
            </div>
          </div>
          <HeaderActions
            item={activeItem}
            isMobile={isMobile}
            onReload={() => setFrameKey((key) => key + 1)}
          />
        </header>

        <div className="content-stage" ref={contentStageRef}>
          <Content item={activeItem} frameKey={frameKey} isMobile={isMobile} />
        </div>
      </main>
    </div>
  )
}

function NavigationItem({
  item,
  activeId,
  onNavigate,
}: {
  item: PortfolioItem
  activeId: string
  onNavigate: (item: PortfolioItem) => void
}) {
  return (
    <button
      className={`nav-item ${activeId === item.id ? 'is-active' : ''}`}
      onClick={() => onNavigate(item)}
      aria-current={activeId === item.id ? 'page' : undefined}
    >
      <span className={`file-mark file-mark-${item.kind}`} aria-hidden="true" />
      <span>{item.title}</span>
    </button>
  )
}

function ProjectNavigation({
  items,
  activeId,
  onNavigate,
}: {
  items: PortfolioItem[]
  activeId: string
  onNavigate: (item: PortfolioItem) => void
}) {
  const projectItems = items.filter(
    (item): item is Extract<PortfolioItem, { kind: 'article' }> => item.kind === 'article',
  )
  const groups = projectGroups
    .map((group) => ({
      ...group,
      items: projectItems.filter((item) => item.group === group.id),
    }))
    .filter((group) => group.items.length > 0)

  return groups.map((group) => (
    <div className="nav-group" key={group.id}>
      <div className="nav-group-title">
        <span className="folder-mark" aria-hidden="true" />
        <span>{group.label}</span>
        <span>{String(group.items.length).padStart(2, '0')}</span>
      </div>
      {group.items.map((item) => (
        <NavigationItem
          item={item}
          activeId={activeId}
          onNavigate={onNavigate}
          key={item.id}
        />
      ))}
    </div>
  ))
}

function HeaderActions({
  item,
  isMobile,
  onReload,
}: {
  item: PortfolioItem
  isMobile: boolean
  onReload: () => void
}) {
  if (item.kind === 'pdf') {
    return (
      <div className="header-actions">
        <a className="button button-secondary" href={item.source} target="_blank" rel="noreferrer">
          新窗口打开
        </a>
        <a className="button button-primary" href={item.source} download={item.fileName}>
          下载 PDF
        </a>
      </div>
    )
  }

  if (item.kind === 'iframe') {
    if (isMobile) {
      return null
    }

    return (
      <div className="header-actions">
        <button className="button button-secondary" onClick={onReload}>
          刷新
        </button>
        <a className="button button-primary" href={item.source} target="_blank" rel="noreferrer">
          打开 Demo
        </a>
      </div>
    )
  }

  if (item.kind === 'gallery') {
    return <span className="item-count">{item.images.length} 张图片</span>
  }

  if (item.demo) {
    if (isMobile) {
      return null
    }

    return (
      <div className="header-actions">
        <button className="button button-secondary" onClick={() => window.print()}>
          打印
        </button>
        <a className="button button-primary" href={item.demo.source} target="_blank" rel="noreferrer">
          打开 Demo
        </a>
      </div>
    )
  }

  return (
    <button className="button button-secondary" onClick={() => window.print()}>
      打印
    </button>
  )
}

function Content({
  item,
  frameKey,
  isMobile,
}: {
  item: PortfolioItem
  frameKey: number
  isMobile: boolean
}) {
  if (item.kind === 'pdf') {
    if (isMobile) {
      return <MobileResume item={item} />
    }

    return (
      <div className="viewer-card pdf-viewer">
        <object data={`${item.source}#zoom=page-width`} type="application/pdf" aria-label={item.title}>
          <div className="viewer-fallback">
            <p>当前浏览器无法直接预览 PDF。</p>
            <a href={item.source} target="_blank" rel="noreferrer">
              打开简历
            </a>
          </div>
        </object>
      </div>
    )
  }

  if (item.kind === 'iframe') {
    if (isMobile) {
      return (
        <DemoNotice
          title={item.title}
          description={item.description}
          source={item.source}
        />
      )
    }

    return (
      <div className="work-view">
        <div className="work-toolbar">
          <div className="traffic-lights" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="address-field">{item.source}</div>
          <div className="work-status">
            <span className="status-dot" />
            {item.status}
          </div>
        </div>
        <iframe
          key={frameKey}
          src={item.source}
          title={item.title}
          allow="fullscreen; clipboard-write"
          loading="eager"
        />
      </div>
    )
  }

  if (item.kind === 'gallery') {
    return (
      <div className="gallery-view">
        {item.images.map((image) => (
          <figure key={image.source}>
            <img src={image.source} alt={image.alt} loading="lazy" />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
    )
  }

  const groupedArticles = portfolioItems.filter(
    (portfolioItem): portfolioItem is Extract<PortfolioItem, { kind: 'article' }> =>
      portfolioItem.kind === 'article' && portfolioItem.group === item.group,
  )
  const articleIndex = groupedArticles.findIndex((portfolioItem) => portfolioItem.id === item.id) + 1
  const groupLabel = projectGroups.find((group) => group.id === item.group)?.label || item.group
  const articleContextLabel = groupLabel === '美餐' ? '美餐项目' : groupLabel

  return (
    <article className={`article-view ${item.demo || item.visuals?.length ? 'is-featured' : ''}`}>
      <div className="article-hero">
        <span className="article-index">{String(articleIndex).padStart(2, '0')}</span>
        <div>
          <p className="article-kicker">{articleContextLabel} · 项目记录</p>
          <h2>{item.title}</h2>
          <p className="article-intro">{item.intro}</p>
        </div>
      </div>
      <dl className="fact-grid">
        {item.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      {item.links?.length ? (
        <div className="article-links" aria-label="项目外部链接">
          {item.links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
              <span>{link.label}</span>
              {link.note ? <small>{link.note}</small> : null}
              <b aria-hidden="true">↗</b>
            </a>
          ))}
        </div>
      ) : null}
      {item.demo ? (
        <figure className="article-demo">
          <div className="article-demo-heading">
            <div>
              <span>{item.demo.label || '交互演示'}</span>
              <h3>{item.demo.title}</h3>
            </div>
            <span className="article-demo-badge">{item.demo.badge || '合成数据'}</span>
          </div>
          <div
            className="article-demo-browser"
            style={item.demo.height ? { height: item.demo.height } : undefined}
          >
            <div className="article-demo-toolbar">
              <div className="traffic-lights" aria-hidden="true"><span /><span /><span /></div>
              <span>{item.demo.toolbar || 'Layered Route Lab · Agent Sidecar'}</span>
              <span>{item.demo.status || 'LIVE'}</span>
            </div>
            <DeferredFrame
              source={item.demo.source}
              title={item.demo.title}
              isMobile={isMobile}
              allow="clipboard-write"
              requireInteraction
            />
          </div>
          <figcaption>{item.demo.description}</figcaption>
        </figure>
      ) : null}
      {item.visuals?.map((visual) => (
        <figure className="article-visual" key={visual.source}>
          <div className="article-visual-heading">
            <div>
              <span>架构示意</span>
              <h3>{visual.title}</h3>
            </div>
            <span className="article-visual-badge">合成数据</span>
          </div>
          <DeferredFrame
            source={visual.source}
            title={visual.title}
            isMobile={isMobile}
            sandbox="allow-scripts"
            mobileLabel="架构图建议在电脑端查看"
          />
          <figcaption>{visual.description}</figcaption>
        </figure>
      ))}
      <div className="article-sections">
        {item.sections.map((section, index) => (
          <section key={section.title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <div className="article-section-heading">
                <h3>{section.title}</h3>
                {section.phase ? <span>{section.phase}</span> : null}
              </div>
              <p>{section.body}</p>
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}

function MobileResume({ item }: { item: Extract<PortfolioItem, { kind: 'pdf' }> }) {
  return (
    <article className="mobile-resume">
      <div className="mobile-resume-hero">
        <span>RESUME</span>
        <h2>陈成</h2>
        <strong>{item.mobileResume.headline}</strong>
        <p>{item.mobileResume.intro}</p>
      </div>

      <section>
        <h3>核心能力</h3>
        <ul>
          {item.mobileResume.strengths.map((strength) => (
            <li key={strength}>{strength}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>工作经历</h3>
        <div className="mobile-resume-experience">
          {item.mobileResume.experience.map((experience) => (
            <article key={`${experience.company}-${experience.period}`}>
              <div>
                <strong>{experience.company}</strong>
                <span>{experience.period}</span>
              </div>
              <b>{experience.role}</b>
              <p>{experience.description}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mobile-resume-actions">
        <a className="button button-primary" href={item.source} target="_blank" rel="noreferrer">
          查看完整 PDF
        </a>
        <a className="button button-secondary" href={item.source} download={item.fileName}>
          下载简历
        </a>
      </div>
    </article>
  )
}

function DemoNotice({
  title,
  description,
  source,
}: {
  title: string
  description: string
  source: string
}) {
  return (
    <section className="demo-notice">
      <span>DESKTOP DEMO</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="demo-notice-hint">
        <strong>建议使用电脑体验</strong>
        <span>当前设备仍可阅读简历和完整项目说明，交互 Demo 不会在后台加载。</span>
      </div>
      <a className="button button-secondary" href={source} target="_blank" rel="noreferrer">
        仍然打开 Demo
      </a>
    </section>
  )
}

function DeferredFrame({
  source,
  title,
  isMobile,
  allow,
  sandbox,
  requireInteraction = false,
  mobileLabel = '交互演示建议在电脑端体验',
}: {
  source: string
  title: string
  isMobile: boolean
  allow?: string
  sandbox?: string
  requireInteraction?: boolean
  mobileLabel?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [frameLoaded, setFrameLoaded] = useState(false)
  const [loadTimedOut, setLoadTimedOut] = useState(false)

  useEffect(() => {
    setShouldLoad(false)
    setFrameLoaded(false)
    setLoadTimedOut(false)

    if (isMobile || requireInteraction) {
      return
    }

    const container = containerRef.current
    if (!container || !('IntersectionObserver' in window)) {
      setShouldLoad(true)
      return
    }

    const root = container.closest('.content-stage')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { root, threshold: 0.01 },
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [isMobile, requireInteraction, source])

  useEffect(() => {
    if (!shouldLoad || frameLoaded) {
      return
    }

    const timer = window.setTimeout(() => setLoadTimedOut(true), 10_000)
    return () => window.clearTimeout(timer)
  }, [frameLoaded, shouldLoad])

  return (
    <div className="deferred-frame" ref={containerRef}>
      {shouldLoad ? (
        <iframe
          src={source}
          title={title}
          loading="lazy"
          allow={allow}
          sandbox={sandbox}
          onLoad={() => setFrameLoaded(true)}
        />
      ) : (
        <div className="deferred-frame-placeholder">
          <span>
            {isMobile ? 'DESKTOP VIEW' : requireInteraction ? 'ON DEMAND' : 'LOADS WHEN VISIBLE'}
          </span>
          <strong>
            {isMobile
              ? mobileLabel
              : requireInteraction
                ? '点击后加载交互演示'
                : '滚动到这里时加载'}
          </strong>
          {isMobile ? (
            <a href={source} target="_blank" rel="noreferrer">
              仍然打开
            </a>
          ) : requireInteraction ? (
            <button className="button button-primary" type="button" onClick={() => setShouldLoad(true)}>
              加载 Demo
            </button>
          ) : null}
        </div>
      )}
      {shouldLoad && !frameLoaded ? (
        <div className="deferred-frame-loading" role="status">
          <span>{loadTimedOut ? '加载时间较长' : '正在加载交互内容…'}</span>
          {loadTimedOut ? (
            <a href={source} target="_blank" rel="noreferrer">
              在新窗口打开
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
