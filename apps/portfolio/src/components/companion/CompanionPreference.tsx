import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import type { CompanionPose } from './companionPoses'

type CompanionStyle = 'photo' | 'svg' | '3d'
const storageKey = 'portfolio-companion-style'
const CompanionContext = createContext<{
  style: CompanionStyle
  setStyle: (style: CompanionStyle) => void
  pose: CompanionPose
  setPose: (pose: CompanionPose) => void
}>({ style: 'photo', setStyle: () => undefined, pose: 'snack', setPose: () => undefined })

function initialStyle(): CompanionStyle {
  if (typeof window === 'undefined') return 'photo'
  const query = new URLSearchParams(window.location.search).get('companion')
  if (query === 'photo' || query === 'svg' || query === '3d') return query
  try {
    const saved = localStorage.getItem(storageKey)
    return saved === 'photo' || saved === 'svg' || saved === '3d' ? saved : 'photo'
  } catch {
    return 'photo'
  }
}

export function CompanionProvider({ children }: { children: ReactNode }) {
  const [style, updateStyle] = useState<CompanionStyle>(initialStyle)
  const [pose, setPose] = useState<CompanionPose>('snack')
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, style)
    } catch {
      // A URL-selected version also persists when browser storage is available.
    }
  }, [style])
  const setStyle = (next: CompanionStyle) => {
    updateStyle(next)
  }
  return <CompanionContext.Provider value={{ style, setStyle, pose, setPose }}>{children}</CompanionContext.Provider>
}

export function useCompanionStyle() {
  return useContext(CompanionContext)
}

export function CompanionStyleSwitch({ compact = false }: { compact?: boolean }) {
  const { language } = useLanguage()
  const { style, setStyle } = useCompanionStyle()
  const photoLabel = language === 'zh' ? '照片形象' : 'Photo portrait'
  const svgLabel = language === 'zh' ? 'SVG 插画' : 'SVG illustration'
  const threeLabel = language === 'zh' ? '3D 人物' : '3D character'
  return (
    <div className={`companion-style-switch${compact ? ' companion-style-switch--mobile' : ''}`} role="group" aria-label={language === 'zh' ? '人物风格' : 'Character style'}>
      <button type="button" aria-label={photoLabel} aria-pressed={style === 'photo'} onClick={() => setStyle('photo')}>
        {compact ? (language === 'zh' ? '照片' : 'Photo') : photoLabel}
      </button>
      <button type="button" aria-label={svgLabel} aria-pressed={style === 'svg'} onClick={() => setStyle('svg')}>
        {compact ? 'SVG' : svgLabel}
      </button>
      <button type="button" aria-label={threeLabel} aria-pressed={style === '3d'} onClick={() => setStyle('3d')}>
        {compact ? '3D' : threeLabel}
      </button>
    </div>
  )
}
