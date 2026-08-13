import { flattenExperienceHighlights } from '../data/profile'
import { AppLink } from '../components/common/AppLink'
import { getLocalizedProfile } from '../data/localized'
import { useLanguage } from '../i18n/LanguageContext'

export function ExperiencePage() {
  const { language, copy } = useLanguage()
  const profile = getLocalizedProfile(language)

  return (
    <main className="page page-standard experience-page">
      <header className="page-intro">
        <p className="eyebrow">{copy.experience.eyebrow}</p>
        <h1>{copy.experience.title}</h1>
        <p className="page-lead">{copy.experience.lead}</p>
      </header>

      <ol className="growth-track" aria-label={copy.experience.growthLabel}>
        {copy.experience.growth.map(([period, title, text]) => (
          <li key={period}>
            <span>{period}</span>
            <strong>{title}</strong>
            <p>{text}</p>
          </li>
        ))}
      </ol>

      <section className="career-timeline" aria-label={copy.experience.timelineLabel}>
        {profile.experience.map((experience, index) => {
          const highlights = flattenExperienceHighlights(experience).slice(
            0,
            index === 0
              ? 6
              : index === 1
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
                {index === 1 ? (
                  <AppLink className="timeline-case-link" to="/work/baijiahao-editor">
                    {copy.experience.viewEditorCase} <span aria-hidden="true">→</span>
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
