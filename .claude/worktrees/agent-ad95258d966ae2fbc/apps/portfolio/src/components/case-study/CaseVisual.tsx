import type { PortfolioProject } from '../../data'
import { BaijiahaoEditorVisual } from '../home/BaijiahaoEditorVisual'
import { BaiduMapWorkbenchVisual } from '../home/BaiduMapWorkbenchVisual'
import { ElpisFlowVisual } from '../home/ElpisFlowVisual'
import { LayeredAgentVisual } from '../home/LayeredAgentVisual'
import { MeicanEvolutionVisual } from '../home/MeicanEvolutionVisual'
import { CocoWalletVisual } from './CocoWalletVisual'

export function CaseVisual({ project }: { project: PortfolioProject }) {
  if (project.slug === 'meican-platform') return <MeicanEvolutionVisual />
  if (project.slug === 'baidu-map-workbench') return <BaiduMapWorkbenchVisual />
  if (project.slug === 'baijiahao-editor') return <BaijiahaoEditorVisual />
  if (project.slug === 'layered-agent') return <LayeredAgentVisual />
  if (project.slug === 'elpis') return <ElpisFlowVisual />
  if (project.slug === 'coco-wallet') return <CocoWalletVisual />
  return null
}
