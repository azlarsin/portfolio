import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'

type ThemePreference = 'system' | 'light' | 'dark'

const storageKey = 'portfolio-theme'
const preferenceEvent = 'portfolio-theme-change'
function readPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = window.localStorage.getItem(storageKey)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
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
  const themeColor = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  )
  if (themeColor)
    themeColor.content = resolved === 'dark' ? '#151716' : '#fcfcfa'
}

export function ThemeToggle() {
  const { copy } = useLanguage()
  const [preference, setPreference] = useState<ThemePreference>(readPreference)

  useEffect(() => {
    const syncLocal = (event: Event) => {
      setPreference((event as CustomEvent<ThemePreference>).detail)
    }
    const syncStorage = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return
      setPreference(
        event.newValue === 'light' || event.newValue === 'dark'
          ? event.newValue
          : 'system',
      )
    }
    window.addEventListener(preferenceEvent, syncLocal)
    window.addEventListener('storage', syncStorage)
    return () => {
      window.removeEventListener(preferenceEvent, syncLocal)
      window.removeEventListener('storage', syncStorage)
    }
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => applyTheme(preference)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [preference])

  const setTheme = (next: ThemePreference) => {
    setPreference(next)
    try {
      if (next === 'system') window.localStorage.removeItem(storageKey)
      else window.localStorage.setItem(storageKey, next)
    } catch {
      // The in-memory preference remains usable when storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent(preferenceEvent, { detail: next }))
  }

  return (
    <div className="theme-toggle" role="group" aria-label={copy.theme.label}>
      {(['system', 'light', 'dark'] as ThemePreference[]).map((theme) => {
        const Icon = { system: Monitor, light: Sun, dark: Moon }[theme]
        return (
          <button
            key={theme}
            type="button"
            aria-pressed={preference === theme}
            aria-label={copy.theme[theme]}
            title={copy.theme[theme]}
            onClick={() => setTheme(theme)}
          >
            <Icon size={16} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
