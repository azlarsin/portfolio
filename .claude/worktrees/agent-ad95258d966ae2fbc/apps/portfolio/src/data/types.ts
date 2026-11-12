export type ProjectProvenance =
  | 'production'
  | 'public-reconstruction'
  | 'personal-product'
  | 'experiment'

export type ProjectTier = 'featured' | 'archive'

export interface ProjectProvenanceDisplay {
  label: string
  description: string
}

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
  | 'irregular-geometry'

/** Finite, trusted player entries. Runtime data resolves these IDs through the registry only. */
export type DemoExperienceId =
  | 'layered-route-agent'
  | 'layered-agent-action-graph'
  | 'poke-prototype-editor'
  | 'dataview-observatory'
  | 'turntable-motion-lab'
  | 'bezier-easing-picker'
  | 'irregular-shape-arrangement'

export interface DemoSpec {
  experienceId: DemoExperienceId
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
}

export type VisualKind = 'html-frame' | 'elpis-product-flow'

export interface VisualSpec {
  id: string
  title: string
  description: string
  kind: VisualKind
  experienceId?: DemoExperienceId
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
  provenanceDisplay?: ProjectProvenanceDisplay
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
