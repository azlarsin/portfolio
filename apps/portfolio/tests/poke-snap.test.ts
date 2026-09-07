import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const assetPath = fileURLToPath(
  new URL('../src/assets/poke-editor-demo.html', import.meta.url),
)
const source = readFileSync(assetPath, 'utf8')

function loadSnapFunctions() {
  const start = source.indexOf('function snapRect(')
  const end = source.indexOf('function geometrySnapshot(', start)
  if (start < 0 || end < 0) throw new Error('Poke snap functions were not found')

  const factory = new Function(
    'MIN_RESIZE_SIZE',
    'artboard',
    `${source.slice(start, end)}
      return { snapRect, snapBoundsForMove, snapBoundsForResize };`,
  )
  return factory(16, { clientWidth: 280, clientHeight: 522 })
}

describe('Poke editor snapping', () => {
  it('keeps the embedded editor script syntactically valid', () => {
    const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1]
    expect(script).toBeTruthy()
    expect(() => new Function(script)).not.toThrow()
  })

  it('snaps moving edges and emits the original-style guide and distance', () => {
    const snap = loadSnapFunctions()
    const target = snap.snapRect({
      id: 'target',
      name: 'Target',
      x: 120,
      y: 20,
      w: 50,
      h: 50,
    })
    const result = snap.snapBoundsForMove(
      { x: 93, y: 300, w: 20, h: 20 },
      [target],
      { x: 8, y: 8 },
    )

    expect(result.bounds).toEqual({ x: 100, y: 300, w: 20, h: 20 })
    expect(result.matches).toMatchObject([
      {
        axis: 'x',
        sourceAnchor: 'end',
        targetAnchor: 'start',
        coordinate: 120,
      },
    ])
    expect(result.guides).toEqual([
      {
        axis: 'vertical',
        left: 120,
        top: 20,
        length: 300,
        targetId: 'target',
      },
    ])
    expect(result.distances).toMatchObject([
      { axis: 'vertical', value: 230 },
    ])
  })

  it('snaps centers to the canvas and releases outside the threshold', () => {
    const snap = loadSnapFunctions()
    const canvas = snap.snapRect({
      id: '__canvas__',
      name: '画布',
      x: 0,
      y: 0,
      w: 280,
      h: 522,
      isCanvas: true,
    })

    expect(
      snap.snapBoundsForMove(
        { x: 113, y: 300, w: 40, h: 20 },
        [canvas],
        { x: 8, y: 8 },
      ).bounds.x,
    ).toBe(120)
    expect(
      snap.snapBoundsForMove(
        { x: 110, y: 300, w: 40, h: 20 },
        [canvas],
        { x: 8, y: 8 },
      ).bounds.x,
    ).toBe(110)
  })

  it('snaps the active resize edge without moving its fixed edge', () => {
    const snap = loadSnapFunctions()
    const target = snap.snapRect({
      id: 'target',
      name: 'Target',
      x: 120,
      y: 20,
      w: 50,
      h: 50,
    })
    const result = snap.snapBoundsForResize(
      { x: 20, y: 300, w: 93, h: 20 },
      'e',
      [target],
      { x: 8, y: 8 },
    )

    expect(result.bounds).toEqual({ x: 20, y: 300, w: 100, h: 20 })
    expect(result.matches[0]).toMatchObject({
      axis: 'x',
      sourceAnchor: 'end',
      targetAnchor: 'start',
    })
  })
})
