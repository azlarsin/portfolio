import { featuredProjects } from '../data'
import { CapabilityList } from '../components/home/CapabilityList'
import { FeaturedCase } from '../components/home/FeaturedCase'
import { HomeHero } from '../components/home/HomeHero'
import { ProjectPlayground } from '../components/home/ProjectPlayground'
import { getLocalizedProjects } from '../data/localized'
import { useLanguage } from '../i18n/LanguageContext'

export function HomePage() {
  const { language, copy } = useLanguage()
  const projects = getLocalizedProjects(featuredProjects, language)

  return (
    <main className="page page-home">
      <HomeHero />
      <section
        id="selected-work"
        className="home-section selected-work"
        aria-labelledby="selected-work-title"
      >
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">{copy.home.selectedEyebrow}</p>
            <h2 id="selected-work-title">{copy.home.selectedTitle}</h2>
          </div>
          <span className="section-count">01 — 04</span>
        </div>
        <div className="featured-work-list">
          {projects.map((project, index) => (
            <FeaturedCase
              key={project.slug}
              project={project}
              index={index + 1}
            />
          ))}
        </div>
      </section>
      <ProjectPlayground />
      <CapabilityList />
    </main>
  )
}
