import { featuredProjects } from '../data'
import { CapabilityList } from '../components/home/CapabilityList'
import { FeaturedCase } from '../components/home/FeaturedCase'
import { HomeHero } from '../components/home/HomeHero'

export function HomePage() {
  return (
    <main className="page page-home">
      <HomeHero />
      <CapabilityList />
      <section className="home-section selected-work" aria-labelledby="selected-work-title">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">SELECTED WORK</p>
            <h2 id="selected-work-title">存量系统演进与公开研究案例</h2>
          </div>
          <p>企业后台与百家号编辑器来自真实生产项目；Agent 案例基于公开代码与合成数据。跨端钱包、个人产品和早期作品收录于个人项目集。</p>
        </div>
        <div className="featured-work-list">
          {featuredProjects.map((project, index) => (
            <FeaturedCase
              key={project.slug}
              project={project}
              index={index + 1}
              primary={index === 0}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
