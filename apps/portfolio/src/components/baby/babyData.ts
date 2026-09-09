import { companionPhotos, type CompanionPhotoSource } from '../companion/companionPhotos'
import { companionPoses, poseLabel, type CompanionPose } from '../companion/companionPoses'

import generatedAssets from './generatedAssets.json'

export type BabyMode = 'photo' | 'svg' | '3d'
export type BabyEffect = 'particles' | 'hologram' | 'fragments' | 'mix'
export interface BabyAssets { revision: string; photo: string; thumbnail: string; svg: string; svgPreview: string; svgThumbnail: string; model: string; modelPreview?: string; modelThumbnail?: string }
export interface BabyPhoto extends CompanionPhotoSource { id: string; title: string; pose?: CompanionPose; assets?: BabyAssets; generation?: 'queued' | 'processing' | 'ready' | 'failed' }
export const initialPhotos: BabyPhoto[] = companionPoses.map(pose => ({ ...companionPhotos[pose], id: pose, title: poseLabel(pose, 'zh'), pose, assets: generatedAssets[pose], generation: 'ready' }))
export const albumApi = (import.meta.env.VITE_BABY_API_URL || 'https://admin.azlar.cc/_api/baby').replace(/\/$/, '')

export function hasBabyModel(photo: BabyPhoto): boolean {
  return !!photo.assets?.model
}

export function photosForMode(photos: BabyPhoto[], _mode: BabyMode) { return photos }

export function parseRemotePhotos(value: unknown, base = albumApi): BabyPhoto[] {
  if (!value || typeof value !== 'object' || !('photos' in value) || !Array.isArray(value.photos)) throw new Error('相册数据格式不正确')
  const origin = new URL(base, 'https://me.azlar.cc').origin
  const ids = new Set<string>()
  return value.photos.slice(0, 500).map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('照片数据格式不正确')
    const p = item as Record<string, unknown>
    if (typeof p.id !== 'string' || !p.id || ids.has(p.id) || typeof p.title !== 'string' || typeof p.src !== 'string' || typeof p.width !== 'number' || typeof p.height !== 'number' || !Number.isFinite(p.width) || !Number.isFinite(p.height) || p.width < 1 || p.height < 1 || p.width > 10000 || p.height > 10000) throw new Error('照片数据格式不正确')
    const url = new URL(p.src, base)
    if (!['https:', 'http:'].includes(url.protocol) || url.origin !== origin) throw new Error('照片来源不正确')
    const safeUrl = (value: unknown) => {
      if (typeof value !== 'string') throw new Error('生成素材地址不正确')
      const result = new URL(value, base)
      if (!['https:', 'http:'].includes(result.protocol) || result.origin !== origin) throw new Error('生成素材来源不正确')
      return result.href
    }
    let assets: BabyAssets | undefined
    if (p.assets && typeof p.assets === 'object') {
      const a = p.assets as Record<string, unknown>
      if (typeof a.revision !== 'string') throw new Error('生成素材版本不正确')
      assets = { revision: a.revision, photo: safeUrl(a.photo), thumbnail: safeUrl(a.thumbnail), svg: safeUrl(a.svg), svgPreview: safeUrl(a.svgPreview), svgThumbnail: safeUrl(a.svgThumbnail), model: safeUrl(a.model), ...(a.modelPreview ? { modelPreview: safeUrl(a.modelPreview) } : {}), ...(a.modelThumbnail ? { modelThumbnail: safeUrl(a.modelThumbnail) } : {}) }
    }
    const generation = ['queued', 'processing', 'ready', 'failed'].includes(String(p.generation)) ? p.generation as BabyPhoto['generation'] : undefined
    ids.add(p.id)
    return { id: `admin-${p.id}`, title: p.title.slice(0, 120), ...(assets ? { assets } : {}), ...(generation ? { generation } : {}), src: url.href, width: p.width, height: p.height, viewBox: [0, 0, p.width, p.height], outline: `M0 0H${p.width}V${p.height}H0Z` }
  })
}

export function nextIndex(index: number, direction: number, length: number) {
  return length ? ((index + direction) % length + length) % length : 0
}
