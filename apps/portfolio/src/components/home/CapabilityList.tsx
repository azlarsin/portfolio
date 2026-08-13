import { useLanguage } from '../../i18n/LanguageContext'

export function CapabilityList() {
  const { copy } = useLanguage()

  return (
    <section className="home-section capability-section" aria-labelledby="capability-title">
      <div className="section-heading">
        <p className="eyebrow">{copy.home.capabilityEyebrow}</p>
        <h2 id="capability-title">{copy.home.capabilityTitle}</h2>
      </div>
      <div className="capability-list">
        {copy.home.capabilities.map(([title, text], index) => (
          <article key={title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
