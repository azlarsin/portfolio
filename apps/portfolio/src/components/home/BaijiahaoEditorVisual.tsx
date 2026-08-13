import { useLanguage } from '../../i18n/LanguageContext'

const contracts = ['BJH_UE', 'Driver', 'BasePlugin', 'Box', 'Content Parser']

export function BaijiahaoEditorVisual({ compact = false }: { compact?: boolean }) {
  const { copy } = useLanguage()

  return (
    <figure className={`editor-evolution-visual ${compact ? 'is-compact' : ''}`}>
      <figcaption>
        <span>{copy.visuals.editor.title}</span>
        <small>{copy.visuals.editor.note}</small>
      </figcaption>
      <ol className="editor-evolution-phases">
        {copy.visuals.editor.phases.map(([index, title, note]) => (
          <li key={index}>
            <span>{index}</span>
            <strong>{title}</strong>
            <small>{note}</small>
          </li>
        ))}
      </ol>
      <div className="editor-contracts" aria-label={copy.visuals.editor.packageLabel}>
        <small>@baidu/bjh-editor</small>
        <div>
          {contracts.map((contract) => (
            <span key={contract}>{contract}</span>
          ))}
        </div>
      </div>
    </figure>
  )
}
