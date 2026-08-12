import type { DemoPosterVariant } from '../../data'

const posterContent: Record<DemoPosterVariant, { title: string; items: string[] }> = {
  'agent-console': {
    title: 'Plan → Execute → Verify',
    items: ['打开深层路由', '整理合成订单', '验证 URL 与页面层级'],
  },
  'prototype-editor': {
    title: 'Canvas + Layers + Interaction',
    items: ['绘制与图层', '状态与事件', 'Web / Electron 预览'],
  },
  'data-observatory': {
    title: '32:9 Data Observatory',
    items: ['场景切换', '筛选联动', '离线合成数据'],
  },
  'motion-lab': {
    title: 'SVG Spring Motion',
    items: ['数据重组', '连续扇区动画', '按住 S 慢速观察'],
  },
  'easing-picker': {
    title: 'Cubic Bézier Editor',
    items: ['拖动控制点', '实时曲线', '同步运动预览'],
  },
}

export function DemoPoster({ variant }: { variant: DemoPosterVariant }) {
  const content = posterContent[variant]
  return (
    <div className={`demo-poster demo-poster--${variant}`} role="img" aria-label={content.title}>
      <div className="poster-window-bar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="poster-content">
        <small>INTERACTIVE PREVIEW</small>
        <strong>{content.title}</strong>
        <ul>
          {content.items.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function EvidencePoster({ title }: { title: string }) {
  return (
    <div className="evidence-poster" role="img" aria-label={`${title} 的架构摘要`}>
      <span>ARCHITECTURE EVIDENCE</span>
      <div>
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <strong>{title}</strong>
    </div>
  )
}
