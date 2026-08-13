import type { PortfolioProject } from '../data'
import { AppLink } from '../components/common/AppLink'
import { DeferredFrame } from '../components/common/DeferredFrame'
import { CaseChapter } from '../components/case-study/CaseChapter'
import { CaseFacts } from '../components/case-study/CaseFacts'
import { CaseHero } from '../components/case-study/CaseHero'
import { CaseToc } from '../components/case-study/CaseToc'
import { CaseVisual } from '../components/case-study/CaseVisual'
import { NextCase } from '../components/case-study/NextCase'
import { useLanguage } from '../i18n/LanguageContext'

export function CaseStudyPage({ project, pathname }: { project: PortfolioProject; pathname: string }) {
  const { copy } = useLanguage()
  const compact = project.tier === 'archive'
  const htmlVisuals = project.visuals?.filter((visual) => visual.kind === 'html-frame') || []
  const demoLivesInChapter = project.chapters.some((chapter) => chapter.id === 'demo')

  return (
    <main className={`page case-page ${compact ? 'case-page--archive' : ''}`}>
      <CaseHero project={project} compact={compact} />
      <CaseFacts project={project} />

      <div className="case-body-layout">
        <article className="case-content">
          <section className="outcome-summary" aria-labelledby="outcome-title">
            <p className="eyebrow">{copy.caseStudy.outcomesEyebrow}</p>
            <h2 id="outcome-title">{copy.caseStudy.outcomesTitle}</h2>
            <ul>
              {project.impact.map((impact) => (
                <li key={impact}>{impact}</li>
              ))}
            </ul>
          </section>

          <section className="case-primary-visual" aria-label={copy.caseStudy.visualLabel}>
            <CaseVisual project={project} />
          </section>

          {project.links?.length ? (
            <nav className="case-links" aria-label={copy.caseStudy.externalLinks}>
              {project.links.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                  <span>{link.label}</span>
                  {link.note ? <small>{link.note}</small> : null}
                  <b aria-hidden="true">↗</b>
                </a>
              ))}
            </nav>
          ) : null}

          {htmlVisuals.map((visual) => (
            <DeferredFrame key={visual.id} visual={visual} />
          ))}

          {project.demo && !demoLivesInChapter ? (
            <section className="case-demo-section" aria-labelledby="case-demo-title">
              <p className="eyebrow">{copy.caseStudy.evidenceEyebrow}</p>
              <h2 id="case-demo-title">{copy.caseStudy.demoTitle}</h2>
              <DeferredFrame demo={project.demo} />
            </section>
          ) : null}

          <div className="case-chapters">
            {project.chapters.map((chapter, index) => (
              <div key={chapter.id}>
                <CaseChapter chapter={chapter} index={index} />
                {chapter.id === 'demo' && project.demo ? <DeferredFrame demo={project.demo} /> : null}
              </div>
            ))}
          </div>

          {project.provenanceNote ? (
            <aside className="provenance-note">
              <strong>{copy.caseStudy.publicNote}</strong>
              <p>{project.provenanceNote}</p>
            </aside>
          ) : null}

          <NextCase project={project} />
        </article>
        <CaseToc pathname={pathname} chapters={project.chapters} />
      </div>

      {compact ? (
        <AppLink className="archive-back-link" to="/archive">
          ← {copy.caseStudy.returnToProjects}
        </AppLink>
      ) : null}
    </main>
  )
}
