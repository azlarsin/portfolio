import { useEffect, useId, useRef, useState } from 'react'
import type { BabyMode, BabyPhoto } from './babyData'
import type { createBabyAvatarScene } from './babyAvatarScene'
import { createBabyPaperScene } from './babyPaper'

export function BabyPortrait({ photo, mode, live = false }: { photo: BabyPhoto; mode: BabyMode; live?: boolean }) {
  const id = `baby-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const canvas = useRef<HTMLCanvasElement>(null), host = useRef<HTMLDivElement>(null)
  const paperCanvas = useRef<HTMLCanvasElement>(null)
  const [renderedPaper, setRenderedPaper] = useState('')
  const scene = useRef<ReturnType<typeof createBabyAvatarScene> | null>(null)
  const current = useRef(photo); current.current = photo
  const [inView, setInView] = useState(live)
  const [renderedModel, setRenderedModel] = useState(''), [failedModel, setFailedModel] = useState('')
  const modelSrc = photo.assets?.model || ''
  const paperSrc = photo.assets?.svgPreview || ''
  const paperReady = mode === 'svg' && live && !!paperSrc && renderedPaper === paperSrc
  const ready = !!modelSrc && renderedModel === modelSrc && failedModel !== modelSrc
  const failed = !!modelSrc && failedModel === modelSrc
  useEffect(() => {
    if (live || !host.current) { setInView(true); return }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '160px' })
    observer.observe(host.current)
    return () => observer.disconnect()
  }, [live])
  useEffect(() => {
    if (mode !== '3d' || !live || !canvas.current || !host.current) return
    let disposed = false
    const element = canvas.current, container = host.current
    void import('./babyAvatarScene').then(({ createBabyAvatarScene }) => {
      if (disposed) return
      const controller = createBabyAvatarScene(element, container, () => setFailedModel(current.current.assets?.model || ''))
      scene.current = controller
      const src = current.current.assets?.model
      if (src) void controller.setSource(src).then(success => { if (!disposed && success) setRenderedModel(src) }).catch(() => { if (!disposed) setFailedModel(src) })
    }).catch(() => { if (!disposed) setFailedModel(current.current.assets?.model || '') })
    return () => { disposed = true; scene.current?.dispose(); scene.current = null; setRenderedModel(''); setFailedModel('') }
  }, [mode, live])
  useEffect(() => {
    if (!scene.current || !modelSrc || mode !== '3d') return
    let disposed = false
    void scene.current.setSource(modelSrc).then(success => { if (!disposed && success) setRenderedModel(modelSrc) }).catch(() => { if (!disposed) setFailedModel(modelSrc) })
    return () => { disposed = true }
  }, [modelSrc, mode])
  useEffect(() => {
    if (mode !== 'svg' || !live || !paperSrc || !paperCanvas.current || !host.current) return
    let disposed = false
    let controller: ReturnType<typeof createBabyPaperScene>
    try { controller = createBabyPaperScene(paperCanvas.current, host.current) } catch { return }
    void controller.setSource(paperSrc).then(success => { if (!disposed && success) setRenderedPaper(paperSrc) }).catch(() => { /* The static paper preview remains visible. */ })
    return () => { disposed = true; controller.dispose(); setRenderedPaper('') }
  }, [paperSrc, mode, live])
  const assets = photo.assets
  const preview = assets && (mode === 'svg' ? (live ? assets.svgPreview : assets.svgThumbnail) : mode === '3d' ? (live ? assets.modelPreview || assets.photo : assets.modelThumbnail || assets.thumbnail) : (live ? assets.photo : assets.thumbnail))
  const webgl = mode === '3d' && live && ready
  const pending = !assets && mode !== 'photo'

  return <div ref={host} className="baby-portrait-host" data-mode={mode} data-renderer={webgl ? 'webgl' : paperReady ? 'paper-canvas' : mode === 'svg' && assets ? 'paper-preview' : 'photo'} data-model-src={modelSrc} data-loading={mode === '3d' && live && !!modelSrc && !ready && !failed}>
    {(live || inView) && (preview ? <img className="baby-portrait baby-derived-portrait" src={preview} draggable={false} alt="" aria-hidden="true" decoding="async" style={{ visibility: webgl || paperReady ? 'hidden' : 'visible' }} /> : <svg className="baby-portrait" viewBox={photo.viewBox.join(' ')} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><clipPath id={`${id}-clip`}><path d={photo.outline} /></clipPath></defs>
      <image href={photo.src} width={photo.width} height={photo.height} clipPath={`url(#${id}-clip)`} />
    </svg>)}
    {mode === '3d' && live && <canvas className="baby-model" ref={canvas} style={{ visibility: webgl ? 'visible' : 'hidden' }} aria-label="照片采样的 3D 卡通数字人" />}
    {mode === 'svg' && live && <canvas className="baby-paper" ref={paperCanvas} style={{ visibility: paperReady ? 'visible' : 'hidden' }} aria-label="保留照片细节的纸片人像" />}
    {webgl && <button type="button" className="baby-avatar-turn" onClick={event => { event.stopPropagation(); scene.current?.spin() }} aria-label="让数字人转一圈">↻ 转一圈</button>}
    {pending && <span className="baby-renderer-note">{photo.generation === 'failed' ? '生成未完成，暂时显示照片' : '正在生成，完成后自动更新'}</span>}
    {mode === '3d' && live && modelSrc && !ready && !failed && <span className="baby-renderer-note" role="status">正在载入立体人像…</span>}
    {failed && mode === '3d' && <span className="baby-renderer-note" role="status">3D 暂不可用，已显示静态预览</span>}
  </div>
}
