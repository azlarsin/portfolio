import type { PortfolioProject } from '../../data'

export function CaseFacts({ project }: { project: PortfolioProject }) {
  return (
    <dl className="case-facts">
      <div>
        <dt>结果</dt>
        <dd>{project.impact[0]}</dd>
      </div>
      <div>
        <dt>范围</dt>
        <dd>{project.scope.slice(0, 2).join('；')}</dd>
      </div>
      <div>
        <dt>职责</dt>
        <dd>{project.role}</dd>
      </div>
      <div>
        <dt>状态</dt>
        <dd>{project.status}</dd>
      </div>
    </dl>
  )
}
