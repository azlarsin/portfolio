import type { PortfolioProject } from '../data'
import { AppLink } from '../components/common/AppLink'
import { DeferredFrame } from '../components/common/DeferredFrame'
import { CaseChapter } from '../components/case-study/CaseChapter'
import { CaseFacts } from '../components/case-study/CaseFacts'
import { CaseHero } from '../components/case-study/CaseHero'
import { CaseToc } from '../components/case-study/CaseToc'
import { CaseVisual } from '../components/case-study/CaseVisual'
import { NextCase } from '../components/case-study/NextCase'

export function CaseStudyPage({ project, pathname }: { project: PortfolioProject; pathname: string }) {
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
            <p className="eyebrow">OUTCOMES</p>
            <h2 id="outcome-title">项目结果</h2>
            <ul>
              {project.impact.map((impact) => (
                <li key={impact}>{impact}</li>
              ))}
            </ul>
          </section>

          <section className="case-primary-visual" aria-label="案例视觉示意">
            <CaseVisual project={project} />
          </section>

          {project.links?.length ? (
            <nav className="case-links" aria-label="项目外部链接">
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
              <p className="eyebrow">INTERACTIVE EVIDENCE</p>
              <h2 id="case-demo-title">交互 Demo</h2>
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
              <strong>公开内容说明</strong>
              <p>{project.provenanceNote}</p>
            </aside>
          ) : null}

          <NextCase project={project} />
        </article>
        <CaseToc pathname={pathname} chapters={project.chapters} />
      </div>

      {compact ? (
        <AppLink className="archive-back-link" to="/archive">
          ← 返回个人项目集
        </AppLink>
      ) : null}
    </main>
  )
}
