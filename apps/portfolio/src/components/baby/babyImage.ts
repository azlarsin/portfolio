import type { BabyPhoto } from './babyData'
const images = new Map<string, Promise<HTMLImageElement>>()
export function loadPortraitImage(src: string) {
  const existing = images.get(src)
  if (existing) { images.delete(src); images.set(src, existing); return existing }
  const task = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(), timeout = setTimeout(() => { image.src = ''; reject(new Error('图片加载超时')) }, 15000)
    image.crossOrigin = 'anonymous'; image.decoding = 'async'
    image.onload = () => { clearTimeout(timeout); resolve(image) }
    image.onerror = () => { clearTimeout(timeout); reject(new Error('图片暂时无法加载')) }
    image.src = src
  })
  images.set(src, task)
  void task.catch(() => { if (images.get(src) === task) images.delete(src) })
  while (images.size > 6) images.delete(images.keys().next().value!)
  return task
}
export async function rasterPortrait(photo: BabyPhoto, longestEdge = 660) {
  const image = await loadPortraitImage(photo.src)
  const [x, y, width, height] = photo.viewBox
  const scale = longestEdge / Math.max(width, height)
  const canvas = document.createElement('canvas'); canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.scale(canvas.width / width, canvas.height / height); ctx.translate(-x, -y)
  ctx.clip(new Path2D(photo.outline)); ctx.drawImage(image, 0, 0, photo.width, photo.height)
  return canvas
}
const binaries = new Map<string, Promise<ArrayBuffer>>()
export function loadPortraitModel(src: string) {
  let bytes = binaries.get(src)
  if (!bytes) {
    bytes = fetch(src, { credentials: 'omit', signal: AbortSignal.timeout(20000) }).then(async response => {
      if (!response.ok) throw new Error('模型暂时无法加载')
      const buffer = await response.arrayBuffer()
      if (buffer.byteLength > 12 * 1024 * 1024) throw new Error('模型文件过大')
      return buffer
    })
    binaries.set(src, bytes)
    void bytes.catch(() => { if (binaries.get(src) === bytes) binaries.delete(src) })
    while (binaries.size > 3) binaries.delete(binaries.keys().next().value!)
  }
  return bytes
}
export function clearImages() { images.clear(); binaries.clear() }
