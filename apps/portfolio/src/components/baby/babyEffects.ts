import { type BabyMode, type BabyPhoto } from './babyData'
import { clearImages, loadPortraitImage, rasterPortrait } from './babyImage'
import { drawPaperPortrait, paperFragments } from './babyPaper'

const WIDTH = 600, HEIGHT = 660
const snapshots = new Map<string, HTMLCanvasElement>()

export async function snapshot(photo: BabyPhoto, mode: BabyMode, host?: HTMLElement | null) {
  const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')!
  const paper = host?.querySelector<HTMLCanvasElement>('.baby-paper')
  if (mode === 'svg' && paper && paper.dataset.paperSrc === photo.assets?.svgPreview && host?.querySelector('[data-renderer="paper-canvas"]')) {
    ctx.drawImage(paper, 0, 0, WIDTH, HEIGHT)
    return canvas
  }
  const model = host?.querySelector<HTMLCanvasElement>('.baby-model')
  if (mode === '3d' && photo.assets?.model && model && host?.querySelector('[data-renderer="webgl"]')) {
    const { captureAvatarPortrait } = await import('./babyAvatarScene')
    return captureAvatarPortrait(model, photo.assets.model)
  }
  const key = JSON.stringify([mode, photo.assets, photo.src, photo.viewBox, photo.outline])
  const cached = snapshots.get(key)
  if (cached) { snapshots.delete(key); snapshots.set(key, cached); return cached }
  let source: CanvasImageSource, width: number, height: number
  if (photo.assets) {
    const loaded = await loadPortraitImage(mode === 'svg' ? photo.assets.svgPreview : mode === '3d' ? photo.assets.modelPreview || photo.assets.photo : photo.assets.photo)
    if (mode === 'svg') {
      drawPaperPortrait(ctx, loaded, WIDTH, HEIGHT)
      snapshots.set(key, canvas)
      while (snapshots.size > 6) snapshots.delete(snapshots.keys().next().value!)
      return canvas
    }
    source = loaded; width = loaded.naturalWidth; height = loaded.naturalHeight
  } else {
    const raster = await rasterPortrait(photo, 660)
    source = raster; width = raster.width; height = raster.height
  }
  const scale = Math.min(WIDTH / width, HEIGHT / height)
  ctx.drawImage(source, (WIDTH - width * scale) / 2, (HEIGHT - height * scale) / 2, width * scale, height * scale)
  snapshots.set(key, canvas)
  while (snapshots.size > 6) snapshots.delete(snapshots.keys().next().value!)
  return canvas
}

export function clearSnapshots() { snapshots.clear(); clearImages() }

/** Draw only during a transition. Both sides use real photo pixels. */
export function animateTransition(canvas: HTMLCanvasElement, from: HTMLCanvasElement, to: HTMLCanvasElement, effect: string, complete: () => void) {
  const ctx = canvas.getContext('2d')!
  canvas.width = WIDTH; canvas.height = HEIGHT
  let frame = 0, stopped = false
  const duration = effect === 'hologram' ? 1250 : effect === 'fragments' ? 1450 : 1500
  const seeds = effect === 'particles' ? Array.from({ length: 1800 }, (_, i) => ({ angle: i * 2.39996, travel: 80 + Math.random() * 180, turn: (Math.random() - .5) * 3 })) : []
  const pieces = effect !== 'particles' && effect !== 'hologram' ? paperFragments(WIDTH, HEIGHT).map(piece => {
    const left = Math.floor(Math.min(...piece.points.map(p => p[0]))), top = Math.floor(Math.min(...piece.points.map(p => p[1])))
    const width = Math.ceil(Math.max(...piece.points.map(p => p[0]))) - left, height = Math.ceil(Math.max(...piece.points.map(p => p[1]))) - top
    const crop = (source: HTMLCanvasElement) => {
      const buffer = document.createElement('canvas'); buffer.width = width; buffer.height = height
      const brush = buffer.getContext('2d')!; brush.translate(-left, -top)
      brush.beginPath(); piece.points.forEach(([x, y], i) => i ? brush.lineTo(x, y) : brush.moveTo(x, y)); brush.closePath(); brush.clip()
      brush.drawImage(source, 0, 0)
      return buffer
    }
    return { ...piece, left, top, from: crop(from), to: crop(to) }
  }) : []
  const start = performance.now()
  const draw = (time: number) => {
    if (stopped) return
    const p = Math.min(1, (time - start) / duration)
    ctx.clearRect(0, 0, WIDTH, HEIGHT)
    if (effect === 'particles') {
      const size = 16, cols = Math.ceil(WIDTH / size)
      for (let y = 0; y < HEIGHT; y += size) for (let x = 0; x < WIDTH; x += size) {
        const seed = seeds[Math.floor(y / size) * cols + Math.floor(x / size)]
        for (const incoming of [false, true]) {
          const t = incoming ? 1 - p : p
          const amount = Math.sin(t * Math.PI / 2)
          const alpha = incoming ? Math.max(0, (p - .26) / .74) : Math.max(0, 1 - p * 1.9)
          if (!alpha) continue
          const a = seed.angle + amount * (incoming ? -2 : 2)
          ctx.save(); ctx.globalAlpha = alpha
          ctx.translate(x + size / 2 + Math.cos(a) * seed.travel * amount, y + size / 2 + Math.sin(a) * seed.travel * amount)
          ctx.rotate(seed.turn * amount)
          const scale = 1 - amount * .65
          ctx.scale(scale, scale)
          ctx.drawImage(incoming ? to : from, x, y, size, size, -size / 2, -size / 2, size, size)
          if (amount > .15) { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(106,224,255,${amount * .25})`; ctx.fillRect(-size / 2, -size / 2, size, size) }
          ctx.restore()
        }
      }
    } else if (effect === 'hologram') {
      const line = HEIGHT * p
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, WIDTH, line); ctx.clip(); ctx.drawImage(to, 0, 0); ctx.restore()
      ctx.save(); ctx.beginPath(); ctx.rect(0, line, WIDTH, HEIGHT - line); ctx.clip(); ctx.globalAlpha = 1 - p * .6; ctx.drawImage(from, 0, 0); ctx.restore()
      const glow = ctx.createLinearGradient(0, line - 40, 0, line + 40)
      glow.addColorStop(0, 'transparent'); glow.addColorStop(.5, '#8bedff88'); glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow; ctx.fillRect(0, line - 40, WIDTH, 80)
      ctx.fillStyle = '#d4fdff'; ctx.fillRect(0, line, WIDTH, 2)
      for (let y = 0; y < HEIGHT; y += 12) {
        ctx.globalAlpha = .06 + .12 * Math.sin(p * Math.PI)
        const shift = Math.sin(y * .7 + p * 60) * 30 * Math.sin(p * Math.PI)
        ctx.drawImage(y < line ? to : from, 0, y, WIDTH, 3, shift, y, WIDTH, 3)
      }
      ctx.globalAlpha = 1
    } else {
      // Rasterize each irregular cut once; each frame draws just six bitmaps.
      if (p === 1) ctx.drawImage(to, 0, 0)
      else pieces.forEach((piece, i) => {
        const t = Math.max(0, Math.min(1, (p - i * .035) / .825)), q = t * t * (3 - 2 * t)
        const spread = Math.sin(q * Math.PI), side = i % 2 ? 1 : -1, row = Math.floor(i / 2)
        ctx.save(); ctx.translate(piece.x + side * (65 + row * 9) * spread, piece.y + (row - 1) * 54 * spread - spread * 12)
        ctx.rotate(side * (.13 + row * .035) * spread)
        ctx.scale(Math.max(.08, Math.abs(Math.cos(q * Math.PI))), 1 - .05 * spread)
        ctx.shadowColor = '#f6efdec0'; ctx.shadowOffsetX = side * 2 * spread; ctx.shadowOffsetY = 2 * spread
        ctx.drawImage(q > .5 ? piece.to : piece.from, piece.left - piece.x, piece.top - piece.y)
        ctx.restore()
      })
    }
    if (p < 1) frame = requestAnimationFrame(draw)
    else complete()
  }
  frame = requestAnimationFrame(draw)
  return () => { stopped = true; cancelAnimationFrame(frame); ctx.clearRect(0, 0, WIDTH, HEIGHT) }
}
