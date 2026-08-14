import { useLanguage } from '../../i18n/LanguageContext'

export function BaiduMapWorkbenchVisual({ compact = false }: { compact?: boolean }) {
  const { copy } = useLanguage()
  const visual = copy.visuals.mapWorkbench

  return (
    <figure className={`map-workbench-visual ${compact ? 'is-compact' : ''}`}>
      <figcaption>
        <span>{visual.title}</span>
        <small>{visual.note}</small>
      </figcaption>

      <div className="map-workbench-tracks">
        <section>
          <header>
            <span>01</span>
            <div>
              <strong>{visual.renderingTitle}</strong>
              <small>{visual.renderingNote}</small>
            </div>
          </header>
          <ol className="map-rendering-flow">
            {visual.renderingFlow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <div className="map-feature-cloud" aria-label={visual.renderingTitle}>
            {visual.renderingFeatures.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section>
          <header>
            <span>02</span>
            <div>
              <strong>{visual.dataTitle}</strong>
              <small>{visual.dataNote}</small>
            </div>
          </header>
          <ol className="map-data-flow">
            {visual.dataFlow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <div className="map-data-stack" aria-label={visual.dataTitle}>
            {visual.dataStack.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>
      </div>

      <p className="map-workbench-team">
        <span aria-hidden="true" />
        {visual.team}
      </p>
    </figure>
  )
}
