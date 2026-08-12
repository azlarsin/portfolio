import { useEffect, useState } from 'react'

type ThemePreference = 'system' | 'light' | 'dark'

const storageKey = 'portfolio-theme'
const labels: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
}

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
    <div className="theme-toggle" aria-label="颜色主题">
      {(Object.keys(labels) as ThemePreference[]).map((theme) => (
        <button
          key={theme}
          type="button"
          aria-pressed={preference === theme}
          onClick={() => setTheme(theme)}
        >
          {labels[theme]}
        </button>
      ))}
    </div>
  )
}
