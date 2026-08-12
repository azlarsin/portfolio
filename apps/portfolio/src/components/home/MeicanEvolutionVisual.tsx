const stages = [
  ['集中式后台', '统一开发 · 统一发布'],
  ['统一宿主', '导航 · 权限 · 装载'],
  ['独立业务应用', '独立构建 · 发布 · 回滚'],
  ['嵌入页面 / SDK', '同一页面接入多个后台'],
  ['跨端交易', 'Web · 小程序共用接口'],
  ['业财 / 设计系统', '沿用页面和组件约定'],
] as const

export function MeicanEvolutionVisual({ compact = false }: { compact?: boolean }) {
  return (
    <figure className={`system-evolution-visual ${compact ? 'is-compact' : ''}`}>
      <figcaption>
        <span>架构变化示意</span>
        <small>Sanitized architecture overview</small>
      </figcaption>
      <ol>
        {stages.map(([title, note], index) => (
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
