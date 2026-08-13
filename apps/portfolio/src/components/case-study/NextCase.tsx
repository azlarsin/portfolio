import type { PortfolioProject } from '../../data'
import { AppLink } from '../common/AppLink'
import { useLanguage } from '../../i18n/LanguageContext'

export function NextCase({ project }: { project: PortfolioProject }) {
  const { copy } = useLanguage()

  if (project.tier === 'archive') {
    return (
      <footer className="next-case">
        <span>{copy.caseStudy.continueBrowsing}</span>
        <AppLink to="/archive">{copy.caseStudy.returnToProjects} →</AppLink>
      </footer>
    )
  }

  const next =
    project.slug === 'meican-platform'
      ? { path: '/work/baijiahao-editor', label: copy.caseStudy.nextEditor }
      : project.slug === 'baijiahao-editor'
        ? { path: '/work/layered-agent', label: copy.caseStudy.nextAgent }
        : { path: '/experience', label: copy.caseStudy.nextExperience }

  return (
    <footer className="next-case">
      <span>{copy.caseStudy.nextSection}</span>
      <AppLink to={next.path}>{next.label} →</AppLink>
    </footer>
  )
}
