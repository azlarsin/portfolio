const capabilities = [
  {
    title: '存量系统改造',
    text: '在业务持续运行的前提下完成系统拆分、页面迁移、兼容处理与线上问题修复。',
  },
  {
    title: '平台与业务 SDK',
    text: '将导航、权限、支付和数据页面等公共部分设计为宿主、独立应用或 SDK。',
  },
  {
    title: '复杂交互与状态恢复',
    text: '通过路由、页面层级、Modal 与状态恢复，保留复杂操作过程中的页面上下文。',
  },
  {
    title: '产品开发与发布',
    text: '覆盖需求分析、交互设计、客户端与服务端开发，以及部署、发布和后续迭代。',
  },
]

export function CapabilityList() {
  return (
    <section className="home-section capability-section" aria-labelledby="capability-title">
      <div className="section-heading">
        <p className="eyebrow">CORE CAPABILITIES</p>
        <h2 id="capability-title">主要工作范围</h2>
      </div>
      <div className="capability-list">
        {capabilities.map((capability, index) => (
          <article key={capability.title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{capability.title}</h3>
            <p>{capability.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
