import type { PortfolioProject } from '../../data'
import { AppLink } from '../common/AppLink'

export function NextCase({ project }: { project: PortfolioProject }) {
  if (project.tier === 'archive') {
    return (
      <footer className="next-case">
        <span>继续浏览</span>
        <AppLink to="/archive">返回个人项目集 →</AppLink>
      </footer>
    )
  }

  const next =
    project.slug === 'meican-platform'
      ? { path: '/work/baijiahao-editor', label: '百家号编辑器演进' }
      : project.slug === 'baijiahao-editor'
        ? { path: '/work/layered-agent', label: 'Layered Route × Agent' }
        : { path: '/experience', label: '职业经历' }

  return (
    <footer className="next-case">
      <span>下一部分</span>
      <AppLink to={next.path}>{next.label} →</AppLink>
    </footer>
  )
}
