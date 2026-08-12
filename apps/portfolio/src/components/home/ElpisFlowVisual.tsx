const flow = ['Capture', 'Tell the story', 'Organize', 'Enhance', 'Compare', 'Sync / Export']

export function ElpisFlowVisual({ compact = false }: { compact?: boolean }) {
  return (
    <figure className={`elpis-flow-visual ${compact ? 'is-compact' : ''}`}>
      <figcaption>
        <span>产品功能流程示意</span>
        <small>Product flow illustration · 非实际 App 截图</small>
      </figcaption>
      <div className="elpis-phones" aria-label="Elpis 抽象功能界面">
        <div className="phone-frame phone-timeline">
          <span>Timeline</span>
          <i />
          <i />
          <i />
        </div>
        <div className="phone-frame phone-detail">
          <span>Artwork Detail</span>
          <div className="artwork-shape" aria-hidden="true" />
          <small>Story · Date · Child</small>
        </div>
        <div className="phone-frame phone-compare">
          <span>Before / After</span>
          <div><i /><i /></div>
          <small>Original stays intact</small>
        </div>
      </div>
      <ol aria-label="Elpis 产品流程">
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
