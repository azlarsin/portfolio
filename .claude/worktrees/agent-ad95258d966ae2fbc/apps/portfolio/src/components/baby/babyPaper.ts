import { loadPortraitImage } from './babyImage'

/** Six complementary cuts. Adjacent pieces reuse exactly the same tear. */
export function paperFragments(width: number, height: number) {
  type Point = [number, number]
  const horizontal = (column: number, row: number): Point[] => Array.from({ length: 5 }, (_, step) => {
    const x = (column + step / 4) * width / 2
    const y = row * height / 3 + (row > 0 && row < 3 && step > 0 && step < 4 ? Math.sin(column * 7 + row * 3 + step * 2) * height * .025 : 0)
    return [x, y]
  })
  const vertical = (column: number, row: number): Point[] => Array.from({ length: 5 }, (_, step) => {
    const x = column * width / 2 + (column === 1 && step > 0 && step < 4 ? Math.sin(row * 5 + step * 3) * width * .035 : 0)
    return [x, (row + step / 4) * height / 3]
  })
  return Array.from({ length: 6 }, (_, i) => {
    const column = i % 2, row = Math.floor(i / 2)
    return { x: (column + .5) * width / 2, y: (row + .5) * height / 3,
      points: [...horizontal(column, row), ...vertical(column + 1, row).slice(1), ...horizontal(column, row + 1).reverse().slice(1), ...vertical(column, row).reverse().slice(1)] }
  })
}

/** The same neutral composition is used for the live canvas and transition snapshots. */
export function drawPaperPortrait(ctx: CanvasRenderingContext2D, source: HTMLImageElement, width: number, height: number, x = 0, y = 0) {
  const scale = Math.min(width * .92 / source.naturalWidth, height * .92 / source.naturalHeight)
  const w = source.naturalWidth * scale, h = source.naturalHeight * scale
  ctx.save()
  ctx.translate(width / 2, height / 2)
  // Two restrained backing sheets give the print depth without a thick sticker outline.
  for (const [rotation, offset, color] of [[-.055, 8, '#86a69a'], [.025, 4, '#deddd1']] as const) {
    ctx.save(); ctx.translate(-3, offset); ctx.rotate(rotation)
    ctx.fillStyle = color; ctx.shadowColor = '#00000020'; ctx.shadowBlur = 9; ctx.shadowOffsetY = 4
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 5); ctx.fill(); ctx.restore()
  }
  ctx.translate(x * 5, -Math.abs(x) * 3 + y * 2)
  ctx.rotate(x * .035 + y * .008)
  ctx.scale(1 - Math.abs(x) * .035, 1 - Math.abs(y) * .012)
  ctx.shadowColor = '#00000045'; ctx.shadowBlur = 9; ctx.shadowOffsetX = 4 + x * 5; ctx.shadowOffsetY = 5
  ctx.drawImage(source, -w / 2, -h / 2, w, h)
  ctx.restore()
}

/** Only the open portrait has a canvas. Redraw on interaction, then sleep when settled. */
export function createBabyPaperScene(canvas: HTMLCanvasElement, host: HTMLElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  const width = 600, height = 660, dpr = Math.min(window.devicePixelRatio || 1, 1.75)
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  let source: HTMLImageElement | undefined, generation = 0, disposed = false, frame = 0
  let x = 0, y = 0, targetX = 0, targetY = 0, last = 0
  const draw = (time: number) => {
    frame = 0
    if (disposed || document.hidden || !source) return
    if (time - last < 1000 / 30) { frame = requestAnimationFrame(draw); return }
    last = time
    x += (targetX - x) * .25; y += (targetY - y) * .25
    if (Math.abs(x - targetX) + Math.abs(y - targetY) < .003) { x = targetX; y = targetY }
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0)
    ctx.clearRect(0, 0, width, height)
    drawPaperPortrait(ctx, source, width, height, x, y)
    if (x !== targetX || y !== targetY) frame = requestAnimationFrame(draw)
  }
  const request = () => { if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(draw) }
  const reset = () => { targetX = targetY = 0; request() }
  const move = (event: PointerEvent) => {
    if (reduced.matches) return
    const rect = host.getBoundingClientRect()
    targetX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1))
    targetY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)); request()
  }
  const visibility = () => { cancelAnimationFrame(frame); frame = 0; if (!document.hidden) reset() }
  host.addEventListener('pointermove', move, { passive: true }); host.addEventListener('pointerleave', reset)
  host.addEventListener('pointerup', reset); host.addEventListener('pointercancel', reset)
  document.addEventListener('visibilitychange', visibility); reduced.addEventListener('change', reset)
  return {
    async setSource(src: string) {
      const token = ++generation, image = await loadPortraitImage(src)
      if (disposed || token !== generation) return false
      source = image; x = y = targetX = targetY = 0
      canvas.dataset.paperSrc = src; last = 0
      // Paint before exposing the canvas to avoid a blank frame.
      draw(performance.now()); return true
    },
    dispose() {
      disposed = true; generation++; cancelAnimationFrame(frame); source = undefined
      host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', reset)
      host.removeEventListener('pointerup', reset); host.removeEventListener('pointercancel', reset)
      document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', reset)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    },
  }
}
