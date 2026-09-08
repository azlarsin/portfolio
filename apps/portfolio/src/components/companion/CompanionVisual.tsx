import { useEffect, useRef, useState } from 'react'
import { CompanionPhoto } from './CompanionPhoto'
import { useCompanionStyle } from './CompanionPreference'

/** A photo is always available, including while the optional 3D scene loads. */
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
      // Unsupported WebGL, a blocked chunk, or a lost context keeps the photo usable.
      if (!disposed) setReady(false)
    })

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [style])

  return (
    <span className="companion-visual" data-style={style} data-pose={pose} data-renderer={ready && style === '3d' ? 'webgl' : 'photo'} aria-hidden="true">
      <span className="companion-pose-view" data-pose={pose}><CompanionPhoto pose={pose} /></span>
      {style === '3d' ? <canvas ref={canvasRef} className="companion-canvas" aria-hidden="true" /> : null}
    </span>
  )
}
