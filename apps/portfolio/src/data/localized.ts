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
      ? {
          ...base.demo,
          ...translation.demo,
          experienceId: base.demo.experienceId,
          source: base.demo.source,
        }
      : base.demo || translation.demo
  const visuals = base.visuals?.map((sourceVisual) => {
    const visual = translation.visuals?.find((candidate) => candidate.id === sourceVisual.id)
    return visual
      ? {
          ...sourceVisual,
          ...visual,
          id: sourceVisual.id,
          kind: sourceVisual.kind,
          experienceId: sourceVisual.experienceId,
          source: sourceVisual.source,
        }
      : sourceVisual
  }) || translation.visuals
  const links = base.links?.map((baseLink, index) => ({
    ...baseLink,
    ...translation.links?.[index],
    url: baseLink.url,
  })) || translation.links
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
    provenanceDisplay: translation.provenanceDisplay || base.provenanceDisplay,
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
