import { archiveProjects } from '../data'
import { AppLink } from '../components/common/AppLink'
import { DemoDirectory } from '../components/common/DemoDirectory'
import { ProvenanceBadge } from '../components/common/ProvenanceBadge'
import { TagList } from '../components/common/TagList'
import { getLocalizedProjects } from '../data/localized'
import { useLanguage } from '../i18n/LanguageContext'

export function ArchivePage() {
  const { language, copy } = useLanguage()
  const projects = getLocalizedProjects(archiveProjects, language)

  return (
    <main className="page page-standard archive-page">
      <header className="page-intro">
        <p className="eyebrow">{copy.archive.eyebrow}</p>
        <h1>{copy.archive.title}</h1>
        <p className="page-lead">{copy.archive.lead}</p>
      </header>

      <DemoDirectory
        projects={projects}
        title={copy.archive.demoTitle}
        description={copy.archive.demoDescription}
      />

      <div className="archive-list">
        {projects.map((project) => (
          <article key={project.slug}>
            <div className="archive-year">{project.period.split('·')[0].trim()}</div>
            <div className="archive-copy">
              <ProvenanceBadge provenance={project.provenance} />
              <h2>{project.title}</h2>
              <p>{project.summary || project.thesis}</p>
              <TagList tags={(project.technologies || []).slice(0, 5)} />
              <div className="archive-actions">
                <AppLink className="text-link" to={`/archive/${project.slug}`}>
                  {copy.archive.viewProject} <span aria-hidden="true">→</span>
                </AppLink>
                {project.demo ? <span className="demo-state">{project.demo.statusLabel}</span> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
