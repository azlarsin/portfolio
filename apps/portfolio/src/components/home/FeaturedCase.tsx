import { ArrowUpRight } from 'lucide-react'
import type { PortfolioProject } from '../../data'
import { AppLink } from '../common/AppLink'
import { ProvenanceBadge } from '../common/ProvenanceBadge'
import { useLanguage } from '../../i18n/LanguageContext'
import { CaseCover } from './CaseCover'

export function FeaturedCase({
  project,
  index,
}: {
  project: PortfolioProject
  index: number
}) {
  const { copy } = useLanguage()

  return (
    <article className={`featured-case featured-case--${project.slug}`}>
      <AppLink
        className="featured-case-cover"
        to={`/work/${project.slug}`}
        aria-label={`${copy.home.viewCase}: ${project.shortTitle}`}
      >
        <CaseCover project={project} index={index} />
      </AppLink>
      <div className="featured-case-copy">
        <div className="featured-case-meta">
          <ProvenanceBadge
            provenance={project.provenance}
            displayOverride={project.provenanceDisplay}
          />
          <span>{project.period.split('·')[0].trim()}</span>
        </div>
        <h3>
          <AppLink to={`/work/${project.slug}`}>
            {project.shortTitle}
            <ArrowUpRight size={22} aria-hidden="true" />
          </AppLink>
        </h3>
        <p>{project.impact[0]}</p>
        <ul
          className="case-keywords"
          aria-label={copy.caseStudy.technologyKeywords}
        >
          {(project.technologies || []).slice(0, 4).map((technology) => (
            <li key={technology}>{technology}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}
