import type { PortfolioProject } from '../../data'
import { AppLink } from '../common/AppLink'
import { ProvenanceBadge } from '../common/ProvenanceBadge'
import { TagList } from '../common/TagList'
import { ElpisFlowVisual } from './ElpisFlowVisual'
import { LayeredAgentVisual } from './LayeredAgentVisual'
import { MeicanEvolutionVisual } from './MeicanEvolutionVisual'

function CaseVisual({ slug, compact }: { slug: string; compact: boolean }) {
  if (slug === 'meican-platform') return <MeicanEvolutionVisual compact={compact} />
  if (slug === 'layered-agent') return <LayeredAgentVisual compact={compact} />
  return <ElpisFlowVisual compact={compact} />
}

export function FeaturedCase({
  project,
  index,
  primary = false,
}: {
  project: PortfolioProject
  index: number
  primary?: boolean
}) {
  return (
    <article className={`featured-case ${primary ? 'featured-case--primary' : ''}`}>
      <div className="featured-case-copy">
        <div className="featured-case-meta">
          <span>{String(index).padStart(2, '0')}</span>
          <ProvenanceBadge provenance={project.provenance} />
        </div>
        <h3>{project.title}</h3>
        <p>{project.thesis}</p>
        <ul className="evidence-list">
          {project.impact.slice(0, primary ? 4 : 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <TagList tags={(project.technologies || []).slice(0, primary ? 7 : 5)} />
        <AppLink className="text-link" to={`/work/${project.slug}`}>
          查看完整案例 <span aria-hidden="true">→</span>
        </AppLink>
      </div>
      <CaseVisual slug={project.slug} compact={!primary} />
    </article>
  )
}
