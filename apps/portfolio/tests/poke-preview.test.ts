import { describe, expect, it } from 'vitest'
import {
  createPokeRenderUrl,
  decodePokePrototype,
  encodePokePrototype,
  normalizePokePrototype,
  type PokePrototype,
} from '../src/features/poke/protocol'

const project: PokePrototype = {
  version: 1,
  title: 'Interaction test',
  stage: { width: 280, height: 522 },
  statusBar: { color: '#111827', background: '#ffffff' },
  tabBar: {
    background: '#ffffff',
    normalColor: '#8791a2',
    selectedColor: '#2e67dd',
    tabs: [
      { id: 'tab-home', text: 'Home', icon: '⌂', pageId: 'home' },
      { id: 'tab-detail', text: 'Details', icon: '◇', pageId: 'details' },
    ],
  },
  pages: [
    {
      id: 'home',
      name: 'Launch',
      background: '#f8f9fc',
      elements: [
        {
          id: 'cta',
          name: 'Primary Button',
          type: 'rect',
          x: 24,
          y: 252,
          width: 232,
          height: 48,
          fill: '#2e67dd',
          radius: 16,
          opacity: 100,
          text: 'Open prototype →',
        },
      ],
    },
    {
      id: 'details',
      name: 'Details',
      background: '#f8f9fc',
      elements: [
        {
          id: 'back',
          name: 'Back',
          type: 'text',
          x: 24,
          y: 48,
          width: 80,
          height: 24,
          fill: '#2e67dd',
          radius: 0,
          opacity: 100,
          text: '← Back',
        },
      ],
    },
  ],
  interactions: [
    {
      sourceId: 'cta',
      trigger: 'swipeLeft',
      targetPageId: 'details',
      effect: 'modal',
      easing: 'ease-in-out',
      duration: 0.45,
    },
  ],
}

describe('Poke QR preview protocol', () => {
  it('round-trips the project, including interaction animation and system bars', async () => {
    const encoded = await encodePokePrototype(project)
    const decoded = await decodePokePrototype(encoded)

    expect(encoded).toMatch(/^[gj]\.[A-Za-z0-9_-]+$/)
    expect(decoded).toEqual(project)
    expect(decoded.interactions[0]).toMatchObject({
      trigger: 'swipeLeft',
      effect: 'modal',
      easing: 'ease-in-out',
      duration: 0.45,
    })
    expect(decoded.tabBar.tabs[1].pageId).toBe('details')
    expect(decoded.statusBar.color).toBe('#111827')
  })

  it('drops unsafe or dangling values at the URL boundary', () => {
    const normalized = normalizePokePrototype({
      ...project,
      statusBar: { color: 'url(javascript:alert(1))' },
      tabBar: {
        ...project.tabBar,
        tabs: [
          ...project.tabBar.tabs,
          ...Array.from({ length: 7 }, (_, index) => ({
            id: `extra-${index}`,
            text: `Extra ${index}`,
            icon: '○',
            pageId: 'missing',
          })),
        ],
      },
      interactions: [
        ...project.interactions,
        { ...project.interactions[0], sourceId: 'missing' },
      ],
    })

    expect(normalized?.statusBar.color).toBe('#667080')
    expect(normalized?.tabBar.tabs).toHaveLength(5)
    expect(normalized?.tabBar.tabs[2].pageId).toBeNull()
    expect(normalized?.interactions).toHaveLength(1)
  })

  it('builds the canonical route encoded by the editor QR', () => {
    expect(createPokeRenderUrl('g.abc_123')).toBe(
      'https://me.azlar.cc/poke/render?data=g.abc_123',
    )
  })
})
