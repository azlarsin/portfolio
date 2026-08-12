import { profile } from '../../data/profile'
import { resumeDocument } from '../../data/resume'
import { layeredAgentProject } from '../../data'
import { AppLink } from '../common/AppLink'

const facts = [
  ['10+ 年', '前端与全栈经验'],
  ['4-8 人', '长期带领前端团队'],
  ['2012—2026', '职业经历'],
  ['前后端 · 数据库 · 部署', '早期完整交付经历'],
] as const

export function HomeHero() {
  return (
    <section className="home-hero" aria-labelledby="home-title">
      <p className="eyebrow">FRONTEND TECH LEAD · FULL STACK DELIVERY · COMPLEX SYSTEMS</p>
      <h1 id="home-title">
        复杂系统的前端架构
        <br />
        与全栈交付
      </h1>
      <p className="home-hero-copy">
        我是{profile.name}，拥有 10+ 年前端与全栈经验，长期带领前端团队（4-8 人）。职业前期担任研发负责人和前后端主程，覆盖客户端、服务端、数据库与部署；近年聚焦大型运营后台、富文本编辑器、业务 SDK 与跨端应用的架构和交付。
      </p>
      <div className="hero-actions">
        <a
          className="button button-primary"
          href={layeredAgentProject.demo?.source}
          target="_blank"
          rel="noreferrer"
        >
          打开 Agent Demo <span aria-hidden="true">↗</span>
        </a>
        <AppLink className="button button-secondary" to="/work/meican-platform">
          查看精选案例
        </AppLink>
        <a
          className="button button-secondary"
          href={resumeDocument.source}
          download={resumeDocument.fileName}
        >
          下载简历
        </a>
      </div>
      <p className="availability-line">
        <span aria-hidden="true" />
        {profile.availability}
      </p>
      <dl className="fact-band">
        {facts.map(([value, label]) => (
          <div key={value}>
            <dt>{value}</dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
