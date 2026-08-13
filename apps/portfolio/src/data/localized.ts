import type { Language } from '../i18n/LanguageContext'
import { portfolioProjects } from './index'
import { profile, mergeProfileTranslation, type Profile } from './profile'
import { profileEn } from './translations/profile.en'
import { projectTranslationsEn } from './translations/projects.en'
import type { PortfolioProject, PortfolioProjectTranslation } from './types'

export function mergeProjectTranslation(
  base: PortfolioProject,
  translation: PortfolioProjectTranslation,
): PortfolioProject {
  const demo =
    base.demo && translation.demo
      ? { ...base.demo, ...translation.demo, source: base.demo.source }
      : translation.demo || base.demo
  const visuals = translation.visuals?.map((visual) => {
    const sourceVisual = base.visuals?.find((candidate) => candidate.id === visual.id)
    return sourceVisual
      ? {
          ...sourceVisual,
          ...visual,
          id: sourceVisual.id,
          kind: sourceVisual.kind,
          source: sourceVisual.source,
        }
      : visual
  }) || base.visuals
  const links = translation.links?.map((link, index) => ({
    ...base.links?.[index],
    ...link,
    url: base.links?.[index]?.url || link.url,
  })) || base.links
  const chapters = translation.chapters.map((chapter, index) => ({
    ...chapter,
    id: base.chapters[index]?.id || chapter.id,
  }))

  return {
    ...base,
    ...translation,
    slug: base.slug,
    order: base.order,
    tier: base.tier,
    provenance: base.provenance,
    demo,
    visuals,
    links,
    chapters,
  }
}

const englishProjects = new Map(
  portfolioProjects.map((project) => {
    const translation = projectTranslationsEn[project.slug]
    if (!translation) throw new Error(`Missing English translation for ${project.slug}`)
    return [project.slug, mergeProjectTranslation(project, translation)] as const
  }),
)

export function getLocalizedProject(
  project: PortfolioProject,
  language: Language,
): PortfolioProject {
  return language === 'en' ? englishProjects.get(project.slug) || project : project
}

export function getLocalizedProjects(
  projects: readonly PortfolioProject[],
  language: Language,
): PortfolioProject[] {
  return projects.map((project) => getLocalizedProject(project, language))
}

export function getLocalizedProfile(language: Language): Profile {
  return language === 'en' ? mergeProfileTranslation(profile, profileEn) : profile
}
