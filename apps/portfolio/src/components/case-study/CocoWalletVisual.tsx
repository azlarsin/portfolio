const layers = [
  ['Mobile Wallet', '助记词 · 资产 · 转账 · 扫码'],
  ['Authorization', '操作摘要 · PIN / 指纹 · 结果回传'],
  ['DApp Container', 'Provider 注入 · WebView Bridge'],
] as const

const networks = ['ETH', 'BCH', 'WHC']

export function CocoWalletVisual() {
  return (
    <figure className="wallet-architecture-visual">
      <figcaption>
        <span>移动钱包与 DApp 授权链路</span>
        <small>Architecture illustration · 非实际钱包界面</small>
      </figcaption>
      <div className="wallet-architecture-body">
        <div className="wallet-device" aria-label="Coco Wallet 移动端结构">
          <div className="wallet-device-bar">
            <span>Coco Wallet</span>
            <small>React Native · iOS / Android</small>
          </div>
          <ol>
            {layers.map(([title, note], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{title}</strong>
                  <small>{note}</small>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="wallet-network-column">
          <small>NETWORK CONTEXT</small>
          <div>
            {networks.map((network) => (
              <span key={network}>{network}</span>
            ))}
          </div>
          <p>敏感操作返回钱包确认后再继续，不在公开页面连接旧服务。</p>
        </div>
      </div>
    </figure>
  )
}
