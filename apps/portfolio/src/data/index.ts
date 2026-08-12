import { archiveProjects } from './archive'
import { baijiahaoEditorProject } from './featured/baijiahaoEditor'
import { elpisProject } from './featured/elpis'
import { layeredAgentProject } from './featured/layeredAgent'
import { meicanPlatformProject } from './featured/meicanPlatform'
import type { PortfolioProject } from './types'

export const featuredProjects: readonly [
  PortfolioProject,
  PortfolioProject,
  PortfolioProject,
] = [meicanPlatformProject, baijiahaoEditorProject, layeredAgentProject]

export const portfolioProjects: PortfolioProject[] = [
  ...featuredProjects,
  ...archiveProjects,
].sort((left, right) => left.order - right.order)

export const portfolioProjectBySlug = new Map(
  portfolioProjects.map((project) => [project.slug, project] as const),
)

export { archiveProjects }
export { cocoWalletProject } from './cocoWallet'
export { baijiahaoEditorProject } from './featured/baijiahaoEditor'
export { elpisProject } from './featured/elpis'
export {
  layeredAgentManifestStats,
  layeredAgentProject,
} from './featured/layeredAgent'
export { meicanPlatformProject } from './featured/meicanPlatform'
export { projectNavigation, projectNavigationBySlug } from './navigation'
export type {
  CaseChapter,
  DemoPosterVariant,
  DemoSpec,
  PortfolioProject,
  ProjectFact,
  ProjectLink,
  ProjectNavigationGroup,
  ProjectNavigationItem,
  ProjectProvenance,
  ProjectTier,
  VisualKind,
  VisualSpec,
} from './types'
