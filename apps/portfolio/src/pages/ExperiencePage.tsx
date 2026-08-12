import { flattenExperienceHighlights, profile } from '../data/profile'
import { AppLink } from '../components/common/AppLink'

const growthTrack = [
  {
    period: '2012—2017',
    title: '前后端完整交付',
    text: '供应商后台、React H5、Yii2 / PHP 服务、MySQL / Redis 与服务器部署。',
  },
  {
    period: '2017—2019',
    title: '客户端与数据服务',
    text: '桌面编辑器、PHP 指标 API、Python 批处理、空间数据工具与 UEditor 演进。',
  },
  {
    period: '2019—2026',
    title: '复杂前端与团队管理',
    text: '企业后台、业务 SDK、跨端应用，以及 4-8 人前端团队管理。',
  },
]

export function ExperiencePage() {
  return (
    <main className="page page-standard experience-page">
      <header className="page-intro">
        <p className="eyebrow">EXPERIENCE</p>
        <h1>职业经历</h1>
        <p className="page-lead">
          在 2019 年进入美餐前，已经连续承担供应商后台与数据、旅游电商前后端、桌面应用服务端，以及百度空间数据 API 与批处理。后续以复杂前端和团队负责人为主，同时保留从接口、数据库到部署排查的完整交付能力。
        </p>
      </header>

      <ol className="growth-track" aria-label="职业成长主线">
        {growthTrack.map((step) => (
          <li key={step.period}>
            <span>{step.period}</span>
            <strong>{step.title}</strong>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>

      <section className="career-timeline" aria-label="工作经历时间线">
        {profile.experience.map((experience) => {
          const highlights = flattenExperienceHighlights(experience).slice(
            0,
            experience.company === '美餐网'
              ? 6
              : experience.company === '百度'
                ? 4
                : 3,
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
                {experience.company === '百度' ? (
                  <AppLink className="timeline-case-link" to="/work/baijiahao-editor">
                    查看百家号编辑器案例 <span aria-hidden="true">→</span>
                  </AppLink>
                ) : null}
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
