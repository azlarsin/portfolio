import { PUBLIC_COMPANION_ENABLED } from '../../src/components/companion/companionConfig'
import { expect, test, type Page } from '@playwright/test'

test.skip(!PUBLIC_COMPANION_ENABLED, 'Public companion is paused until digital-human assets are ready.')

const companionSelector = '[data-testid="route-companion"]'

async function expectIntact(page: Page) {
  const companion = page.getByTestId('route-companion')
  await expect(companion).not.toHaveAttribute('data-fragments', 'true')
  await expect(companion).toBeVisible()
  await expect.poll(() => page.locator('.companion-visual').evaluate((element) => {
    const style = getComputedStyle(element)
    return style.visibility !== 'hidden' && Number(style.opacity) > 0
  })).toBe(true)
}

async function expectInViewport(page: Page) {
  const companion = page.getByTestId('route-companion')
  await expect.poll(async () => {
    const bounds = await companion.boundingBox()
    const viewport = page.viewportSize()
    return Boolean(bounds && viewport && bounds.x >= -1 && bounds.y >= -1
      && bounds.x + bounds.width <= viewport.width + 1
      && bounds.y + bounds.height <= viewport.height + 1)
  }, { message: 'The floating character should remain completely inside the viewport' }).toBe(true)
}

async function expectHero(page: Page) {
  const companion = page.getByTestId('route-companion')
  await expect(companion).toHaveAttribute('data-placement', 'hero')
  await expect.poll(async () => Number(await companion.getAttribute('data-scroll-progress'))).toBe(0)
  await expect.poll(async () => {
    const [actor, slot] = await Promise.all([
      companion.boundingBox(),
      page.locator('[data-companion-slot="home"]').boundingBox(),
    ])
    if (!actor || !slot) return Infinity
    return Math.max(Math.abs(actor.x - slot.x), Math.abs(actor.y - slot.y),
      Math.abs(actor.width - slot.width), Math.abs(actor.height - slot.height))
  }).toBeLessThanOrEqual(3)
  await expectIntact(page)
}

/** Sample the transient canvases in one browser task, before the flight can finish. */
async function expectPaintedFragments(page: Page, reason: 'greeting' | 'route' | 'section') {
  const result = await page.waitForFunction(({ selector, expectedReason }) => {
    const host = document.querySelector<HTMLElement>(selector)
    if (host?.dataset.fragments !== 'true' || host.dataset.fragmentReason !== expectedReason) return false
    const canvases = Array.from(host.querySelectorAll<HTMLCanvasElement>('.companion-fragment canvas'))
    if (canvases.length !== 6) return false
    const samples = canvases.map((canvas) => {
      const scratch = document.createElement('canvas')
      scratch.width = 48
      scratch.height = 48
      const context = scratch.getContext('2d')!
      context.drawImage(canvas, 0, 0, scratch.width, scratch.height)
      const data = context.getImageData(0, 0, scratch.width, scratch.height).data
      let painted = 0
      for (let offset = 3; offset < data.length; offset += 4) {
        if (data[offset] > 16) painted += 1
      }
      const style = getComputedStyle(canvas)
      return { painted, width: canvas.width, height: canvas.height, clipPath: style.clipPath }
    })
    if (samples.some((sample) => sample.painted === 0)) return false
    return { samples, progress: Number(host.dataset.fragmentProgress) }
  }, { selector: companionSelector, expectedReason: reason }, { timeout: 5000, polling: 'raf' })
  const snapshot = await result.jsonValue()
  if (!snapshot) throw new Error('The fragment layer did not provide a painted snapshot')
  expect(snapshot.samples).toHaveLength(6)
  for (const sample of snapshot.samples) {
    expect(sample.width).toBeGreaterThan(0)
    expect(sample.height).toBeGreaterThan(0)
    expect(sample.painted).toBeGreaterThan(0)
    expect(sample.clipPath).not.toBe('none')
  }
  expect(Number.isFinite(snapshot.progress)).toBe(true)
  expect(snapshot.progress).toBeGreaterThanOrEqual(0)
  expect(snapshot.progress).toBeLessThanOrEqual(1)
}

for (const [style, renderer] of [['photo', 'photo'], ['3d', 'webgl']] as const) {
  test(`${style} reassembles six painted fragments when greeted and returns to its live visual`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext
      const contextCanvases = new Set<HTMLCanvasElement>()
      HTMLCanvasElement.prototype.getContext = function (type: string, options?: unknown) {
        const context = getContext.call(this, type, options)
        if (context && ['webgl', 'webgl2', 'experimental-webgl'].includes(type)) {
          contextCanvases.add(this)
          document.documentElement.dataset.fragmentTestWebglCanvases = String(contextCanvases.size)
        }
        return context
      } as typeof HTMLCanvasElement.prototype.getContext
    })
    await page.goto(`/?companion=${style}`)
    await expectHero(page)
    await expect(page.locator('.companion-visual')).toHaveAttribute('data-renderer', renderer, { timeout: 15000 })
    const companion = page.getByTestId('route-companion')
    await companion.focus()
    await page.keyboard.press('Enter')
    await expect(companion).toHaveAttribute('data-greeting', 'true')
    await expectPaintedFragments(page, 'greeting')
    await expectIntact(page)
    await expect(page).toHaveURL(new RegExp(`\\/\\?companion=${style}$`))
    await expect(page.locator('.companion-visual')).toHaveAttribute('data-renderer', renderer)
    await expect(page.locator('.companion-canvas')).toHaveCount(style === '3d' ? 1 : 0)
    expect(await page.evaluate(() => Number(document.documentElement.dataset.fragmentTestWebglCanvases || 0)))
      .toBe(style === '3d' ? 1 : 0)
    expect(errors).toEqual([])
  })
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 320, height: 844 }]) {
  test(`scroll scatters and regroups the character into a persistent floating companion at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/?companion=photo')
    await expectHero(page)
    const companion = page.getByTestId('route-companion')
    await companion.evaluate((element) => element.setAttribute('data-test-sentinel', 'scroll-persistent'))
    await page.evaluate(() => window.scrollTo({ top: 180, behavior: 'instant' }))
    await expectPaintedFragments(page, 'section')
    await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(600)
    await expect(companion).toHaveAttribute('data-placement', 'floating')
    await expect(companion).toHaveAttribute('data-mode', 'home')
    await expect.poll(async () => Number(await companion.getAttribute('data-scroll-progress'))).toBe(1)
    await expectIntact(page)
    await expectInViewport(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)

    const beforeWheel = await page.evaluate(() => window.scrollY)
    await page.mouse.move(20, viewport.height / 2)
    await page.mouse.wheel(0, 250)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(beforeWheel + 100)
    await expectInViewport(page)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expectHero(page)
    await expect(companion).toHaveAttribute('data-test-sentinel', 'scroll-persistent')
    await expect(companion).toHaveCount(1)
  })
}

test('route fragments do not block navigation and interrupted flights leave one usable character', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?companion=photo')
  await expectHero(page)
  const companion = page.getByTestId('route-companion')
  await companion.evaluate((element) => element.setAttribute('data-test-sentinel', 'route-persistent'))
  await page.locator('.site-topbar a[href="/experience"]').click()
  await expect(page).toHaveURL(/\/experience$/)
  await expect(page.locator('main h1')).toBeVisible()
  await expectPaintedFragments(page, 'route')
  await expect(companion).toHaveAttribute('data-test-sentinel', 'route-persistent')

  // A second route and immediate return deliberately interrupt the active fragments.
  await page.locator('.site-topbar a[href="/archive"]').click()
  await page.locator('.site-wordmark').click()
  await expect(page).toHaveURL(/\/$/)
  await expectHero(page)
  await expect(companion).toHaveAttribute('data-test-sentinel', 'route-persistent')
  await expect(companion).toHaveCount(1)
  await companion.click()
  await expectPaintedFragments(page, 'greeting')
  await expectIntact(page)

  await page.locator('.site-topbar a[href="/archive"]').click()
  await expect(companion).toHaveAttribute('data-placement', 'dock')
  await expectIntact(page)
  await companion.click()
  await expect(page).toHaveURL(/\/$/)
  await expectHero(page)
  expect(errors).toEqual([])
})

test('resizing during a fragment flight settles inside a narrow viewport', async ({ page }) => {
  await page.goto('/?companion=photo')
  await expectHero(page)
  const companion = page.getByTestId('route-companion')
  await companion.click()
  await expectPaintedFragments(page, 'greeting')
  await page.setViewportSize({ width: 320, height: 844 })
  await expectHero(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }))
  await expect(companion).toHaveAttribute('data-placement', 'floating')
  await expectIntact(page)
  await expectInViewport(page)
  await expect(companion).toHaveCount(1)
})

test('reduced motion places the character immediately without fragments or Web Animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript((selector) => {
    const animate = Element.prototype.animate
    Element.prototype.animate = function (...args) {
      if (this.matches(selector) || this.closest(selector)) {
        const count = Number(document.documentElement.dataset.fragmentTestAnimations || 0)
        document.documentElement.dataset.fragmentTestAnimations = String(count + 1)
      }
      return animate.apply(this, args)
    }
    new MutationObserver((records) => {
      for (const record of records) {
        const host = record.target as HTMLElement
        if (host.matches?.(selector) && host.dataset.fragments === 'true') {
          document.documentElement.dataset.fragmentTestObservedReducedFragments = 'true'
        }
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-fragments'] })
  }, companionSelector)
  await page.goto('/?companion=photo')
  await expectHero(page)
  const companion = page.getByTestId('route-companion')
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }))
  await expect(companion).toHaveAttribute('data-placement', 'floating')
  await expectInViewport(page)
  await expectIntact(page)
  await companion.click()
  await expect(companion).toHaveAttribute('data-greeting', 'true')
  await expectIntact(page)
  await page.locator('.site-topbar a[href="/archive"]').click()
  await expect(companion).toHaveAttribute('data-placement', 'dock')
  await expectIntact(page)
  await companion.click()
  await expect(page).toHaveURL(/\/$/)
  await expectHero(page)
  expect(await page.evaluate(() => Number(document.documentElement.dataset.fragmentTestAnimations || 0))).toBe(0)
  expect(await page.evaluate(() => document.documentElement.dataset.fragmentTestObservedReducedFragments)).toBeUndefined()
  expect(await companion.evaluate((element) => element.getAnimations({ subtree: true })
    .filter((animation) => animation.playState === 'running').length)).toBe(0)
})
