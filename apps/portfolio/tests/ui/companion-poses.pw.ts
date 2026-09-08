import { expect, test, type Page } from '@playwright/test'

async function settled(page: Page, pose?: string) {
  const host = page.getByTestId('route-companion')
  if (pose) await expect(host).toHaveAttribute('data-pose', pose)
  await expect(host).not.toHaveAttribute('data-fragments', 'true')
  await expect(host).not.toHaveAttribute('data-moving', 'true')
  await expect(host).toHaveAttribute('data-transition-state', 'idle')
  await expect(host).toBeVisible()
}

for (const style of ['photo', '3d']) {
  test(`${style} replaces outgoing pixels with a different pose piece by piece`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`/?companion=${style}`)
    await expect(page.locator('.companion-visual')).toHaveAttribute('data-renderer', style === '3d' ? 'webgl' : style)
    await settled(page, 'snack')
    const host = page.getByTestId('route-companion')
    for (const [from, to] of [['snack', 'play'], ['play', 'peek'], ['peek', style === 'photo' ? 'little' : 'snack']]) {
      await host.click()
      const mixed = await page.waitForFunction(({ from, to }) => {
        const root = document.querySelector<HTMLElement>('[data-testid="route-companion"]')
        if (root?.dataset.fragments !== 'true') return false
        const canvases = [...root.querySelectorAll<HTMLCanvasElement>('.companion-fragment canvas')]
        const outgoing = canvases.find(canvas => canvas.dataset.pose === from)
        const incoming = canvases.find(canvas => canvas.dataset.pose === to)
        if (!outgoing || !incoming) return false
        const fingerprint = (canvas: HTMLCanvasElement) => {
          const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
          let hash = 2166136261
          for (let i = 0; i < pixels.length; i += 97) hash = Math.imul(hash ^ pixels[i], 16777619)
          return hash >>> 0
        }
        return { outgoing: fingerprint(outgoing), incoming: fingerprint(incoming) }
      }, { from, to }, { polling: 'raf', timeout: 7000 })
      const pixels = await mixed.jsonValue()
      expect(pixels).not.toBe(false)
      if (pixels) expect(pixels.incoming).not.toBe(pixels.outgoing)
      await settled(page, to)
      await expect(page.locator('.companion-visual')).toHaveAttribute('data-pose', to)
      expect(await page.locator('.companion-fragment canvas').evaluateAll((canvases, expected) =>
        canvases.every(canvas => (canvas as HTMLElement).dataset.pose === expected), to,
      )).toBe(true)
    }
    expect(errors).toEqual([])
  })
}

test('photo actions use distinct supplied images and scroll can reverse to the selected home action', async ({ page }) => {
  await page.goto('/?companion=photo')
  await settled(page, 'snack')
  const host = page.getByTestId('route-companion')
  const image = page.locator('.companion-pose-view:not([hidden]) image')
  await expect(image).toHaveAttribute('href', '/portraits/explorer-photo-v1.png')
  await host.click()
  await settled(page, 'play')
  await expect(image).toHaveAttribute('href', '/portraits/explorer-play.jpg')
  await page.evaluate(() => scrollTo({ top: 700, behavior: 'instant' }))
  await settled(page, 'peek')
  await expect(image).toHaveAttribute('href', '/portraits/explorer-peek.jpg')
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  await settled(page, 'play')
  await expect(host).toHaveAttribute('data-placement', 'hero')
})

for (const [path, width] of [['/experience', 1440], ['/work/meican-platform', 1440], ['/archive', 390]] as const) {
  test(`scrolling ${path} at ${width}px never reanimates the docked header character`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/?companion=photo')
    await settled(page)
    if (width > 800) {
      await page.evaluate((to) => {
        history.pushState({}, '', to)
        dispatchEvent(new PopStateEvent('popstate'))
      }, path)
    } else {
      await page.getByRole('button', { name: '打开导航', exact: true }).click()
      await page.getByRole('dialog').getByRole('link', { name: '个人项目', exact: true }).click()
    }
    await expect(page).toHaveURL(new RegExp(path + '$'))
    await settled(page)
    const host = page.getByTestId('route-companion')
    await expect(host).toHaveAttribute('data-placement', 'dock')
    const before = await host.boundingBox()
    const pose = await host.getAttribute('data-pose')
    await host.evaluate((element) => {
      element.dataset.scrollRegressions = '0'
      new MutationObserver(records => {
        for (const record of records) {
          const name = record.attributeName!
          if (element.getAttribute(name) === 'true') {
            element.dataset.scrollRegressions = String(Number(element.dataset.scrollRegressions) + 1)
          }
        }
      }).observe(element, { attributes: true, attributeFilter: ['data-moving', 'data-fragments'] })
    })
    for (const top of [420, 1100, 2000, 650, 0]) {
      await page.evaluate((value) => scrollTo({ top: value, behavior: 'instant' }), top)
      await page.waitForTimeout(260)
      await expect(host).toHaveAttribute('data-pose', pose!)
      await expect(host).not.toHaveAttribute('data-fragments', 'true')
      await expect(host).not.toHaveAttribute('data-moving', 'true')
    }
    await expect(host).toHaveAttribute('data-scroll-regressions', '0')
    expect(await host.boundingBox()).toEqual(before)
  })
}

test('reduced motion changes the action without a fragment animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?companion=photo')
  await settled(page, 'snack')
  const host = page.getByTestId('route-companion')
  await host.click()
  await settled(page, 'play')
  await host.click()
  await settled(page, 'peek')
  expect(await host.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)
})
