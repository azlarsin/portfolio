import type { DemoPosterVariant } from '../../data'
import { useLanguage } from '../../i18n/LanguageContext'

export function DemoPoster({ variant }: { variant: DemoPosterVariant }) {
  const { copy } = useLanguage()
  const contentByVariant = {
    'agent-console': copy.demo.posters.agent,
    'prototype-editor': copy.demo.posters.prototype,
    'data-observatory': copy.demo.posters.data,
    'motion-lab': copy.demo.posters.motion,
    'easing-picker': copy.demo.posters.easing,
    'irregular-geometry': copy.demo.posters.irregularGeometry,
  } satisfies Record<DemoPosterVariant, readonly [string, readonly string[]]>
  const [title, items] = contentByVariant[variant]
  return (
    <div className={`demo-poster demo-poster--${variant}`} role="img" aria-label={title}>
      <div className="poster-window-bar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="poster-content">
        <small>INTERACTIVE PREVIEW</small>
        <strong>{title}</strong>
        <ul>
          {items.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function EvidencePoster({ title }: { title: string }) {
  const { language, copy } = useLanguage()
  return (
    <div
      className="evidence-poster"
      role="img"
      aria-label={
        language === 'zh'
          ? `${title}${copy.demo.evidenceAriaSuffix}`
          : `${title}${copy.demo.evidenceAriaSuffix}`
      }
    >
      <span>ARCHITECTURE EVIDENCE</span>
      <div>
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <strong>{title}</strong>
    </div>
  )
}
