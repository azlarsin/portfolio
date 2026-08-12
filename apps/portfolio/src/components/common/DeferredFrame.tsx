import { useEffect, useState, type CSSProperties } from 'react'
import type { DemoSpec, VisualSpec } from '../../data'
import { DemoPoster, EvidencePoster } from './DemoPoster'
import { useMediaQuery } from './useMediaQuery'

type FrameStyle = CSSProperties & { '--frame-height': string }

function InteractiveFrame({ demo }: { demo: DemoSpec }) {
  const isMobile = useMediaQuery('(max-width: 760px)')
  const [shouldLoad, setShouldLoad] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!shouldLoad || loaded) return
    const timeout = window.setTimeout(() => setTimedOut(true), 12_000)
    return () => window.clearTimeout(timeout)
  }, [attempt, loaded, shouldLoad])

  const load = () => {
    setLoaded(false)
    setTimedOut(false)
    setShouldLoad(true)
    setAttempt((value) => value + 1)
  }

  const style: FrameStyle = { '--frame-height': `${demo.height || 680}px` }

  return (
    <section className="demo-frame" style={style} aria-label={demo.title}>
      <header className="demo-frame-heading">
        <div>
          <span>{demo.provenanceLabel}</span>
          <h3>{demo.title}</h3>
        </div>
        <small>{demo.statusLabel}</small>
      </header>

      <div className="demo-frame-stage">
        {shouldLoad && !isMobile ? (
          <iframe
            key={attempt}
            src={demo.source}
            title={demo.title}
            loading="lazy"
            allow={demo.allow || 'clipboard-write; fullscreen'}
            sandbox={
              demo.sandbox ||
              'allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox'
            }
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => {
              setLoaded(true)
              setTimedOut(false)
            }}
            onError={() => setTimedOut(true)}
          />
        ) : (
          <DemoPoster variant={demo.posterVariant || 'agent-console'} />
        )}

        {shouldLoad && !loaded && !isMobile ? (
          <div className={`frame-status ${timedOut ? 'is-error' : ''}`} aria-live="polite">
            <strong>{timedOut ? 'Demo 加载失败或响应时间过长' : '正在加载交互 Demo…'}</strong>
            {timedOut ? <span>可以重新加载，或直接在新窗口中打开。</span> : null}
            {timedOut ? (
              <button type="button" className="button button-secondary" onClick={load}>
                重新加载
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <footer className="demo-frame-footer">
        <p>{demo.description}</p>
        <div>
          {!isMobile ? (
            <button type="button" className="button button-primary" onClick={load}>
              {shouldLoad ? '重新加载 Demo' : demo.ctaLabel || 'Load interactive demo'}
            </button>
          ) : null}
          <a className="button button-secondary" href={demo.source} target="_blank" rel="noreferrer">
            在新窗口打开 Demo
          </a>
        </div>
      </footer>
    </section>
  )
}

function VisualFrame({ visual }: { visual: VisualSpec }) {
  const isMobile = useMediaQuery('(max-width: 760px)')
  const [shouldLoad, setShouldLoad] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!shouldLoad || loaded) return
    const timeout = window.setTimeout(() => setTimedOut(true), 10_000)
    return () => window.clearTimeout(timeout)
  }, [attempt, loaded, shouldLoad])

  const load = () => {
    setShouldLoad(true)
    setLoaded(false)
    setTimedOut(false)
    setAttempt((value) => value + 1)
  }

  if (!visual.source) return null

  return (
    <figure className="evidence-frame">
      <figcaption>
        <span>{visual.provenanceLabel || 'PUBLIC ARCHITECTURE EVIDENCE'}</span>
        <h3>{visual.title}</h3>
        <p>{visual.description}</p>
      </figcaption>
      <div className="evidence-frame-stage">
        {shouldLoad && !isMobile ? (
          <iframe
            key={attempt}
            src={visual.source}
            title={visual.title}
            loading="lazy"
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            onLoad={() => {
              setLoaded(true)
              setTimedOut(false)
            }}
            onError={() => setTimedOut(true)}
          />
        ) : (
          <EvidencePoster title={visual.title} />
        )}
        {shouldLoad && !loaded && !isMobile ? (
          <div className={`frame-status ${timedOut ? 'is-error' : ''}`} aria-live="polite">
            <strong>{timedOut ? '架构图加载失败' : '正在加载架构图…'}</strong>
            {timedOut ? (
              <button type="button" className="button button-secondary" onClick={load}>
                重新加载
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="evidence-frame-actions">
        {!isMobile && !shouldLoad ? (
          <button type="button" className="button button-secondary" onClick={load}>
            加载架构图
          </button>
        ) : null}
        <a href={visual.source} target="_blank" rel="noreferrer">
          新窗口查看
        </a>
      </div>
    </figure>
  )
}

export function DeferredFrame({ demo, visual }: { demo?: DemoSpec; visual?: VisualSpec }) {
  if (demo) return <InteractiveFrame demo={demo} />
  if (visual) return <VisualFrame visual={visual} />
  return null
}
