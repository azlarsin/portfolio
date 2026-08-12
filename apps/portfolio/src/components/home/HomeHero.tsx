import { profile } from '../../data/profile'
import { resumeDocument } from '../../data/resume'
import { AppLink } from '../common/AppLink'

const facts = [
  ['10+ 年', '前端与全栈经验'],
  ['4-8 人', '长期带领前端团队'],
  ['2012—2026', '职业经历'],
  ['Web · 跨端 · 服务端', '技术覆盖'],
] as const

export function HomeHero() {
  return (
    <section className="home-hero" aria-labelledby="home-title">
      <p className="eyebrow">FRONTEND TECH LEAD · COMPLEX SYSTEMS · PRODUCT ENGINEERING</p>
      <h1 id="home-title">
        复杂前端系统的
        <br />
        架构、开发与交付
      </h1>
      <p className="home-hero-copy">
        我是{profile.name}，拥有 10+ 年前端与全栈经验，长期带领前端团队（4-8 人）。项目范围包括大型运营后台、业务 SDK、跨端应用与个人产品；主要负责核心开发、需求拆解、技术方案、Code Review 及线上疑难问题处理。
      </p>
      <div className="hero-actions">
        <AppLink className="button button-primary" to="/work/meican-platform">
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
