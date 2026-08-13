import { getLocalizedProfile } from '../../data/localized'
import { useLanguage } from '../../i18n/LanguageContext'

function toTelephoneHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

export function SiteFooter() {
  const { copy, language } = useLanguage()
  const profile = getLocalizedProfile(language)
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer-heading">
        <div>
          <p className="eyebrow">{copy.footer.eyebrow}</p>
          <h2>{copy.footer.title}</h2>
        </div>
        <p>{profile.availability}</p>
      </div>

      <address className="site-footer-contacts" aria-label={copy.footer.label}>
        <a href={toTelephoneHref(profile.contact.phone)}>
          <span>{copy.footer.phone}</span>
          <strong>{profile.contact.phone}</strong>
        </a>
        <a href={`mailto:${profile.contact.email}`}>
          <span>{copy.footer.email}</span>
          <strong>{profile.contact.email}</strong>
        </a>
        <a href={profile.contact.github} target="_blank" rel="noreferrer">
          <span>GitHub</span>
          <strong>{profile.contact.github.replace(/^https?:\/\//, '')}</strong>
        </a>
      </address>

      <div className="site-footer-meta">
        <span>© {year} {profile.name}</span>
        <span>{copy.footer.specialties}</span>
      </div>
    </footer>
  )
}
