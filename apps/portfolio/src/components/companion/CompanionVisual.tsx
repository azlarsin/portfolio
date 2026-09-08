import { useEffect, useRef, useState } from 'react'
import { CompanionPortrait } from './CompanionPortrait'
import { CompanionPhoto } from './CompanionPhoto'
import { useCompanionStyle } from './CompanionPreference'
import { companionPoses } from './companionPoses'

/** The vector renders immediately; the optional WebGL scene loads in its own chunk. */
export function CompanionVisual() {
  const { style, pose } = useCompanionStyle()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(false)
    if (style !== '3d') return
    let disposed = false
    let cleanup: (() => void) | undefined
    const canvas = canvasRef.current
    const host = canvas?.closest<HTMLButtonElement>('.route-companion')
    if (!canvas || !host) return

    void import('./companionScene').then(({ createCompanionScene }) => {
      if (disposed) return
      const scene = createCompanionScene(canvas, host, () => {
        if (!disposed) setReady(false)
      })
      cleanup = scene.dispose
      setReady(true)
    }).catch(() => {
      // Unsupported WebGL, a blocked chunk, or a lost context keeps the SVG usable.
      if (!disposed) setReady(false)
    })

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [style])

  return (
    <span className="companion-visual" data-style={style} data-pose={pose} data-renderer={style === 'photo' ? 'photo' : ready && style === '3d' ? 'webgl' : 'svg'} aria-hidden="true">
      {companionPoses.map((variant) => (
        <span key={variant} className="companion-pose-view" data-pose={variant} hidden={variant !== pose}>
          {style === 'photo' ? <CompanionPhoto pose={variant} /> : <CompanionPortrait pose={variant} />}
        </span>
      ))}
      {style === '3d' ? <canvas ref={canvasRef} className="companion-canvas" aria-hidden="true" /> : null}
    </span>
  )
}
