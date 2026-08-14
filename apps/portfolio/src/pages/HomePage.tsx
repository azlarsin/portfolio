import { featuredProjects } from '../data'
import { CapabilityList } from '../components/home/CapabilityList'
import { FeaturedCase } from '../components/home/FeaturedCase'
import { HomeHero } from '../components/home/HomeHero'
import { getLocalizedProjects } from '../data/localized'
import { useLanguage } from '../i18n/LanguageContext'

export function HomePage() {
  const { language, copy } = useLanguage()
  const projects = getLocalizedProjects(featuredProjects, language)

  return (
    <main className="page page-home">
      <HomeHero />
      <CapabilityList />
      <section className="home-section selected-work" aria-labelledby="selected-work-title">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">{copy.home.selectedEyebrow}</p>
            <h2 id="selected-work-title">{copy.home.selectedTitle}</h2>
          </div>
          <p>{copy.home.selectedDescription}</p>
        </div>
        <div className="featured-work-list">
          {projects.map((project, index) => (
            <FeaturedCase
              key={project.slug}
              project={project}
              index={index + 1}
              primary={index === 0}
              spotlight={project.slug === 'baidu-map-workbench'}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
