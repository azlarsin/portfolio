import { useEffect, useMemo, useState } from 'react'
import { portfolioItems, sections, type PortfolioItem } from './content'

function getItemFromHash() {
  const id = window.location.hash.replace(/^#\/?/, '')
  return portfolioItems.find((item) => item.id === id) ?? portfolioItems[0]
}

export function App() {
  const [activeItem, setActiveItem] = useState<PortfolioItem>(getItemFromHash)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [frameKey, setFrameKey] = useState(0)

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

  const groupedItems = useMemo(
    () =>
      sections.map((section) => ({
        section,
        items: portfolioItems.filter((item) => item.section === section),
      })),
    [],
  )

  const navigate = (item: PortfolioItem) => {
    window.location.hash = `/${item.id}`
  }

  return (
    <div className="portfolio-shell">
      <button
        className={`sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`}
        aria-label="关闭目录"
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="identity">
          <div className="avatar" aria-hidden="true">
            C
          </div>
          <div>
            <strong>陈成</strong>
            <span>Product & Frontend</span>
          </div>
        </div>

        <nav className="navigation" aria-label="作品集目录">
          {groupedItems.map(({ section, items }) => (
            <section className="nav-section" key={section}>
              <div className="nav-section-title">
                <span className="folder-mark" aria-hidden="true" />
                {section}
              </div>
              {items.map((item) => (
                <button
                  className={`nav-item ${activeItem.id === item.id ? 'is-active' : ''}`}
                  key={item.id}
                  onClick={() => navigate(item)}
                  aria-current={activeItem.id === item.id ? 'page' : undefined}
                >
                  <span className={`file-mark file-mark-${item.kind}`} aria-hidden="true" />
                  <span>{item.title}</span>
                </button>
              ))}
            </section>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          Available for thoughtful work
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button
            className="menu-button"
            aria-label="打开目录"
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
          <HeaderActions item={activeItem} onReload={() => setFrameKey((key) => key + 1)} />
        </header>

        <div className="content-stage">
          <Content item={activeItem} frameKey={frameKey} />
        </div>
      </main>
    </div>
  )
}

function HeaderActions({ item, onReload }: { item: PortfolioItem; onReload: () => void }) {
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
    return (
      <div className="header-actions">
        <button className="button button-secondary" onClick={onReload}>
          刷新
        </button>
        <a className="button button-primary" href={item.source} target="_blank" rel="noreferrer">
          打开作品
        </a>
      </div>
    )
  }

  if (item.kind === 'gallery') {
    return <span className="item-count">{item.images.length} 张图片</span>
  }

  return (
    <button className="button button-secondary" onClick={() => window.print()}>
      打印
    </button>
  )
}

function Content({ item, frameKey }: { item: PortfolioItem; frameKey: number }) {
  if (item.kind === 'pdf') {
    return (
      <div className="viewer-card pdf-viewer">
        <object data={item.source} type="application/pdf" aria-label={item.title}>
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
          allow="fullscreen"
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

  return (
    <article className="article-view">
      <div className="article-hero">
        <span className="article-index">01</span>
        <div>
          <p className="article-kicker">CASE STUDY</p>
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
      <div className="article-sections">
        {item.sections.map((section, index) => (
          <section key={section.title}>
            <span>0{index + 1}</span>
            <div>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}
