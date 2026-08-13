import { useLanguage } from '../../i18n/LanguageContext'

export function MeicanEvolutionVisual({ compact = false }: { compact?: boolean }) {
  const { copy } = useLanguage()

  return (
    <figure className={`system-evolution-visual ${compact ? 'is-compact' : ''}`}>
      <figcaption>
        <span>{copy.visuals.meican.title}</span>
        <small>{copy.visuals.meican.note}</small>
      </figcaption>
      <ol>
        {copy.visuals.meican.stages.map(([title, note], index) => (
          <li key={title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{title}</strong>
            <small>{note}</small>
          </li>
        ))}
      </ol>
    </figure>
  )
}
