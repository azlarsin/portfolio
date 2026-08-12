import { AppLink } from '../components/common/AppLink'

export function NotFoundPage({ pathname }: { pathname: string }) {
  return (
    <main className="page page-standard not-found-page">
      <p className="eyebrow">404 · NOT FOUND</p>
      <h1>这个页面不存在。</h1>
      <p>
        没有找到 <code>{pathname}</code>。你可以回到首页，或从导航继续浏览。
      </p>
      <AppLink className="button button-primary" to="/">
        返回首页
      </AppLink>
    </main>
  )
}
