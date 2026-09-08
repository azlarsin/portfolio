import { useEffect, useRef, useState } from 'react'
import { CompanionPortrait } from './CompanionPortrait'
import { CompanionPhoto } from './CompanionPhoto'
import { useCompanionStyle } from './CompanionPreference'

/** The vector renders immediately; the optional WebGL scene loads in its own chunk. */
export function CompanionVisual() {
  const { style } = useCompanionStyle()
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
    <span className="companion-visual" data-style={style} data-renderer={style === 'photo' ? 'photo' : ready && style === '3d' ? 'webgl' : 'svg'} aria-hidden="true">
      {style === 'photo' ? <CompanionPhoto /> : <CompanionPortrait />}
      {style === '3d' ? <canvas ref={canvasRef} className="companion-canvas" aria-hidden="true" /> : null}
    </span>
  )
}
