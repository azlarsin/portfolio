const phases = [
  {
    index: '01',
    title: '业务内深度定制',
    note: 'UEditor 1.4.3 · 富文本插件 · 历史样式',
  },
  {
    index: '02',
    title: '迁移与梳理',
    note: '裁剪依赖 · 隔离内核 · 收紧插件边界',
  },
  {
    index: '03',
    title: '内部复用包',
    note: 'React import · Browser script · Plugin build',
  },
] as const

const contracts = ['BJH_UE', 'Driver', 'BasePlugin', 'Box', 'Content Parser']

export function BaijiahaoEditorVisual({ compact = false }: { compact?: boolean }) {
  return (
    <figure className={`editor-evolution-visual ${compact ? 'is-compact' : ''}`}>
      <figcaption>
        <span>编辑器演进与复用边界</span>
        <small>Sanitized evolution reconstructed from source history</small>
      </figcaption>
      <ol className="editor-evolution-phases">
        {phases.map((phase) => (
          <li key={phase.index}>
            <span>{phase.index}</span>
            <strong>{phase.title}</strong>
            <small>{phase.note}</small>
          </li>
        ))}
      </ol>
      <div className="editor-contracts" aria-label="独立编辑器包的主要边界">
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
