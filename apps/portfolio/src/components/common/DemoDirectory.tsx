import type { PortfolioProject } from '../../data'
import { AppLink } from './AppLink'
import { useLanguage } from '../../i18n/LanguageContext'

function projectPath(project: PortfolioProject) {
  return project.tier === 'featured'
    ? `/work/${project.slug}`
    : `/archive/${project.slug}`
}

export function DemoDirectory({
  projects,
  title,
  description,
}: {
  projects: readonly PortfolioProject[]
  title: string
  description: string
}) {
  const { copy } = useLanguage()
  const demoProjects = projects.filter(
    (project): project is PortfolioProject & { demo: NonNullable<PortfolioProject['demo']> } =>
      Boolean(project.demo),
  )

  if (!demoProjects.length) return null

  return (
    <section className="demo-directory" aria-labelledby="demo-directory-title">
      <header className="demo-directory-heading">
        <div>
          <p className="eyebrow">INTERACTIVE DEMOS</p>
          <h2 id="demo-directory-title">{title}</h2>
        </div>
        <p>{description}</p>
      </header>

      <div className="demo-directory-grid">
        {demoProjects.map((project, index) => (
          <article key={project.slug}>
            <div className="demo-directory-meta">
              <span>DEMO {String(index + 1).padStart(2, '0')}</span>
              <small>{project.demo.statusLabel}</small>
            </div>
            <h3>{project.shortTitle}</h3>
            <p>{project.summary || project.demo.description}</p>
            <div className="demo-directory-actions">
              <a
                className="button button-primary"
                href={project.demo.source}
                target="_blank"
                rel="noreferrer"
              >
                {copy.demo.openDemo} <span aria-hidden="true">↗</span>
              </a>
              <AppLink className="text-link" to={projectPath(project)}>
                {copy.demo.viewDescription} <span aria-hidden="true">→</span>
              </AppLink>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
