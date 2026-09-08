import { layeredAgentProject } from '../../data'
import { ArrowDown, ArrowUpRight, FileText } from 'lucide-react'
import { demoPlayerPath } from '../../data/demoExperiences'
import { getLocalizedProfile, getLocalizedProject } from '../../data/localized'
import { useLanguage } from '../../i18n/LanguageContext'
import { AppLink } from '../common/AppLink'
import { CompanionHomeSlot } from '../companion/RouteCompanion'

export function HomeHero() {
  const { language, copy } = useLanguage()
  const profile = getLocalizedProfile(language)
  const agentProject = getLocalizedProject(layeredAgentProject, language)

  return (
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-hero-content">
        <p className="eyebrow">{copy.home.eyebrow}</p>
        <h1 id="home-title">
          {profile.name}
          <span className="home-alias"> / azlar</span>
        </h1>
        <p className="home-role">
          {copy.home.titleLines.join(language === 'zh' ? '' : ' ')}
        </p>
        <p className="home-hero-copy">
          {copy.home.intro.replace('{name}', profile.name)}
        </p>
        <div className="hero-actions">
          <AppLink
            className="button button-primary"
            to={demoPlayerPath(agentProject.demo?.experienceId || 'layered-route-agent')}
          >
            {copy.home.openAgentDemo}{' '}
            <ArrowUpRight size={17} aria-hidden="true" />
          </AppLink>
          <AppLink className="button button-secondary" to="/#selected-work">
            {copy.home.viewSelectedCase}{' '}
            <ArrowDown size={17} aria-hidden="true" />
          </AppLink>
          <AppLink className="text-link hero-resume" to="/resume#pdf-preview">
            <FileText size={16} aria-hidden="true" /> {copy.home.downloadResume}
          </AppLink>
        </div>
        <p className="availability-line" title={profile.availability}>
          <span aria-hidden="true" />
          {copy.navigation.availability}
        </p>
      </div>
      <CompanionHomeSlot />
    </section>
  )
}
