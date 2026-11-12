import type { PortfolioProject } from '../../data'
import { ProvenanceBadge } from '../common/ProvenanceBadge'
import { TagList } from '../common/TagList'
import { useLanguage } from '../../i18n/LanguageContext'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { AppLink } from '../common/AppLink'
import { demoPlayerPath } from '../../data/demoExperiences'

export function CaseHero({
  project,
  compact = false,
}: {
  project: PortfolioProject
  compact?: boolean
}) {
  const { copy } = useLanguage()

  return (
    <header className={`case-hero ${compact ? 'case-hero--compact' : ''}`}>
      <AppLink
        className="case-breadcrumb"
        to={compact ? '/archive' : '/#selected-work'}
      >
        <ArrowLeft size={15} aria-hidden="true" />
        {compact ? copy.navigation.projects : copy.navigation.selectedWork}
      </AppLink>
      <ProvenanceBadge
        provenance={project.provenance}
        displayOverride={project.provenanceDisplay}
        showDescription
      />
      <p className="eyebrow">{project.eyebrow}</p>
      <h1>{project.title}</h1>
      <p className="case-thesis">{project.thesis}</p>
      {project.demo ? (
        <AppLink
          className="button button-primary case-hero-demo"
          to={demoPlayerPath(project.demo.experienceId)}
        >
          {copy.demo.openDemo}
          <ArrowUpRight size={17} aria-hidden="true" />
        </AppLink>
      ) : null}
      <dl className="case-meta">
        <div>
          <dt>{copy.caseStudy.time}</dt>
          <dd>{project.period}</dd>
        </div>
        <div>
          <dt>{copy.caseStudy.role}</dt>
          <dd>{project.role}</dd>
        </div>
        <div>
          <dt>{copy.caseStudy.status}</dt>
          <dd>{project.status}</dd>
        </div>
        <div>
          <dt>{copy.caseStudy.scope}</dt>
          <dd>{project.scope.slice(0, 2).join(' / ')}</dd>
        </div>
      </dl>
      {project.technologies?.length ? (
        <TagList tags={project.technologies} />
      ) : null}
    </header>
  )
}
