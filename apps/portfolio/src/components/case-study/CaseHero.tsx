import type { PortfolioProject } from '../../data'
import { ProvenanceBadge, getProvenanceDescription } from '../common/ProvenanceBadge'
import { TagList } from '../common/TagList'

export function CaseHero({ project, compact = false }: { project: PortfolioProject; compact?: boolean }) {
  return (
    <header className={`case-hero ${compact ? 'case-hero--compact' : ''}`}>
      <ProvenanceBadge provenance={project.provenance} showDescription />
      <p className="eyebrow">{project.eyebrow}</p>
      <h1>{project.title}</h1>
      <p className="case-thesis">{project.thesis}</p>
      <dl className="case-meta">
        <div>
          <dt>时间</dt>
          <dd>{project.period}</dd>
        </div>
        <div>
          <dt>职责</dt>
          <dd>{project.role}</dd>
        </div>
        <div>
          <dt>状态</dt>
          <dd>{project.status}</dd>
        </div>
        <div>
          <dt>来源</dt>
          <dd>{getProvenanceDescription(project.provenance)}</dd>
        </div>
      </dl>
      {project.technologies?.length ? <TagList tags={project.technologies} /> : null}
    </header>
  )
}
