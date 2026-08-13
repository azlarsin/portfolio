import type { PortfolioProject } from '../../data'
import { useLanguage } from '../../i18n/LanguageContext'

export function CaseFacts({ project }: { project: PortfolioProject }) {
  const { language, copy } = useLanguage()
  const separator = language === 'zh' ? '；' : '; '

  return (
    <dl className="case-facts">
      <div>
        <dt>{copy.caseStudy.result}</dt>
        <dd>{project.impact[0]}</dd>
      </div>
      <div>
        <dt>{copy.caseStudy.scope}</dt>
        <dd>{project.scope.slice(0, 2).join(separator)}</dd>
      </div>
      <div>
        <dt>{copy.caseStudy.role}</dt>
        <dd>{project.role}</dd>
      </div>
      <div>
        <dt>{copy.caseStudy.status}</dt>
        <dd>{project.status}</dd>
      </div>
    </dl>
  )
}
