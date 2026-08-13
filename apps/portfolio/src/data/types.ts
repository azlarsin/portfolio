export type ProjectProvenance =
  | 'production'
  | 'public-reconstruction'
  | 'personal-product'
  | 'experiment'

export type ProjectTier = 'featured' | 'archive'

export interface CaseChapter {
  id: string
  title: string
  summary?: string
  paragraphs: string[]
  bullets?: string[]
  phase?: string
}

export type DemoPosterVariant =
  | 'agent-console'
  | 'prototype-editor'
  | 'data-observatory'
  | 'motion-lab'
  | 'easing-picker'

export interface DemoSpec {
  source: string
  title: string
  description: string
  provenanceLabel: string
  statusLabel: string
  toolbar?: string
  badge?: string
  height?: number
  posterVariant?: DemoPosterVariant
  ctaLabel?: string
  desktopPreferred?: boolean
  allow?: string
  sandbox?: string
}

export type VisualKind = 'html-frame' | 'elpis-product-flow'

export interface VisualSpec {
  id: string
  title: string
  description: string
  kind: VisualKind
  source?: string
  provenanceLabel?: string
}

export interface ProjectFact {
  label: string
  value: string
}

export interface ProjectLink {
  label: string
  url: string
  note?: string
}

export interface PortfolioProject {
  slug: string
  order: number
  tier: ProjectTier
  provenance: ProjectProvenance
  title: string
  shortTitle: string
  eyebrow: string
  summary?: string
  thesis: string
  period: string
  role: string
  status: string
  technologies?: string[]
  impact: string[]
  scope: string[]
  chapters: CaseChapter[]
  demo?: DemoSpec
  visuals?: VisualSpec[]
  facts?: ProjectFact[]
  links?: ProjectLink[]
  provenanceNote?: string
}

/** Localized project copy keeps stable identifiers, URLs, and assets from the base record. */
export type PortfolioProjectTranslation = Omit<
  PortfolioProject,
  'slug' | 'order' | 'tier' | 'provenance'
>

export interface ProjectNavigationItem {
  slug: string
  label: string
  eyebrow: string
  anchors: Array<{ id: string; label: string }>
}

export interface ProjectNavigationGroup {
  id: ProjectTier
  label: string
  items: ProjectNavigationItem[]
}
