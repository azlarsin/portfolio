import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { archiveProjects, layeredAgentProject, demoPlayerPath } from '../../data'
import { getLocalizedProjects } from '../../data/localized'
import { projectPreviews } from '../../data/projectPreviews'
import { useLanguage } from '../../i18n/LanguageContext'
import { AppLink } from '../common/AppLink'

const previews = [
  'poke-prototype-editor',
  'layered-agent',
]

export function ProjectPlayground() {
  const { copy, language } = useLanguage()
  const projects = getLocalizedProjects([...archiveProjects, layeredAgentProject], language)

  return (
    <section
      className="home-section playground-section"
      aria-labelledby="playground-title"
    >
      <div className="section-heading section-heading--split">
        <div>
          <p className="eyebrow">PLAYGROUND</p>
          <h2 id="playground-title">{copy.home.labTitle}</h2>
        </div>
        <AppLink className="text-link" to="/archive">
          {copy.home.allProjects}
          <ArrowRight size={17} aria-hidden="true" />
        </AppLink>
      </div>
      <div className="playground-grid playground-grid--featured">
        {previews.map((slug) => {
          const project = projects.find((item) => item.slug === slug)
          if (!project?.demo) return null
          return (
            <article className="playground-project" key={slug}>
              <AppLink
                to={demoPlayerPath(project.demo.experienceId)}
                className="playground-preview"
                aria-label={`${copy.demo.openDemo}: ${project.shortTitle}`}
              >
                <img
                  src={projectPreviews[slug]}
                  width={960}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  alt={`${project.shortTitle} · ${copy.home.previewLabel}`}
                />
                <span className="preview-open">
                  <ArrowUpRight size={20} aria-hidden="true" />
                </span>
              </AppLink>
              <h3>
                <AppLink to={`${project.tier === 'featured' ? '/work' : '/archive'}/${slug}`}>
                  {project.shortTitle}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </AppLink>
              </h3>
              <p>{project.summary}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
