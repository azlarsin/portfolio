import { useEffect, useRef, type RefObject } from 'react'
import { COMPANION_POSE_EVENT, COMPANION_TRANSITION_END, isCompanionPose, nextCompanionPose, type CompanionPose } from './companionPoses'
import { companionPhotos } from './companionPhotos'
import { makeTrajectory, pieceTransform, type TrajectoryPlan } from './companionTrajectory'

export type CompanionFragmentDetail =
  | { type: 'play'; reason: 'route' | 'greeting' | 'section' | 'style' | 'selection'; duration?: number; strength?: number; fromPose?: CompanionPose; toPose?: CompanionPose; transitionId?: number; trajectory?: TrajectoryPlan }
  | { type: 'stop' }

const FRAGMENT_EVENT = 'companion:fragments'
const WIDTH = 320
const HEIGHT = 340
// Every interior edge is shared, so the six pieces reconstruct the same silhouette.
const polygons = [
  [[0, 0], [160, 0], [148, 43], [166, 77], [154, 112], [108, 104], [55, 120], [0, 108]],
  [[160, 0], [320, 0], [320, 114], [268, 108], [211, 122], [154, 112], [166, 77], [148, 43]],
  [[0, 108], [55, 120], [108, 104], [154, 112], [168, 151], [149, 185], [163, 226], [105, 235], [56, 220], [0, 232]],
  [[154, 112], [211, 122], [268, 108], [320, 114], [320, 230], [267, 221], [216, 239], [163, 226], [149, 185], [168, 151]],
  [[0, 232], [56, 220], [105, 235], [163, 226], [149, 269], [167, 303], [157, 340], [0, 340]],
  [[163, 226], [216, 239], [267, 221], [320, 230], [320, 340], [157, 340], [167, 303], [149, 269]],
]
const origins = ['25% 17%', '75% 17%', '25% 50%', '75% 50%', '25% 83%', '75% 83%']
const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
const imageData = new Map<string, Promise<string>>()

export function dispatchFragments(host: HTMLButtonElement | null, detail: CompanionFragmentDetail) {
  host?.dispatchEvent(new CustomEvent<CompanionFragmentDetail>(FRAGMENT_EVENT, { detail }))
}

function inlineImage(href: string) {
  if (href.startsWith('data:')) return Promise.resolve(href)
  const url = new URL(href, window.location.href)
  if (url.origin !== window.location.origin) return Promise.reject(new Error('Portrait image must be same-origin'))
  const cached = imageData.get(url.href)
  if (cached) return cached
  const request = fetch(url.href).then(async (response) => {
    if (!response.ok) throw new Error('Portrait image unavailable')
    const blob = await response.blob()
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Portrait image unreadable'))
      reader.readAsDataURL(blob)
    })
  }).catch((error: unknown) => {
    imageData.delete(url.href)
    throw error
  })
  imageData.set(url.href, request)
  return request
}

function makeCanvas() {
  const canvas = document.createElement('canvas')
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(WIDTH * ratio)
  canvas.height = Math.round(HEIGHT * ratio)
  return canvas
}

function ensurePainted(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  for (let index = 3; index < pixels.length; index += 4 * 53) {
    if (pixels[index] > 0) return
  }
  throw new Error('Portrait snapshot is empty')
}

// SVG images have their own document: copy the live paint and pose along with
// defs, masks and embedded image bytes rather than depending on page styles.
async function captureSvg(source: SVGSVGElement, pose: CompanionPose) {
  const clone = source.cloneNode(true) as SVGSVGElement
  const liveElements = [source, ...source.querySelectorAll<SVGElement>('*')]
  const copiedElements = [clone, ...clone.querySelectorAll<SVGElement>('*')]
  const properties = [
    'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity',
    'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset',
    'opacity', 'color', 'stop-color', 'stop-opacity', 'clip-path', 'mask',
    'transform', 'transform-origin', 'transform-box', 'filter',
  ]
  liveElements.forEach((element, index) => {
    const computed = getComputedStyle(element)
    for (const property of properties) {
      const value = computed.getPropertyValue(property)
        .replace(/url\(["']?[^"')]*#([^"')]+)["']?\)/g, 'url(#$1)')
      if (value) copiedElements[index].style.setProperty(property, value)
    }
  })
  const photo = companionPhotos[pose]
  clone.setAttribute('viewBox', photo.viewBox.join(' '))
  clone.querySelector('[data-photo-outline]')?.setAttribute('d', photo.outline)
  const photoImage = clone.querySelector('image')!
  photoImage.setAttribute('href', photo.src)
  photoImage.setAttribute('width', String(photo.width))
  photoImage.setAttribute('height', String(photo.height))
  for (const frame of clone.querySelectorAll('[data-photo-mask], [data-photo-frame]')) {
    for (const [index, attr] of ['x', 'y', 'width', 'height'].entries()) frame.setAttribute(attr, String(photo.viewBox[index]))
  }
  clone.setAttribute('width', String(WIDTH))
  clone.setAttribute('height', String(HEIGHT))
  clone.style.width = `${WIDTH}px`
  clone.style.height = `${HEIGHT}px`
  clone.style.visibility = 'visible'
  await Promise.all(Array.from(clone.querySelectorAll('image'), async (element) => {
    const href = element.getAttribute('href') || element.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
    if (!href) return
    element.setAttribute('href', await inlineImage(href))
    element.removeAttributeNS('http://www.w3.org/1999/xlink', 'href')
  }))
  const serialized = new XMLSerializer().serializeToString(clone)
  const url = URL.createObjectURL(new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Portrait snapshot unavailable'))
      image.src = url
    })
    const snapshot = makeCanvas()
    const context = snapshot.getContext('2d')
    if (!context) throw new Error('Canvas unavailable')
    context.drawImage(image, 0, 0, snapshot.width, snapshot.height)
    ensurePainted(snapshot, context)
    return snapshot
  } finally {
    URL.revokeObjectURL(url)
  }
}

function visualKey(visual: HTMLElement) {
  return `${visual.dataset.style}:${visual.dataset.renderer}`
}

async function captureVisual(visual: HTMLElement, pose: CompanionPose): Promise<HTMLCanvasElement> {
  if (visual.dataset.renderer === 'webgl') {
    const source = visual.querySelector<HTMLCanvasElement>('.companion-canvas')
    const snapshot = makeCanvas()
    const context = snapshot.getContext('2d')
    if (!source || !context || source.width === 0) return Promise.reject(new Error('WebGL portrait unavailable'))
    // The fresh WebGL frame must be copied in this task, before its drawing
    // buffer can be cleared by the browser. No extra WebGL contexts are needed.
    source.dispatchEvent(new CustomEvent('companion:capture', { detail: { pose } }))
    context.drawImage(source, 0, 0, snapshot.width, snapshot.height)
    ensurePainted(snapshot, context)
    return Promise.resolve(snapshot)
  }
  const source = visual.querySelector<SVGSVGElement>('.companion-photo')
  return source ? captureSvg(source, pose) : Promise.reject(new Error('Portrait unavailable'))
}

/** A single complete transition. The controller coalesces competing requests. */
export function CompanionFragments({ hostRef }: { hostRef: RefObject<HTMLButtonElement | null> }) {
  const layerRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const host = hostRef.current
    const layer = layerRef.current
    if (!host || !layer) return
    const pieces = Array.from(layer.querySelectorAll<HTMLElement>('.companion-fragment'))
    const canvases = Array.from(layer.querySelectorAll('canvas'))
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const cache = new Map<string, HTMLCanvasElement>()
    const pending = new Map<string, Promise<HTMLCanvasElement>>()
    let frame = 0
    let generation = 0
    let disposed = false
    let observedKey = ''
    let intent: Extract<CompanionFragmentDetail, { type: 'play' }> | null = null

    const notifyEnd = (request: typeof intent, canceled: boolean) => {
      if (request) host.dispatchEvent(new CustomEvent(COMPANION_TRANSITION_END, { detail: { transitionId: request.transitionId, canceled } }))
    }
    const permitted = () => !disposed && host.isConnected && !document.hidden && !reduced.matches
    const commitPose = (pose: CompanionPose) => {
      if (host.dataset.pose === pose) return
      host.dataset.pose = pose
      host.dispatchEvent(new CustomEvent(COMPANION_POSE_EVENT, { detail: pose }))
    }
    const stop = () => {
      const previous = intent
      intent = null
      generation++
      cancelAnimationFrame(frame)
      frame = 0
      host.dataset.fragments = 'false'
      host.dataset.fragmentPhase = 'idle'
      notifyEnd(previous, true)
    }
    const snapshot = (visual: HTMLElement, pose: CompanionPose) => {
      const key = `${visualKey(visual)}:${pose}`
      if (visual.dataset.renderer !== 'webgl') {
        const cached = cache.get(key)
        if (cached) { cache.delete(key); cache.set(key, cached); return Promise.resolve(cached) }
        if (pending.has(key)) return pending.get(key)!
      }
      const request = captureVisual(visual, pose).then(canvas => {
        if (!disposed) {
          cache.set(key, canvas)
          while (cache.size > 4) cache.delete(cache.keys().next().value!)
        }
        return canvas
      }).finally(() => { if (pending.get(key) === request) pending.delete(key) })
      pending.set(key, request)
      return request
    }
    const handle = (event: Event) => {
      const detail = (event as CustomEvent<CompanionFragmentDetail>).detail
      if (!detail || detail.type === 'stop') { stop(); return }
      stop()
      if (host.dataset.mode !== 'home' && detail.reason !== 'route') { notifyEnd(detail, true); return }
      const current = isCompanionPose(host.dataset.pose) ? host.dataset.pose : 'snack'
      const from = detail.fromPose ?? current
      const to = detail.toPose ?? current
      if (!permitted()) { commitPose(to); notifyEnd(detail, false); return }
      const visual = host.querySelector<HTMLElement>('.companion-visual')
      if (!visual) { commitPose(to); notifyEnd(detail, true); return }
      const key = visualKey(visual)
      const token = generation
      const plan = detail.trajectory ?? makeTrajectory()
      canvases.forEach((canvas, index) => {
        canvas.style.clipPath = `polygon(${plan.polygons[index].map(([x, y]) => `${x / WIDTH * 100}% ${y / HEIGHT * 100}%`).join(',')})`
      })
      intent = detail
      host.dataset.fragmentReason = detail.reason
      host.dataset.fragmentFrom = from
      host.dataset.fragmentTo = to
      host.dataset.fragmentTrajectory = plan.pattern
      host.dataset.fragmentSeed = String(plan.seed)
      host.dataset.fragmentPhase = 'loading'
      void Promise.all([snapshot(visual, from), snapshot(visual, to)]).then(([outgoing, incoming]) => {
        if (disposed || token !== generation || !intent || visualKey(visual) !== key) return
        const sides: (boolean | null)[] = Array(6).fill(null)
        canvases.forEach(canvas => { canvas.width = outgoing.width; canvas.height = outgoing.height })
        const started = performance.now()
        const duration = Math.max(400, Math.min(1600, detail.duration ?? 900))
        host.dataset.fragmentPhase = 'playing'
        const animate = (time: number) => {
          frame = 0
          if (token !== generation) return
          if (!permitted()) { commitPose(to); stop(); return }
          const progress = clamp((time - started) / duration)
          host.dataset.fragmentProgress = progress.toFixed(3)
          pieces.forEach((piece, index) => {
            const point = pieceTransform(plan, index, progress, detail.strength ?? 1)
            if (sides[index] !== point.incoming) {
              const canvas = canvases[index]
              const context = canvas.getContext('2d')!
              context.clearRect(0, 0, canvas.width, canvas.height)
              context.drawImage(point.incoming ? incoming : outgoing, 0, 0)
              canvas.dataset.pose = point.incoming ? to : from
              sides[index] = point.incoming
            }
            piece.style.transform = point.transform
            piece.style.filter = `drop-shadow(0 ${point.spread * 8}px ${point.spread * 6}px rgb(33 43 38 / ${point.spread * 0.2}))`
          })
          commitPose(progress >= 0.5 ? to : from)
          host.dataset.fragments = String(progress > 0 && progress < 1)
          if (progress < 1) frame = requestAnimationFrame(animate)
          else {
            intent = null
            host.dataset.fragmentPhase = 'idle'
            notifyEnd(detail, false)
          }
        }
        frame = requestAnimationFrame(animate)
      }).catch(() => {
        if (token === generation && !disposed) { commitPose(to); stop() }
      })
    }
    const prewarm = () => {
      const visual = host.querySelector<HTMLElement>('.companion-visual')
      if (!visual) return
      const key = visualKey(visual)
      if (observedKey && key !== observedKey) stop()
      observedKey = key
      if (permitted() && visual.dataset.renderer !== 'webgl') {
        const current = isCompanionPose(host.dataset.pose) ? host.dataset.pose : 'snack'
        void snapshot(visual, current).catch(() => {})
        void snapshot(visual, nextCompanionPose(current, visual.dataset.style === '3d' ? '3d' : 'photo')).catch(() => {})
      }
    }
    const suspend = () => { if (!permitted()) stop(); else prewarm() }
    const observer = new MutationObserver(prewarm)
    observer.observe(host, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-style', 'data-renderer'] })
    host.addEventListener(FRAGMENT_EVENT, handle)
    document.addEventListener('visibilitychange', suspend)
    reduced.addEventListener('change', suspend)
    prewarm()
    return () => {
      disposed = true
      stop()
      observer.disconnect()
      host.removeEventListener(FRAGMENT_EVENT, handle)
      document.removeEventListener('visibilitychange', suspend)
      reduced.removeEventListener('change', suspend)
      cache.clear()
      pending.clear()
    }
  }, [hostRef])
  return (
    <span ref={layerRef} className="companion-fragments" aria-hidden="true">
      {polygons.map((polygon, index) => (
        <span key={index} className="companion-fragment" style={{ transformOrigin: origins[index] }}>
          <canvas width={WIDTH} height={HEIGHT} style={{ clipPath: `polygon(${polygon.map(([x, y]) => `${x / WIDTH * 100}% ${y / HEIGHT * 100}%`).join(',')})` }} />
        </span>
      ))}
    </span>
  )
}
