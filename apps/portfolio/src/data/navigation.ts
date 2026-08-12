import { archiveProjects } from './archive'
import { baijiahaoEditorProject } from './featured/baijiahaoEditor'
import { layeredAgentProject } from './featured/layeredAgent'
import { meicanPlatformProject } from './featured/meicanPlatform'
import type { PortfolioProject, ProjectNavigationGroup } from './types'

function toNavigationItem(project: PortfolioProject) {
  return {
    slug: project.slug,
    label: project.shortTitle,
    eyebrow: project.eyebrow,
    anchors: project.chapters.map((chapter) => ({
      id: chapter.id,
      label: chapter.title,
    })),
  }
}

export const projectNavigation: ProjectNavigationGroup[] = [
  {
    id: 'featured',
    label: '精选案例',
    items: [meicanPlatformProject, baijiahaoEditorProject, layeredAgentProject].map(
      toNavigationItem,
    ),
  },
  {
    id: 'archive',
    label: '个人项目集',
    items: archiveProjects.map(toNavigationItem),
  },
]

export const projectNavigationBySlug = new Map(
  projectNavigation.flatMap((group) =>
    group.items.map((item) => [item.slug, item] as const),
  ),
)
