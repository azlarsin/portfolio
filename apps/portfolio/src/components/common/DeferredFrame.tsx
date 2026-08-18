import { useEffect, useState, type CSSProperties } from 'react'
import type { DemoSpec, VisualSpec } from '../../data'
import { demoPlayerPath, getDemoExperience } from '../../data/demoExperiences'
import { DemoPoster, EvidencePoster } from './DemoPoster'
import { useMediaQuery } from './useMediaQuery'
import { useLanguage } from '../../i18n/LanguageContext'
import { AppLink } from './AppLink'

type FrameStyle = CSSProperties & { '--frame-height': string }

function InteractiveFrame({ demo }: { demo: DemoSpec }) {
  const { copy } = useLanguage()
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
    if (!experience) return
    setLoaded(false)
    setTimedOut(false)
    setShouldLoad(true)
    setAttempt((value) => value + 1)
  }

  const experience = getDemoExperience(demo.experienceId)
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
        {shouldLoad && !isMobile && experience ? (
          <iframe
            key={attempt}
            src={experience.source}
            title={demo.title}
            loading="lazy"
            allow={experience.allow}
            sandbox={experience.sandbox}
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
            <strong>{timedOut ? copy.demo.loadFailed : copy.demo.loading}</strong>
            {timedOut ? <span>{copy.demo.loadFailedHint}</span> : null}
            {timedOut ? (
              <button type="button" className="button button-secondary" onClick={load}>
                {copy.demo.reload}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <footer className="demo-frame-footer">
        <p>{demo.description}</p>
        <div>
          <AppLink
            className="button button-primary"
            to={demoPlayerPath(demo.experienceId)}
          >
            {copy.demo.openFullWindow}
          </AppLink>
          {!isMobile ? (
            <button type="button" className="button button-secondary" onClick={load}>
              {shouldLoad ? copy.demo.reloadDemo : demo.ctaLabel || copy.demo.loadDemo}
            </button>
          ) : null}
        </div>
      </footer>
    </section>
  )
}

function VisualFrame({ visual }: { visual: VisualSpec }) {
  const { copy } = useLanguage()
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
            <strong>{timedOut ? copy.demo.architectureFailed : copy.demo.architectureLoading}</strong>
            {timedOut ? (
              <button type="button" className="button button-secondary" onClick={load}>
                {copy.demo.reload}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="evidence-frame-actions">
        {visual.experienceId ? (
          <AppLink className="button button-primary" to={demoPlayerPath(visual.experienceId)}>
            {copy.demo.openFullWindow}
          </AppLink>
        ) : (
          <>
            {!isMobile && !shouldLoad ? (
              <button type="button" className="button button-secondary" onClick={load}>
                {copy.demo.loadArchitecture}
              </button>
            ) : null}
            <a href={visual.source} target="_blank" rel="noreferrer">
              {copy.demo.viewWindow}
            </a>
          </>
        )}
      </div>
    </figure>
  )
}

export function DeferredFrame({ demo, visual }: { demo?: DemoSpec; visual?: VisualSpec }) {
  if (demo) return <InteractiveFrame demo={demo} />
  if (visual) return <VisualFrame visual={visual} />
  return null
}
