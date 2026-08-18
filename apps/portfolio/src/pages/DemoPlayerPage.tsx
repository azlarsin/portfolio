import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { ProjectProvenance } from '../data/types'
import {
  getDemoExperience,
  type DemoExperience,
} from '../data/demoExperiences'
import { AppLink } from '../components/common/AppLink'
import { useLanguage } from '../i18n/LanguageContext'
import type { ResolvedRoute } from '../app/router'
import {
  DemoNavigationDrawer,
  useDesktopGuidePosition,
} from '../components/layout/Sidebar'

function playerExperience(route: ResolvedRoute) {
  return getDemoExperience(new URLSearchParams(route.search).get('experience'))
}

function experienceLabel(experience: DemoExperience, language: 'zh' | 'en') {
  return experience.name[language]
}

function statusProvenanceClass(provenance: ProjectProvenance) {
  return `demo-player-provenance demo-player-provenance--${provenance}`
}

function ExperienceGuide({
  experience,
  dismissed,
  onDismiss,
  onReopen,
}: {
  experience: DemoExperience
  dismissed: boolean
  onDismiss: () => void
  onReopen: () => void
}) {
  const { language, copy } = useLanguage()
  const { guideRef, position, dragHandlers } = useDesktopGuidePosition(
    !dismissed,
    experience.id,
  )
  const guide = experience.guide[language]

  if (dismissed) {
    return (
      <button type="button" className="demo-guide-reopen" onClick={onReopen}>
        {copy.demo.player.reopenGuide}
      </button>
    )
  }

  return (
    <aside
      ref={guideRef}
      className="demo-experience-guide"
      aria-label={copy.demo.player.guide}
      style={{ '--guide-x': `${position.x}px`, '--guide-y': `${position.y}px` } as CSSProperties}
    >
      <header className="demo-guide-titlebar">
        <div className="demo-guide-drag-handle" {...dragHandlers}>
          <span>{copy.demo.player.guide}</span>
          <strong>{experienceLabel(experience, language)}</strong>
        </div>
        <button
          type="button"
          className="demo-guide-close"
          aria-label={copy.demo.player.closeGuide}
          onClick={onDismiss}
        >
          ×
        </button>
      </header>
      <div className="demo-guide-body">
        <p className="demo-guide-start">
          {copy.demo.player.startHere} · {guide.duration} {copy.demo.player.minutes}
        </p>
        <p>{guide.summary}</p>
        <p className="demo-guide-boundary">
          <strong>{copy.demo.player.boundary}</strong>
          {guide.boundary}
        </p>
        <ol>
          {guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </aside>
  )
}

function UnavailableDemo({ route }: { route: ResolvedRoute }) {
  const { copy } = useLanguage()
  const requestedId = new URLSearchParams(route.search).get('experience')

  return (
    <main className="demo-player-safe-state">
      <div>
        <p className="eyebrow">SAFE DEMO PLAYER</p>
        <h1>{copy.demo.player.unavailableTitle}</h1>
        <p>{copy.demo.player.unavailableBody}</p>
        {requestedId ? <code>experience={requestedId}</code> : null}
        <AppLink className="button button-primary" to="/archive">
          {copy.demo.player.openCase}
        </AppLink>
      </div>
    </main>
  )
}

export function DemoPlayerPage({ route }: { route: ResolvedRoute }) {
  const { language, copy } = useLanguage()
  const experience = playerExperience(route)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [guideDismissed, setGuideDismissed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const wasDrawerOpen = useRef(false)

  useEffect(() => {
    setDrawerOpen(false)
    setGuideDismissed(false)
    setLoaded(false)
    setTimedOut(false)
    setAttempt(0)
  }, [experience?.id])

  useEffect(() => {
    if (!drawerOpen) {
      if (wasDrawerOpen.current) menuButtonRef.current?.focus()
      wasDrawerOpen.current = false
      return
    }

    wasDrawerOpen.current = true
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusFrame = window.requestAnimationFrame(() => firstLinkRef.current?.focus())
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [drawerOpen])

  useEffect(() => {
    if (!experience?.source || loaded || timedOut) return
    const timeout = window.setTimeout(() => setTimedOut(true), 12_000)
    return () => window.clearTimeout(timeout)
  }, [attempt, experience?.source, loaded, timedOut])

  if (!experience?.source) return <UnavailableDemo route={route} />

  const retry = () => {
    setLoaded(false)
    setTimedOut(false)
    setAttempt((value) => value + 1)
  }

  const title = experienceLabel(experience, language)

  return (
    <main className="demo-player-page">
      <div className="demo-player-content" inert={drawerOpen ? true : undefined}>
        <section className="demo-player-stage">
          <iframe
            key={attempt}
            src={experience.source}
            title={title}
            allow={experience.allow}
            sandbox={experience.sandbox}
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => {
              setLoaded(true)
              setTimedOut(false)
            }}
            onError={() => setTimedOut(true)}
          />
          {!loaded ? (
            <div className={`demo-player-load-state ${timedOut ? 'is-error' : ''}`} aria-live="polite">
              <strong>{timedOut ? copy.demo.player.timeout : copy.demo.player.loading}</strong>
              {timedOut ? (
                <button type="button" className="button button-primary" onClick={retry}>
                  {copy.demo.player.retry}
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

        <header className="demo-player-chrome">
          <button
            ref={menuButtonRef}
            type="button"
            className="demo-player-menu"
            aria-label={copy.demo.player.menu}
            aria-controls="demo-navigation"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="demo-player-title">
            <span className={statusProvenanceClass(experience.provenance)}>{experience.status}</span>
            <strong>{title}</strong>
          </div>
          <div className="demo-player-actions">
            <button type="button" className="demo-guide-toggle" onClick={() => setGuideDismissed(false)}>
              {copy.demo.player.guide}
            </button>
            <AppLink className="demo-player-back" to={experience.casePath}>
              ← {copy.demo.player.backToCase}
            </AppLink>
          </div>
        </header>

        <ExperienceGuide
          experience={experience}
          dismissed={guideDismissed}
          onDismiss={() => setGuideDismissed(true)}
          onReopen={() => setGuideDismissed(false)}
        />

        {timedOut ? (
          <a
            className="demo-player-source"
            href={experience.source}
            target="_blank"
            rel="noreferrer"
          >
            {copy.demo.player.openSource}
          </a>
        ) : null}
      </div>

      <DemoNavigationDrawer
        route={route}
        open={drawerOpen}
        firstLinkRef={firstLinkRef}
        onClose={() => setDrawerOpen(false)}
      />
    </main>
  )
}
