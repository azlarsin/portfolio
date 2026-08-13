const flow = ['Capture', 'Tell the story', 'Organize', 'Enhance', 'Compare', 'Sync / Export']
import { useLanguage } from '../../i18n/LanguageContext'

export function ElpisFlowVisual({ compact = false }: { compact?: boolean }) {
  const { copy } = useLanguage()

  return (
    <figure className={`elpis-flow-visual ${compact ? 'is-compact' : ''}`}>
      <figcaption>
        <span>{copy.visuals.elpis.title}</span>
        <small>{copy.visuals.elpis.note}</small>
      </figcaption>
      <div className="elpis-phones" aria-label={copy.visuals.elpis.interfaceLabel}>
        <div className="phone-frame phone-timeline">
          <span>Timeline</span>
          <i />
          <i />
          <i />
        </div>
        <div className="phone-frame phone-detail">
          <span>Artwork Detail</span>
          <div className="artwork-shape" aria-hidden="true" />
          <small>{copy.visuals.elpis.story}</small>
        </div>
        <div className="phone-frame phone-compare">
          <span>Before / After</span>
          <div><i /><i /></div>
          <small>{copy.visuals.elpis.original}</small>
        </div>
      </div>
      <ol aria-label={copy.visuals.elpis.flowLabel}>
        {flow.map((step, index) => (
          <li key={step}>
            <span>{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </figure>
  )
}
