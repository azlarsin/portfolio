import { useLanguage } from '../../i18n/LanguageContext'

const networks = ['ETH', 'BCH', 'WHC']

export function CocoWalletVisual() {
  const { copy } = useLanguage()

  return (
    <figure className="wallet-architecture-visual">
      <figcaption>
        <span>{copy.visuals.wallet.title}</span>
        <small>{copy.visuals.wallet.note}</small>
      </figcaption>
      <div className="wallet-architecture-body">
        <div className="wallet-device" aria-label={copy.visuals.wallet.deviceLabel}>
          <div className="wallet-device-bar">
            <span>Coco Wallet</span>
            <small>React Native · iOS / Android</small>
          </div>
          <ol>
            {copy.visuals.wallet.layers.map(([title, note], index) => (
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
          <p>{copy.visuals.wallet.boundary}</p>
        </div>
      </div>
    </figure>
  )
}
