import { archiveProjects } from '../data'
import { AppLink } from '../components/common/AppLink'
import { ProvenanceBadge } from '../components/common/ProvenanceBadge'
import { TagList } from '../components/common/TagList'

export function ArchivePage() {
  return (
    <main className="page page-standard archive-page">
      <header className="page-intro">
        <p className="eyebrow">PERSONAL PROJECTS</p>
        <h1>个人项目集</h1>
        <p className="page-lead">
          收录个人产品、独立交付与早期技术实验。每个项目均说明项目背景、本人职责、实现范围与公开内容边界。
        </p>
      </header>

      <div className="archive-list">
        {archiveProjects.map((project) => (
          <article key={project.slug}>
            <div className="archive-year">{project.period.split('·')[0].trim()}</div>
            <div className="archive-copy">
              <ProvenanceBadge provenance={project.provenance} />
              <h2>{project.title}</h2>
              <p>{project.summary || project.thesis}</p>
              <TagList tags={(project.technologies || []).slice(0, 5)} />
              <div className="archive-actions">
                <AppLink className="text-link" to={`/archive/${project.slug}`}>
                  查看项目 <span aria-hidden="true">→</span>
                </AppLink>
                {project.demo ? <span className="demo-state">{project.demo.statusLabel}</span> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
