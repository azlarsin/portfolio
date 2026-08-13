import { AppLink } from '../components/common/AppLink'
import { useLanguage } from '../i18n/LanguageContext'

export function NotFoundPage({ pathname }: { pathname: string }) {
  const { copy } = useLanguage()

  return (
    <main className="page page-standard not-found-page">
      <p className="eyebrow">404 · NOT FOUND</p>
      <h1>{copy.notFound.title}</h1>
      <p>
        {copy.notFound.beforePath} <code>{pathname}</code>{copy.notFound.afterPath}
      </p>
      <AppLink className="button button-primary" to="/">
        {copy.notFound.home}
      </AppLink>
    </main>
  )
}
