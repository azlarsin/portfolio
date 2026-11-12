import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'
import { availablePoses, COMPANION_SELECT_EVENT, poseForStyle, poseLabel, type CompanionPose, type CompanionStyle } from './companionPoses'
import { CompanionPhoto } from './CompanionPhoto'

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
  if (query === 'photo' || query === '3d') return query
  if (query === 'svg') return 'photo'
  try { return localStorage.getItem(storageKey) === '3d' ? '3d' : 'photo' }
  catch { return 'photo' }
}
export function CompanionProvider({ children }: { children: ReactNode }) {
  const [style, updateStyle] = useState<CompanionStyle>(initialStyle)
  const [pose, setPose] = useState<CompanionPose>('snack')
  useEffect(() => { try { localStorage.setItem(storageKey, style) } catch { /* Storage may be disabled. */ } }, [style])
  const setStyle = (next: CompanionStyle) => {
    setPose(current => poseForStyle(current, next))
    updateStyle(next)
  }
  return <CompanionContext.Provider value={{ style, setStyle, pose, setPose }}>{children}</CompanionContext.Provider>
}
export function useCompanionStyle() { return useContext(CompanionContext) }

export function CompanionStyleSwitch({ compact = false }: { compact?: boolean }) {
  const { language } = useLanguage()
  const { style, setStyle, pose } = useCompanionStyle()
  const [pickerOpen, setPickerOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const poses = availablePoses(style)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (pickerOpen && !dialog.open) dialog.showModal()
    if (!pickerOpen && dialog.open) dialog.close()
  }, [pickerOpen])
  const photoLabel = language === 'zh' ? '照片形象' : 'Photo portrait'
  const threeLabel = language === 'zh' ? '3D 人物' : '3D character'
  const pickerLabel = language === 'zh' ? '选择动作' : 'Choose an action'
  return (
    <>
      <div className={`companion-style-switch${compact ? ' companion-style-switch--mobile' : ''}`} role="group" aria-label={language === 'zh' ? '人物风格' : 'Character style'}>
        <button type="button" aria-label={photoLabel} aria-pressed={style === 'photo'} onClick={() => setStyle('photo')}>
          {compact ? (language === 'zh' ? '照片' : 'Photo') : photoLabel}
        </button>
        <button type="button" aria-label={threeLabel} aria-pressed={style === '3d'} onClick={() => setStyle('3d')}>
          {compact ? '3D' : threeLabel}
        </button>
        <button type="button" aria-label={pickerLabel} onClick={() => setPickerOpen(true)}>
          {compact ? (language === 'zh' ? '动作' : 'Pose') : `${pickerLabel} ↗`}
        </button>
      </div>
      <dialog ref={dialogRef} className="companion-picker" aria-label={pickerLabel} onCancel={() => setPickerOpen(false)} onClose={() => setPickerOpen(false)} onClick={event => {
        if (event.target !== event.currentTarget) return
        const box = event.currentTarget.getBoundingClientRect()
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) setPickerOpen(false)
      }}>
        <header className="companion-picker-heading">
          <div><strong>{pickerLabel}</strong><p>{language === 'zh' ? `${poses.length} ${style === 'photo' ? '张照片' : '个动作'}，选一张试试` : `${poses.length} actions to choose from`}</p></div>
          <button type="button" className="icon-button" aria-label={language === 'zh' ? '关闭动作选择' : 'Close action picker'} onClick={() => setPickerOpen(false)}>×</button>
        </header>
        {pickerOpen && <div className="companion-picker-grid">
          {poses.map(option => <button key={option} type="button" className="companion-picker-option" aria-pressed={pose === option} onClick={() => {
            setPickerOpen(false)
            window.dispatchEvent(new CustomEvent(COMPANION_SELECT_EVENT, { detail: option }))
          }}><span className="companion-picker-preview"><CompanionPhoto pose={option} /></span><span>{poseLabel(option, language)}</span></button>)}
        </div>}
      </dialog>
    </>
  )
}
