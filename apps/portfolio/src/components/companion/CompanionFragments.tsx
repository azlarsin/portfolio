import { useEffect, useRef, type RefObject } from 'react'
import { companionPoses, COMPANION_POSE_EVENT, isCompanionPose, type CompanionPose } from './companionPoses'

export type CompanionFragmentDetail =
  | { type: 'play'; reason: 'route' | 'greeting' | 'section' | 'style'; duration?: number; strength?: number; fromPose?: CompanionPose; toPose?: CompanionPose }
  | { type: 'scrub'; progress: number; strength?: number; fromPose?: CompanionPose; toPose?: CompanionPose }
  | { type: 'stop' }

const FRAGMENT_EVENT = 'companion:fragments'
const WIDTH = 320
const HEIGHT = 340
const offsets = [[-70, -40, -27], [-44, 56, 18], [64, -16, -11], [74, 44, 27], [44, -56, -18], [-64, 16, 11]]
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
async function captureSvg(source: SVGSVGElement) {
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
  const source = visual.querySelector<SVGSVGElement>(`[data-pose="${pose}"] svg`)
  return source ? captureSvg(source) : Promise.reject(new Error('Portrait unavailable'))
}

/** A temporary six-piece overlay; the live portrait remains intact at rest. */
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
    let active = false
    let sourceKey = ''
    let observedVisualKey = ''
    let intentKey = ''
    let fromPose: CompanionPose = 'snack'
    let toPose: CompanionPose = 'snack'
    let sourceImage: HTMLCanvasElement | null = null
    let destinationImage: HTMLCanvasElement | null = null
    const paintedSides: (boolean | null)[] = Array(6).fill(null)
    let intent: Exclude<CompanionFragmentDetail, { type: 'stop' }> | null = null

    const permitted = () => !disposed && host.isConnected && !document.hidden && !reduced.matches
    const restore = () => {
      active = false
      host.dataset.fragments = 'false'
    }
    const stop = () => {
      generation += 1
      cancelAnimationFrame(frame)
      frame = 0
      intent = null
      intentKey = ''
      sourceKey = ''
      host.dataset.fragmentProgress = '0'
      restore()
    }
    const commitPose = (pose: CompanionPose) => {
      if (host.dataset.pose === pose) return
      host.dataset.pose = pose
      host.dispatchEvent(new CustomEvent(COMPANION_POSE_EVENT, { detail: pose }))
    }
    const paint = (progress: number, strength = 1) => {
      const p = clamp(progress)
      host.dataset.fragmentProgress = p.toFixed(3)
      pieces.forEach((piece, index) => {
        const phase = clamp((p - index * 0.055) / 0.725)
        const eased = phase * phase * (3 - 2 * phase)
        const incoming = eased >= 0.5
        if (paintedSides[index] !== incoming && sourceImage && destinationImage) {
          const canvas = canvases[index]
          const context = canvas.getContext('2d')!
          context.clearRect(0, 0, canvas.width, canvas.height)
          context.drawImage(incoming ? destinationImage : sourceImage, 0, 0)
          canvas.dataset.pose = incoming ? toPose : fromPose
          paintedSides[index] = incoming
        }
        const scatter = Math.sin(Math.PI * eased)
        const [x, y, rotation] = offsets[index]
        const scaleX = 0.35 + 0.65 * Math.abs(Math.cos(Math.PI * eased))
        const amount = Number.isFinite(strength) ? Math.min(2, Math.max(0, strength)) : 1
        piece.style.transform = `translate3d(${x * scatter * amount}px, ${y * scatter * amount}px, 0) rotateZ(${rotation * scatter * amount}deg) scale(${1 + scatter * 0.06}) scaleX(${scaleX})`
        piece.style.filter = `drop-shadow(0 ${scatter * 9}px ${scatter * 7}px rgb(33 43 38 / ${scatter * 0.22}))`
      })
      // The destination is committed beneath the opaque fragment layer, so its
      // live image is already ready when the last incoming piece settles.
      commitPose(p >= 0.5 ? toPose : fromPose)
      if (p <= 0 || p >= 1) {
        restore()
        return
      }
      active = true
      host.dataset.fragments = 'true'
    }
    const snapshot = (visual: HTMLElement, pose: CompanionPose, refresh = false) => {
      const key = `${visualKey(visual)}:${pose}`
      const cached = !refresh && cache.get(key)
      if (cached) return Promise.resolve(cached)
      const inflight = !refresh && pending.get(key)
      if (inflight) return inflight
      const request = captureVisual(visual, pose).then((canvas) => {
        if (!disposed) cache.set(key, canvas)
        return canvas
      }).finally(() => {
        if (pending.get(key) === request) pending.delete(key)
      })
      pending.set(key, request)
      return request
    }
    const prepare = () => {
      const visual = host.querySelector<HTMLElement>('.companion-visual')
      if (!visual || !permitted() || !intent) return
      const token = generation
      const key = visualKey(visual)
      intentKey = key
      fromPose = intent.fromPose ?? (isCompanionPose(host.dataset.pose) ? host.dataset.pose : 'snack')
      toPose = intent.toPose ?? fromPose
      host.dataset.fragmentFrom = fromPose
      host.dataset.fragmentTo = toPose
      const refresh = visual.dataset.renderer === 'webgl'
      void Promise.all([snapshot(visual, fromPose, refresh), snapshot(visual, toPose, refresh)]).then(([outgoing, incoming]) => {
        if (token !== generation || !intent || !permitted() || visualKey(visual) !== key) return
        sourceImage = outgoing
        destinationImage = incoming
        paintedSides.fill(null)
        canvases.forEach((canvas) => {
          canvas.width = outgoing.width
          canvas.height = outgoing.height
          if (!canvas.getContext('2d')) throw new Error('Canvas unavailable')
        })
        sourceKey = key
        if (intent.type === 'scrub') {
          paint(intent.progress, intent.strength)
          return
        }
        const playing = intent
        const started = performance.now()
        const duration = Math.max(240, Math.min(2400, playing.duration || 1100))
        const animate = (time: number) => {
          frame = 0
          if (token !== generation || !permitted()) {
            if (token === generation) stop()
            return
          }
          const progress = clamp((time - started) / duration)
          paint(progress, playing.strength ?? (playing.reason === 'route' ? 1.25 : 1))
          if (progress < 1) frame = requestAnimationFrame(animate)
          else intent = null
        }
        frame = requestAnimationFrame(animate)
      }).catch(() => {
        if (token === generation) {
          commitPose(intent?.type === 'scrub' && intent.progress < 0.5 ? fromPose : toPose)
          stop()
        }
      })
    }
    const handle = (event: Event) => {
      const detail = (event as CustomEvent<CompanionFragmentDetail>).detail
      if (!detail || detail.type === 'stop') { stop(); return }
      // A docked portrait never reacts to page scrolling or section changes.
      if (host.dataset.mode !== 'home' && (detail.type === 'scrub' || detail.reason !== 'route')) { stop(); return }
      if (!permitted()) {
        const current = isCompanionPose(host.dataset.pose) ? host.dataset.pose : 'snack'
        commitPose(detail.type === 'scrub' && detail.progress < 0.5 ? detail.fromPose ?? current : detail.toPose ?? current)
        stop()
        return
      }
      if (detail.type === 'scrub' && intent?.type === 'scrub' && detail.fromPose === intent.fromPose && detail.toPose === intent.toPose) {
        intent = detail
        const visual = host.querySelector<HTMLElement>('.companion-visual')
        if (visual && sourceKey === visualKey(visual)) paint(detail.progress, detail.strength)
        return
      }
      stop()
      intent = detail
      host.dataset.fragmentReason = detail.type === 'scrub' ? 'scroll' : detail.reason
      if (detail.type === 'scrub' && (detail.progress <= 0 || detail.progress >= 1)) {
        host.dataset.fragmentProgress = clamp(detail.progress).toFixed(3)
      }
      prepare()
    }
    const prewarm = () => {
      const visual = host.querySelector<HTMLElement>('.companion-visual')
      if (!visual) return
      const key = visualKey(visual)
      if (observedVisualKey !== key) {
        if (intentKey !== key && (intent || active)) stop()
        observedVisualKey = key
        sourceKey = ''
      }
      if (visual.dataset.renderer !== 'webgl' && permitted()) {
        for (const pose of companionPoses) void snapshot(visual, pose).catch(() => {})
      }
    }
    const suspend = () => {
      if (!permitted()) stop()
      else prewarm()
    }
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
          <canvas
            width={WIDTH}
            height={HEIGHT}
            style={{ clipPath: `polygon(${polygon.map(([x, y]) => `${x / WIDTH * 100}% ${y / HEIGHT * 100}%`).join(',')})` }}
          />
        </span>
      ))}
    </span>
  )
}
