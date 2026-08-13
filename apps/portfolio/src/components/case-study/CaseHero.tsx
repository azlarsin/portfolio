import type { PortfolioProject } from '../../data'
import { ProvenanceBadge, useProvenanceDescription } from '../common/ProvenanceBadge'
import { TagList } from '../common/TagList'
import { useLanguage } from '../../i18n/LanguageContext'

export function CaseHero({ project, compact = false }: { project: PortfolioProject; compact?: boolean }) {
  const { copy } = useLanguage()
  const provenanceDescription = useProvenanceDescription(project.provenance)

  return (
    <header className={`case-hero ${compact ? 'case-hero--compact' : ''}`}>
      <ProvenanceBadge provenance={project.provenance} showDescription />
      <p className="eyebrow">{project.eyebrow}</p>
      <h1>{project.title}</h1>
      <p className="case-thesis">{project.thesis}</p>
      <dl className="case-meta">
        <div>
          <dt>{copy.caseStudy.time}</dt>
          <dd>{project.period}</dd>
        </div>
        <div>
          <dt>{copy.caseStudy.role}</dt>
          <dd>{project.role}</dd>
        </div>
        <div>
          <dt>{copy.caseStudy.status}</dt>
          <dd>{project.status}</dd>
        </div>
        <div>
          <dt>{copy.caseStudy.source}</dt>
          <dd>{provenanceDescription}</dd>
        </div>
      </dl>
      {project.technologies?.length ? <TagList tags={project.technologies} /> : null}
    </header>
  )
}
