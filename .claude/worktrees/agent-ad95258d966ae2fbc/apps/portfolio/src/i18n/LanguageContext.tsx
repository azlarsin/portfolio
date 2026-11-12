import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { siteCopy } from './copy'

export type Language = 'zh' | 'en'

export const languageStorageKey = 'portfolio-language'

export function resolvePreferredLanguage({
  stored,
  browserLanguages = [],
}: {
  stored?: string | null
  browserLanguages?: readonly string[]
}): Language {
  if (stored === 'zh' || stored === 'en') return stored
  return browserLanguages.some((language) => language.toLowerCase().startsWith('zh'))
    ? 'zh'
    : 'en'
}

function readInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'zh'

  try {
    return resolvePreferredLanguage({
      stored: window.localStorage.getItem(languageStorageKey),
      browserLanguages: window.navigator.languages,
    })
  } catch {
    return resolvePreferredLanguage({ browserLanguages: window.navigator.languages })
  }
}

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  copy: (typeof siteCopy)[Language]
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    document.documentElement.dataset.language = language
  }, [language])

  useEffect(() => {
    const syncLanguage = (event: StorageEvent) => {
      if (event.key !== languageStorageKey) return
      setLanguageState(
        resolvePreferredLanguage({
          stored: event.newValue,
          browserLanguages: window.navigator.languages,
        }),
      )
    }
    window.addEventListener('storage', syncLanguage)
    return () => window.removeEventListener('storage', syncLanguage)
  }, [])

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage)
    try {
      window.localStorage.setItem(languageStorageKey, nextLanguage)
    } catch {
      // The in-memory choice still works when storage is unavailable.
    }
  }

  const value = useMemo(
    () => ({ language, setLanguage, copy: siteCopy[language] }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
