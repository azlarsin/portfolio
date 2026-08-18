import { archiveProjects } from './archive'
import { baijiahaoEditorProject } from './featured/baijiahaoEditor'
import { baiduMapWorkbenchProject } from './featured/baiduMapWorkbench'
import { elpisProject } from './featured/elpis'
import { layeredAgentProject } from './featured/layeredAgent'
import { meicanPlatformProject } from './featured/meicanPlatform'
import type { PortfolioProject } from './types'

export const featuredProjects: readonly [
  PortfolioProject,
  PortfolioProject,
  PortfolioProject,
  PortfolioProject,
] = [
  meicanPlatformProject,
  baiduMapWorkbenchProject,
  baijiahaoEditorProject,
  layeredAgentProject,
]

export const portfolioProjects: PortfolioProject[] = [
  ...featuredProjects,
  ...archiveProjects,
].sort((left, right) => left.order - right.order)

export const portfolioProjectBySlug = new Map(
  portfolioProjects.map((project) => [project.slug, project] as const),
)

export { archiveProjects }
export { demoExperiences, demoPlayerPath, getDemoExperience } from './demoExperiences'
export type { DemoExperience, DemoExperienceGuide } from './demoExperiences'
export { cocoWalletProject } from './cocoWallet'
export { baijiahaoEditorProject } from './featured/baijiahaoEditor'
export { baiduMapWorkbenchProject } from './featured/baiduMapWorkbench'
export { elpisProject } from './featured/elpis'
export {
  layeredAgentManifestStats,
  layeredAgentProject,
} from './featured/layeredAgent'
export { meicanPlatformProject } from './featured/meicanPlatform'
export { projectNavigation, projectNavigationBySlug } from './navigation'
export type {
  CaseChapter,
  DemoExperienceId,
  DemoPosterVariant,
  DemoSpec,
  PortfolioProject,
  ProjectFact,
  ProjectLink,
  ProjectNavigationGroup,
  ProjectNavigationItem,
  ProjectProvenance,
  ProjectProvenanceDisplay,
  ProjectTier,
  VisualKind,
  VisualSpec,
} from './types'
