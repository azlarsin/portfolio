import { flattenExperienceHighlights, profile } from '../data/profile'

const growthTrack = [
  '供应商后台与数据',
  '前后端与服务器',
  '原型编辑器与桌面端',
  '地图数据工具与内容编辑器',
  '企业平台、SDK 与带团队',
  '个人产品与 Agent 实验',
]

export function ExperiencePage() {
  return (
    <main className="page page-standard experience-page">
      <header className="page-intro">
        <p className="eyebrow">EXPERIENCE</p>
        <h1>职业经历</h1>
        <p className="page-lead">
          职业经历覆盖供应商后台、旅游电商、原型编辑器、地图数据工具与企业平台。自 2012 年起持续从事一线开发，并在后续岗位中承担前端团队管理与技术决策。
        </p>
      </header>

      <ol className="growth-track" aria-label="职业成长主线">
        {growthTrack.map((step, index) => (
          <li key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {step}
          </li>
        ))}
      </ol>

      <section className="career-timeline" aria-label="工作经历时间线">
        {profile.experience.map((experience) => {
          const highlights = flattenExperienceHighlights(experience).slice(
            0,
            experience.company === '美餐网' ? 6 : 3,
          )
          return (
            <article key={`${experience.company}-${experience.start}`}>
              <div className="timeline-period">{experience.period}</div>
              <div className="timeline-marker" aria-hidden="true" />
              <div className="timeline-content">
                <header>
                  <div>
                    <h2>{experience.company}</h2>
                    <p>{experience.role}</p>
                  </div>
                </header>
                {experience.overview ? <p>{experience.overview}</p> : null}
                <ul>
                  {highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
