import { layeredAgentProject } from '../../data'
import { getLocalizedProfile, getLocalizedProject } from '../../data/localized'
import { useLanguage } from '../../i18n/LanguageContext'
import { AppLink } from '../common/AppLink'

export function HomeHero() {
  const { language, copy } = useLanguage()
  const profile = getLocalizedProfile(language)
  const agentProject = getLocalizedProject(layeredAgentProject, language)

  return (
    <section className="home-hero" aria-labelledby="home-title">
      <p className="eyebrow">{copy.home.eyebrow}</p>
      <h1 id="home-title">
        {copy.home.titleLines[0]}
        <br />
        {copy.home.titleLines[1]}
      </h1>
      <p className="home-hero-copy">
        {copy.home.intro.replace('{name}', profile.name)}
      </p>
      <div className="hero-actions">
        <a
          className="button button-primary"
          href={agentProject.demo?.source}
          target="_blank"
          rel="noreferrer"
        >
          {copy.home.openAgentDemo} <span aria-hidden="true">↗</span>
        </a>
        <AppLink className="button button-secondary" to="/work/meican-platform">
          {copy.home.viewSelectedCase}
        </AppLink>
        <a className="button button-secondary" href="https://me.azlar.cc/resume">
          {copy.home.downloadResume}
        </a>
      </div>
      <p className="availability-line">
        <span aria-hidden="true" />
        {profile.availability}
      </p>
      <dl className="fact-band">
        {copy.home.facts.map(([value, label]) => (
          <div key={value}>
            <dt>{value}</dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
