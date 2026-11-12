import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('shared demo player fullscreen control', () => {
  it('toggles the complete player shell for every registered demo', () => {
    const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url))
    const playerPage = readFileSync(`${sourceRoot}/pages/DemoPlayerPage.tsx`, 'utf8')
    const playerCss = readFileSync(`${sourceRoot}/styles/demo-player.css`, 'utf8')
    const copy = readFileSync(`${sourceRoot}/i18n/copy.ts`, 'utf8')

    expect(playerPage).toContain('ref={playerRef} className="demo-player-page"')
    expect(playerPage).toContain("document.addEventListener('fullscreenchange'")
    expect(playerPage).toContain('player?.requestFullscreen?.bind(player)')
    expect(playerPage).toContain('document.exitFullscreen?.bind(document)')
    expect(playerPage).toContain('className="demo-player-fullscreen"')
    expect(playerPage).toContain('aria-pressed={fullscreen}')
    expect(playerCss).toContain('.demo-player-page:fullscreen')
    expect(playerCss).toContain('.demo-player-fullscreen-label')
    expect(copy).toContain("enterFullscreen: '进入全屏'")
    expect(copy).toContain("exitFullscreen: 'Exit fullscreen'")
  })
})
