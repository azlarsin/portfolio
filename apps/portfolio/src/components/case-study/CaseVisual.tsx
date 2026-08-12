import type { PortfolioProject } from '../../data'
import { ElpisFlowVisual } from '../home/ElpisFlowVisual'
import { LayeredAgentVisual } from '../home/LayeredAgentVisual'
import { MeicanEvolutionVisual } from '../home/MeicanEvolutionVisual'

export function CaseVisual({ project }: { project: PortfolioProject }) {
  if (project.slug === 'meican-platform') return <MeicanEvolutionVisual />
  if (project.slug === 'layered-agent') return <LayeredAgentVisual />
  if (project.slug === 'elpis') return <ElpisFlowVisual />
  return null
}
