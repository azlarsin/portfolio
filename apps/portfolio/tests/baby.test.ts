import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { resolveRoute } from '../src/app/router'
import { getPortfolioSeo, isIndexableRoute } from '../src/app/seo'
import { initialPhotos, nextIndex, parseRemotePhotos, photosForMode } from '../src/components/baby/babyData'
import { paperFragments } from '../src/components/baby/babyPaper'
import { BabyPage } from '../src/pages/BabyPage'

const record = { id: 'abc', src: '/_api/baby/media/abc', title: '新回忆', width: 600, height: 800 }
describe('unlisted family album', () => {
  it('resolves the route but excludes it from indexing and image previews', () => {
    const route = resolveRoute('/baby/')
    expect(route.id).toBe('baby')
    expect(isIndexableRoute(route)).toBe(false)
    expect(getPortfolioSeo(route).robots).toBe('noindex,nofollow,noimageindex')
    expect(getPortfolioSeo(route).imageUrl).toBeNull()
  })
  it('static output contains only the gate and never any photos', () => {
    const html = renderToStaticMarkup(createElement(BabyPage))
    expect(html).toContain('家庭暗号')
    expect(html).not.toMatch(/portraits\/|<image\b|baby-gallery|baby\/album/)
  })
  it('maps server photos to full-image frames and rejects bad URLs/metadata', () => {
    expect(parseRemotePhotos({ photos: [record] })[0]).toMatchObject({ id: 'admin-abc', viewBox: [0, 0, 600, 800], src: 'https://admin.azlar.cc/_api/baby/media/abc' })
    for (const patch of [{ src: 'javascript:alert(1)' }, { src: 'https://elsewhere.test/a.jpg' }, { width: Infinity }, { height: 0 }]) expect(() => parseRemotePhotos({ photos: [{ ...record, ...patch }] })).toThrow()
    expect(() => parseRemotePhotos({ photos: [record, record] })).toThrow()
  })
  it('loops forwards/backwards including one-photo albums', () => {
    expect(nextIndex(9, 1, 10)).toBe(0)
    expect(nextIndex(0, -1, 10)).toBe(9)
    expect(nextIndex(0, 1, 1)).toBe(0)
  })
  it('offers every photo in all modes, including newly uploaded photos', () => {
    const photos = [...initialPhotos, ...parseRemotePhotos({ photos: [record] })]
    expect(photosForMode(photos, '3d')).toEqual(photos)
    expect(initialPhotos.every(photo => photo.assets?.model && photo.assets.svgThumbnail)).toBe(true)
    expect(new Set(initialPhotos.map(photo => photo.assets?.model)).size).toBe(10)
    expect(photosForMode(photos, 'svg')).toEqual(photos)
    expect(photosForMode(photos, 'photo')).toEqual(photos)
  })
  it('rejects generated assets from an unexpected origin', () => {
    const assets = { revision: 'portrait-v3', photo: record.src, thumbnail: record.src, svg: record.src, svgPreview: record.src, svgThumbnail: record.src, model: 'https://elsewhere.test/m.glb' }
    expect(() => parseRemotePhotos({ photos: [{ ...record, assets }] })).toThrow('生成素材来源不正确')
    expect(parseRemotePhotos({ photos: [{ ...record, assets: { ...assets, model: record.src }, generation: 'ready' }] })[0].assets?.model).toBe('https://admin.azlar.cc/_api/baby/media/abc')
  })
})

// Adjacent tears must tile the photograph, without overlaps or missing strips.
it('six irregular paper pieces cover the entire photo exactly once', () => {
  const pieces = paperFragments(600, 660)
  expect(pieces).toHaveLength(6)
  const area = pieces.reduce((sum, piece) => sum + Math.abs(piece.points.reduce((a, [x, y], i, points) => {
    const next = points[(i + 1) % points.length]
    return a + x * next[1] - next[0] * y
  }, 0)) / 2, 0)
  expect(area).toBeCloseTo(600 * 660)
  for (let i = 0; i < 1000; i++) {
    const x = ((i * 137.507764 + .123) % 600), y = ((i * 89.119 + .456) % 660)
    const covers = pieces.filter(({ points }) => {
      let inside = false
      for (let a = 0, b = points.length - 1; a < points.length; b = a++) {
        const [ax, ay] = points[a], [bx, by] = points[b]
        if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside
      }
      return inside
    })
    expect(covers).toHaveLength(1)
  }
})
