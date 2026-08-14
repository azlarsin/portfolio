import type { PortfolioProject } from '../../data'
import { AppLink } from '../common/AppLink'
import { ProvenanceBadge } from '../common/ProvenanceBadge'
import { TagList } from '../common/TagList'
import { BaijiahaoEditorVisual } from './BaijiahaoEditorVisual'
import { BaiduMapWorkbenchVisual } from './BaiduMapWorkbenchVisual'
import { ElpisFlowVisual } from './ElpisFlowVisual'
import { LayeredAgentVisual } from './LayeredAgentVisual'
import { MeicanEvolutionVisual } from './MeicanEvolutionVisual'
import { useLanguage } from '../../i18n/LanguageContext'

function CaseVisual({ slug, compact }: { slug: string; compact: boolean }) {
  if (slug === 'meican-platform') return <MeicanEvolutionVisual compact={compact} />
  if (slug === 'baidu-map-workbench') return <BaiduMapWorkbenchVisual compact={compact} />
  if (slug === 'baijiahao-editor') return <BaijiahaoEditorVisual compact={compact} />
  if (slug === 'layered-agent') return <LayeredAgentVisual compact={compact} />
  if (slug === 'elpis') return <ElpisFlowVisual compact={compact} />
  return null
}

export function FeaturedCase({
  project,
  index,
  primary = false,
  spotlight = false,
}: {
  project: PortfolioProject
  index: number
  primary?: boolean
  spotlight?: boolean
}) {
  const { copy } = useLanguage()

  return (
    <article
      className={`featured-case ${primary ? 'featured-case--primary' : ''} ${spotlight ? 'featured-case--spotlight' : ''}`}
    >
      <div className="featured-case-copy">
        <div className="featured-case-meta">
          <span>{String(index).padStart(2, '0')}</span>
          <ProvenanceBadge provenance={project.provenance} />
        </div>
        <h3>{project.title}</h3>
        <p>{project.thesis}</p>
        <ul className="evidence-list">
          {project.impact.slice(0, primary || spotlight ? 5 : 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <TagList tags={(project.technologies || []).slice(0, primary || spotlight ? 7 : 5)} />
        <AppLink className="text-link" to={`/work/${project.slug}`}>
          {copy.home.viewCase} <span aria-hidden="true">→</span>
        </AppLink>
      </div>
      <CaseVisual slug={project.slug} compact={!primary && !spotlight} />
    </article>
  )
}
