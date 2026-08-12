import { profile } from '../../data/profile'

function toTelephoneHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer-heading">
        <div>
          <p className="eyebrow">CONTACT</p>
          <h2>联系方式</h2>
        </div>
        <p>{profile.availability}</p>
      </div>

      <address className="site-footer-contacts" aria-label="联系方式">
        <a href={toTelephoneHref(profile.contact.phone)}>
          <span>电话</span>
          <strong>{profile.contact.phone}</strong>
        </a>
        <a href={`mailto:${profile.contact.email}`}>
          <span>邮箱</span>
          <strong>{profile.contact.email}</strong>
        </a>
        <a href={profile.contact.github} target="_blank" rel="noreferrer">
          <span>GitHub</span>
          <strong>{profile.contact.github.replace(/^https?:\/\//, '')}</strong>
        </a>
      </address>

      <div className="site-footer-meta">
        <span>© {year} {profile.name}</span>
        <span>前端 · 全栈 · 产品</span>
      </div>
    </footer>
  )
}
