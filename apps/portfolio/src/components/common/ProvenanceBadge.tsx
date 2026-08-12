import type { ProjectProvenance } from '../../data'

const provenanceCopy: Record<
  ProjectProvenance,
  { label: string; description: string }
> = {
  production: {
    label: 'PRODUCTION SYSTEM',
    description: '来自真实生产项目，内容已脱敏',
  },
  'public-reconstruction': {
    label: 'PUBLIC RECONSTRUCTION / RESEARCH',
    description: '基于公开代码重建的个人研究',
  },
  'personal-product': {
    label: 'PERSONAL PRODUCT',
    description: '独立设计与开发的个人产品',
  },
  experiment: {
    label: 'EXPERIMENT / ARCHIVE',
    description: '个人实验或早期作品',
  },
}

export function ProvenanceBadge({
  provenance,
  showDescription = false,
}: {
  provenance: ProjectProvenance
  showDescription?: boolean
}) {
  const copy = provenanceCopy[provenance]
  return (
    <span className={`provenance provenance--${provenance}`}>
      <span>{copy.label}</span>
      {showDescription ? <small>{copy.description}</small> : null}
    </span>
  )
}

export function getProvenanceDescription(provenance: ProjectProvenance) {
  return provenanceCopy[provenance].description
}
