import { PUBLIC_COMPANION_ENABLED } from '../../src/components/companion/companionConfig'
import { expect, test, type Page } from '@playwright/test'

test.skip(!PUBLIC_COMPANION_ENABLED, 'Public companion is paused until digital-human assets are ready.')

const companionSelector = '[data-testid="route-companion"]'

async function expectAtSlot(page: Page, mode: 'home' | 'dock') {
  const companion = page.getByTestId('route-companion')
  const slot = page.locator(`[data-companion-slot="${mode}"]`)
  await expect(companion).toBeVisible()
  await expect(companion).toHaveAttribute('data-mode', mode)
  await expect.poll(async () => {
    const [actor, destination] = await Promise.all([
      companion.boundingBox(),
      slot.boundingBox(),
    ])
    if (!actor || !destination) return Number.POSITIVE_INFINITY
    return Math.max(
      Math.abs(actor.x - destination.x),
      Math.abs(actor.y - destination.y),
      Math.abs(actor.width - destination.width),
      Math.abs(actor.height - destination.height),
    )
  }, { message: `The persistent character should settle into the ${mode} slot` })
    .toBeLessThanOrEqual(3)
}

async function recordCompanionAnimations(page: Page) {
  await page.addInitScript((selector) => {
    const animate = Element.prototype.animate
    Element.prototype.animate = function (...args) {
      if (this.matches(selector) || this.closest(selector) || this.querySelector(selector)) {
        const count = Number(document.documentElement.dataset.companionTestAnimations || 0)
        document.documentElement.dataset.companionTestAnimations = String(count + 1)
      }
      return animate.apply(this, args)
    }
  }, companionSelector)
}

async function animationCount(page: Page) {
  return page.evaluate(() => Number(document.documentElement.dataset.companionTestAnimations || 0))
}

test('the default photo loads without WebGL and its selection survives navigation and reload', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  const imageResponse = page.waitForResponse((response) => response.url().includes('/portraits/'))
  await page.goto('/')
  await expectAtSlot(page, 'home')
  const visual = page.locator('.companion-visual')
  await expect(visual).toHaveAttribute('data-style', 'photo')
  await expect(visual).toHaveAttribute('data-renderer', 'photo')
  await expect(page.getByRole('button', { name: '照片形象', exact: true })).toHaveAttribute('aria-pressed', 'true')
  expect((await imageResponse).ok()).toBe(true)
  const portrait = page.locator('.companion-pose-view:not([hidden]) .companion-photo image')
  await expect(portrait).toHaveAttribute('href', /\/portraits\/[^/]+\.(png|webp)$/)
  expect(await portrait.evaluate(async (element) => {
    const image = new Image()
    image.src = (element as SVGImageElement).href.baseVal
    await image.decode()
    return image.naturalWidth > 0 && image.naturalHeight > 0
  })).toBe(true)
  await expect(page.locator('.companion-canvas')).toHaveCount(0)

  await page.getByRole('button', { name: '照片形象', exact: true }).click()
  await expect(visual).toHaveAttribute('data-renderer', 'photo')
  await page.getByRole('button', { name: '照片形象', exact: true }).click()
  await expect(visual).toHaveAttribute('data-renderer', 'photo')
  expect(await page.evaluate(() => localStorage.getItem('portfolio-companion-style'))).toBe('photo')
  await page.locator('.site-topbar a[href="/archive"]').click()
  await expectAtSlot(page, 'dock')
  await expect(visual).toHaveAttribute('data-renderer', 'photo')
  await page.reload()
  await expectAtSlot(page, 'dock')
  await expect(visual).toHaveAttribute('data-renderer', 'photo')
  await page.getByTestId('route-companion').click()
  await expectAtSlot(page, 'home')
  await expect(visual).toHaveAttribute('data-renderer', 'photo')
  await expect(page.locator('.companion-canvas')).toHaveCount(0)
  expect(requests.filter((url) => /companionScene|\/three(?:[./_-]|$)/i.test(url))).toEqual([])
})

test('the home character offers a keyboard greeting', async ({ page }) => {
  await page.goto('/')
  const companion = page.getByTestId('route-companion')
  await expectAtSlot(page, 'home')
  await expect(companion).toHaveAccessibleName('和小小探索者打个招呼')
  await companion.focus()
  await page.keyboard.press('Enter')
  await expect(companion).toHaveAttribute('data-greeting', 'true')
  await expect(page).toHaveURL(/\/$/)
  await expect(companion).not.toHaveAttribute('data-greeting', 'true', { timeout: 3000 })
})

test('the same character travels to the header and returns without delaying navigation', async ({ page }) => {
  await page.goto('/')
  const companion = page.getByTestId('route-companion')
  await expectAtSlot(page, 'home')
  await companion.evaluate((element) => element.setAttribute('data-test-sentinel', 'persistent'))

  await page.locator('.site-topbar a[href="/experience"]').click()
  expect(new URL(page.url()).pathname).toBe('/experience')
  await expect(page.locator('main h1')).toBeVisible()
  await expect(companion).toHaveAttribute('data-test-sentinel', 'persistent')
  await expect(companion).toHaveAccessibleName('回到首页')
  await expectAtSlot(page, 'dock')

  await companion.click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('main h1')).toBeVisible()
  await expectAtSlot(page, 'home')
  await expect(companion).toHaveAttribute('data-test-sentinel', 'persistent')
  await expect(companion).toHaveCount(1)
})

test('history and interrupted journeys preserve the character and its final destination', async ({ page }) => {
  await page.goto('/')
  const companion = page.getByTestId('route-companion')
  await expectAtSlot(page, 'home')
  await companion.evaluate((element) => element.setAttribute('data-test-sentinel', 'history'))
  await page.locator('.site-topbar a[href="/experience"]').click()
  await page.locator('.site-topbar a[href="/archive"]').click()
  await page.locator('.site-wordmark').click()
  await expect(page).toHaveURL(/\/$/)
  await expectAtSlot(page, 'home')

  await page.goBack()
  await expect(page).toHaveURL(/\/archive$/)
  await expectAtSlot(page, 'dock')
  await page.goBack()
  await expect(page).toHaveURL(/\/experience$/)
  await expectAtSlot(page, 'dock')
  await page.goForward()
  await expect(page).toHaveURL(/\/archive$/)
  await page.goForward()
  await expect(page).toHaveURL(/\/$/)
  await expectAtSlot(page, 'home')
  await expect(companion).toHaveAttribute('data-test-sentinel', 'history')
  await expect(companion).toHaveCount(1)
})

test('hash navigation uses the home scene without a route transition', async ({ page }) => {
  await recordCompanionAnimations(page)
  await page.goto('/')
  await expectAtSlot(page, 'home')
  await page.locator('.hero-actions a[href="/#selected-work"]').click()
  await expect(page).toHaveURL(/\/#selected-work$/)
  await expect(page.getByTestId('route-companion')).toHaveAttribute('data-mode', 'home')
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expectAtSlot(page, 'home')
  await expect(page.getByTestId('route-companion')).not.toHaveAttribute('data-fragment-reason', 'route')
})

test('reduced motion disables character transitions and keeps navigation usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await recordCompanionAnimations(page)
  await page.goto('/')
  await expectAtSlot(page, 'home')
  const companion = page.getByTestId('route-companion')
  await expect(page.locator('.companion-visual')).toHaveAttribute('data-renderer', 'photo')
  await companion.click()
  await expect(companion).toHaveAttribute('data-greeting', 'true')
  await expect(page.locator('.companion-hello')).toHaveCSS('opacity', '1')
  await expect(page.locator('.companion-pose-view:not([hidden]) .companion-photo-motion')).toHaveCSS('transform', 'none')
  expect(await companion.evaluate((element) =>
    element.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length,
  )).toBe(0)
  await page.locator('.site-topbar a[href="/archive"]').click()
  await expectAtSlot(page, 'dock')
  await companion.click()
  await expect(page).toHaveURL(/\/$/)
  await expectAtSlot(page, 'home')
  expect(await animationCount(page)).toBe(0)
  expect(await companion.evaluate((element) =>
    element.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length,
  )).toBe(0)
})

test('unavailable WebGL falls back to the photo with working navigation', async ({ page }) => {
  const errors: string[] = []
  let webGLAttempts = 0
  page.on('pageerror', (error) => errors.push(error.message))
  await page.exposeFunction('recordWebGLAttempt', () => { webGLAttempts += 1 })
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string, options?: unknown) {
      if (['webgl', 'webgl2', 'experimental-webgl'].includes(type)) {
        void (window as unknown as { recordWebGLAttempt: () => Promise<void> }).recordWebGLAttempt()
        return null
      }
      return getContext.call(this, type, options)
    } as typeof HTMLCanvasElement.prototype.getContext
  })
  await page.goto('/?companion=3d')
  const companion = page.getByTestId('route-companion')
  await expectAtSlot(page, 'home')
  await expect.poll(() => webGLAttempts).toBeGreaterThan(0)
  await expect(page.locator('.companion-visual')).toHaveAttribute('data-style', '3d')
  await expect(page.locator('[data-renderer="photo"]')).toBeVisible()
  const portrait = page.locator('.companion-pose-view:not([hidden]) .companion-photo')
  await expect(portrait).toBeVisible()
  expect(await portrait.locator('path').count()).toBeGreaterThan(0)
  await expect(portrait.locator('image')).toHaveCount(1)
  await companion.evaluate((element) => element.setAttribute('data-test-sentinel', 'fallback'))
  await page.locator('.site-topbar a[href="/experience"]').click()
  await expectAtSlot(page, 'dock')
  await companion.click()
  await expect(page).toHaveURL(/\/$/)
  await expectAtSlot(page, 'home')
  await expect(companion).toHaveAttribute('data-test-sentinel', 'fallback')
  expect(errors).toEqual([])
})

test('Photo and 3D choices persist across navigation and reload, with URL overrides', async ({ page }) => {
  await page.goto('/')
  const visual = page.locator('.companion-visual')
  const canvas = page.locator('.companion-canvas')
  await expect(visual).toHaveAttribute('data-style', 'photo')
  await page.getByRole('button', { name: '照片形象', exact: true }).click()
  await expect(page.getByRole('button', { name: '照片形象', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(visual).toHaveAttribute('data-style', 'photo')
  await expect(visual).toHaveAttribute('data-renderer', 'photo')
  await expect(canvas).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('portfolio-companion-style'))).toBe('photo')
  await page.locator('.site-topbar a[href="/archive"]').click()
  await expectAtSlot(page, 'dock')
  await expect(visual).toHaveAttribute('data-style', 'photo')
  await expect(canvas).toHaveCount(0)
  await page.getByTestId('route-companion').click()
  await expectAtSlot(page, 'home')
  await page.reload()
  await expect(visual).toHaveAttribute('data-style', 'photo')
  await expect(canvas).toHaveCount(0)

  await page.getByRole('button', { name: '3D 人物', exact: true }).click()
  await expect(page.getByRole('button', { name: '3D 人物', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(visual).toHaveAttribute('data-renderer', 'webgl', { timeout: 15000 })
  await expect(canvas).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('portfolio-companion-style'))).toBe('3d')
  await page.reload()
  await expect(visual).toHaveAttribute('data-style', '3d')
  await expect(visual).toHaveAttribute('data-renderer', 'webgl', { timeout: 15000 })
  await page.goto('/?companion=photo')
  await expect(visual).toHaveAttribute('data-style', 'photo')
  await expect(canvas).toHaveCount(0)
  await page.goto('/?companion=3d')
  await expect(visual).toHaveAttribute('data-style', '3d')
  await expect(visual).toHaveAttribute('data-renderer', 'webgl', { timeout: 15000 })
})

test('the WebGL character turns with the pointer and stays still under reduced motion', async ({ page }) => {
  await page.goto('/?companion=3d')
  await expectAtSlot(page, 'home')
  await expect(page.locator('.companion-visual')).toHaveAttribute('data-renderer', 'webgl', { timeout: 15000 })
  const canvas = page.locator('.companion-canvas')
  await expect(canvas).toHaveAttribute('data-yaw', /^-?\d+\.\d+$/)
  expect(await canvas.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext('webgl2')
    return Boolean(context && !context.isContextLost() && context.drawingBufferWidth > 0)
  })).toBe(true)
  const restingYaw = Number(await canvas.getAttribute('data-yaw'))
  await page.mouse.move(40, 350)
  await expect.poll(async () => Math.abs(Number(await canvas.getAttribute('data-yaw')) - restingYaw))
    .toBeGreaterThan(0.03)
  const leftYaw = Number(await canvas.getAttribute('data-yaw'))
  await page.mouse.move(1240, 350)
  await expect.poll(async () => Number(await canvas.getAttribute('data-yaw')) - leftYaw)
    .toBeGreaterThan(0.05)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(async () => Math.abs(Number(await canvas.getAttribute('data-yaw')) - restingYaw))
    .toBeLessThan(0.002)
  await page.mouse.move(40, 200)
  await page.mouse.move(1240, 450)
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  ))
  expect(Number(await canvas.getAttribute('data-yaw'))).toBe(restingYaw)
})

test('language changes keep the character aligned with the resized home layout', async ({ page }) => {
  await page.goto('/?companion=photo')
  await expectAtSlot(page, 'home')
  const companion = page.getByTestId('route-companion')
  await companion.evaluate((element) => element.setAttribute('data-test-sentinel', 'language'))
  await page.locator('.topbar-preferences .language-toggle button[lang="en"]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(companion).toHaveAccessibleName('Say hello to the little explorer')
  await expectAtSlot(page, 'home')
  await page.locator('.topbar-preferences .language-toggle button[lang="zh-CN"]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await expectAtSlot(page, 'home')
  await expect(companion).toHaveAttribute('data-test-sentinel', 'language')
})

test('mobile style changes preserve scroll, focus, and the initial preview URL', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?companion=3d')
  await expectAtSlot(page, 'home')
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500)
  const scrollY = await page.evaluate(() => window.scrollY)
  const url = page.url()
  for (const [name, style] of [['照片形象', 'photo'], ['3D 人物', '3d']] as const) {
    const choice = page.getByRole('button', { name, exact: true })
    // Locator.click scrolls this already visible sticky control into view itself.
    // Click its screen position so this assertion measures the page's behavior.
    const bounds = await choice.boundingBox()
    expect(bounds).not.toBeNull()
    await page.mouse.click(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2)
    await expect(choice).toBeFocused()
    await expect(page.locator('.companion-visual')).toHaveAttribute('data-style', style)
    await page.evaluate(() => new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    ))
    expect(Math.abs(await page.evaluate(() => window.scrollY) - scrollY)).toBeLessThanOrEqual(1)
    expect(page.url()).toBe(url)
  }
})

test('the character remains usable on narrow phones without horizontal overflow', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')
    await expectAtSlot(page, 'home')
    const companion = page.getByTestId('route-companion')
    for (const name of ['照片形象', '3D 人物', '选择动作']) {
      const choice = page.getByRole('button', { name, exact: true })
      await expect(choice).toBeVisible()
      const bounds = await choice.boundingBox()
      expect(bounds?.x).toBeGreaterThanOrEqual(0)
      expect((bounds?.x || 0) + (bounds?.width || 0)).toBeLessThanOrEqual(width)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    await page.getByRole('button', { name: '照片形象', exact: true }).click()
    await expect(page.locator('.companion-visual')).toHaveAttribute('data-style', 'photo')
    await expect(page.locator('.companion-canvas')).toHaveCount(0)
    await page.getByRole('button', { name: '3D 人物', exact: true }).click()
    await expect(page.locator('.companion-visual')).toHaveAttribute('data-renderer', 'webgl', { timeout: 15000 })
    await page.getByRole('button', { name: '照片形象', exact: true }).click()
    await expect(page.locator('.companion-visual')).toHaveAttribute('data-renderer', 'photo')
    await expect(page.locator('.companion-canvas')).toHaveCount(0)
    await companion.click()
    await expect(companion).toHaveAttribute('data-greeting', 'true')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    await page.getByRole('button', { name: '打开导航', exact: true }).click()
    await page.getByRole('dialog', { name: '主导航' })
      .getByRole('link', { name: '职业经历', exact: true }).click()
    await expect(page).toHaveURL(/\/experience$/)
    await expectAtSlot(page, 'dock')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    const dock = await companion.boundingBox()
    expect(dock?.x).toBeGreaterThanOrEqual(0)
    expect((dock?.x || 0) + (dock?.width || 0)).toBeLessThanOrEqual(width)
    await companion.click()
    await expect(page).toHaveURL(/\/$/)
    await expectAtSlot(page, 'home')
  }
})

test('standalone demo and Poke render pages do not mount the companion', async ({ page }) => {
  for (const route of ['/demo', '/poke/render']) {
    await page.goto(route)
    await expect(page.locator('#root')).not.toBeEmpty()
    await expect(page.getByTestId('route-companion')).toHaveCount(0)
    await expect(page.locator('[data-companion-slot]')).toHaveCount(0)
  }
})
