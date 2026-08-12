const capabilities = [
  {
    title: '存量系统改造',
    text: '在业务持续运行的前提下完成后台拆分、富文本编辑器梳理、页面迁移与兼容处理。',
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
    title: '前后端完整交付',
    text: '职业前期完成 Web / 客户端、PHP 服务、Python 数据处理、MySQL / Redis 与服务器部署维护。',
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
