import profileData from './profile.json'

export interface ProfileHighlightGroup {
  title: string
  bullets: string[]
}

export interface ProfileExperience {
  company: string
  role: string
  start: string
  end: string
  period: string
  overview: string
  highlights: ProfileHighlightGroup[]
}

export interface ProfileSkillGroup {
  label: string
  items: string[]
}

export interface Profile {
  name: string
  headline: string
  headlineEn: string
  summary: string[]
  availability: string
  strengths: string[]
  experience: ProfileExperience[]
  education: Array<{ degree: string; school: string; major: string }>
  skills: ProfileSkillGroup[]
  selfEvaluation: string[]
  contact: { github: string; email: string; phone: string }
}

export const profile = profileData as Profile

export function flattenExperienceHighlights(experience: ProfileExperience) {
  return experience.highlights.flatMap((group) => group.bullets)
}
