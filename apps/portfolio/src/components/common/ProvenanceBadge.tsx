import type { ProjectProvenance } from '../../data'
import { useLanguage } from '../../i18n/LanguageContext'

function useProvenanceCopy() {
  const { copy } = useLanguage()
  return {
    production: { label: copy.provenance.production[0], description: copy.provenance.production[1] },
    'public-reconstruction': { label: copy.provenance.publicReconstruction[0], description: copy.provenance.publicReconstruction[1] },
    'personal-product': { label: copy.provenance.personalProduct[0], description: copy.provenance.personalProduct[1] },
    experiment: { label: copy.provenance.experiment[0], description: copy.provenance.experiment[1] },
  } satisfies Record<ProjectProvenance, { label: string; description: string }>
}

export function ProvenanceBadge({
  provenance,
  showDescription = false,
}: {
  provenance: ProjectProvenance
  showDescription?: boolean
}) {
  const provenanceCopy = useProvenanceCopy()
  const copy = provenanceCopy[provenance]
  return (
    <span className={`provenance provenance--${provenance}`}>
      <span>{copy.label}</span>
      {showDescription ? <small>{copy.description}</small> : null}
    </span>
  )
}

export function useProvenanceDescription(provenance: ProjectProvenance) {
  const provenanceCopy = useProvenanceCopy()
  return provenanceCopy[provenance].description
}
