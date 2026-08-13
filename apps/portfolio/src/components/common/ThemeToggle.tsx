import { useEffect, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'

type ThemePreference = 'system' | 'light' | 'dark'

const storageKey = 'portfolio-theme'
function readPreference(): ThemePreference {
  const stored = window.localStorage.getItem(storageKey)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

function applyTheme(preference: ThemePreference) {
  const resolved =
    preference === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preference
  document.documentElement.dataset.theme = resolved
  document.documentElement.dataset.themePreference = preference
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (themeColor) themeColor.content = resolved === 'dark' ? '#111318' : '#f5f6f8'
}

export function ThemeToggle() {
  const { copy } = useLanguage()
  const [preference, setPreference] = useState<ThemePreference>(readPreference)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => applyTheme(preference)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [preference])

  const setTheme = (next: ThemePreference) => {
    setPreference(next)
    if (next === 'system') window.localStorage.removeItem(storageKey)
    else window.localStorage.setItem(storageKey, next)
  }

  return (
    <div className="theme-toggle" aria-label={copy.theme.label}>
      {(['system', 'light', 'dark'] as ThemePreference[]).map((theme) => (
        <button
          key={theme}
          type="button"
          aria-pressed={preference === theme}
          onClick={() => setTheme(theme)}
        >
          {copy.theme[theme]}
        </button>
      ))}
    </div>
  )
}
