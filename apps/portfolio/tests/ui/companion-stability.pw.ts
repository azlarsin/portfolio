import { PUBLIC_COMPANION_ENABLED } from '../../src/components/companion/companionConfig'
import { expect, test, type Page } from '@playwright/test'

test.skip(!PUBLIC_COMPANION_ENABLED, 'Public companion is paused until digital-human assets are ready.')

async function idle(page: Page, pose?: string) {
  const host = page.getByTestId('route-companion')
  if (pose) await expect(host).toHaveAttribute('data-pose', pose)
  await expect(host).toHaveAttribute('data-transition-state', 'idle', { timeout: 7000 })
  await expect(host).not.toHaveAttribute('data-fragments', 'true')
  await expect(host).toBeVisible()
}

test('removed SVG preferences and URLs migrate to photos', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('portfolio-companion-style', 'svg'))
  for (const path of ['/', '/?companion=svg']) {
    await page.goto(path)
    await idle(page)
    await expect(page.locator('.companion-visual')).toHaveAttribute('data-style', 'photo')
    await expect(page.getByRole('button', { name: 'SVG 插画', exact: true })).toHaveCount(0)
    await expect(page.locator('.companion-portrait')).toHaveCount(0)
  }
})

test('all seven added photos are available through the action picker', async ({ page }) => {
  await page.goto('/?companion=photo')
  await idle(page)
  const additions = [
    ['little', '小小笑脸'], ['thinking', '托腮想想'], ['surprise', '惊喜一下'],
    ['cream', '奶油胡子'], ['together', '一起合影'], ['peace', '比个耶'], ['riding', '骑行出发'],
  ]
  for (const [pose, label] of additions) {
    await page.getByRole('button', { name: '选择动作', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: '选择动作' })
    await expect(dialog.locator('.companion-picker-option')).toHaveCount(10)
    await dialog.getByRole('button', { name: label, exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await idle(page, pose)
    const image = page.locator('.companion-visual image')
    await expect(image).toHaveAttribute('href', `/portraits/explorer-${pose}.jpg`)
    expect(await image.evaluate(async element => {
      const image = new Image()
      image.src = (element as SVGImageElement).href.baseVal
      await image.decode()
      return image.naturalWidth > 0
    })).toBe(true)
  }
})

test('the action picker fits a narrow phone and supports keyboard dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/')
  await idle(page)
  const trigger = page.getByRole('button', { name: '选择动作', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: '选择动作' })
  const box = await dialog.boundingBox()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(320)
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await dialog.getByRole('button', { name: '骑行出发', exact: true }).click()
  await idle(page, 'riding')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
})

test('a fast wheel burst selects only its last settled region', async ({ page }) => {
  await page.goto('/')
  await idle(page)
  const host = page.getByTestId('route-companion')
  await page.evaluate(async () => {
    for (const top of [180, 1200, 500, 1800, 80, 1200, 0]) {
      scrollTo({ top, behavior: 'instant' })
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    }
  })
  await page.waitForTimeout(400)
  await idle(page, 'snack')
  await expect(host).toHaveAttribute('data-placement', 'hero')
  expect(Number(await host.getAttribute('data-transition-id') || 0)).toBe(0)
  await page.evaluate(() => scrollTo({ top: 180, behavior: 'instant' }))
  await expect(host).toHaveAttribute('data-fragments', 'true')
  await idle(page, 'play')
  await expect(host).toHaveAttribute('data-placement', 'floating')
  expect(Number(await host.getAttribute('data-transition-id'))).toBe(1)
})

test('scrolling during a transition preserves it and coalesces the next destination', async ({ page }) => {
  await page.goto('/')
  await idle(page)
  const host = page.getByTestId('route-companion')
  await page.evaluate(() => scrollTo({ top: 180, behavior: 'instant' }))
  await expect(host).toHaveAttribute('data-fragment-phase', 'playing')
  const first = await host.getAttribute('data-transition-id')
  await page.evaluate(async () => {
    for (const top of [1600, 2600, 650, 1900, 0]) {
      scrollTo({ top, behavior: 'instant' })
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    }
  })
  expect(await host.getAttribute('data-transition-id')).toBe(first)
  await expect(host).toHaveAttribute('data-target-pose', 'snack', { timeout: 5000 })
  await idle(page, 'snack')
  await expect(host).toHaveAttribute('data-placement', 'hero')
  expect(Number(await host.getAttribute('data-transition-id'))).toBe(Number(first) + 1)
})

test('small direction reversals near a section boundary do not retrigger animations', async ({ page }) => {
  await page.goto('/')
  await idle(page)
  await page.evaluate(() => scrollTo({ top: 200, behavior: 'instant' }))
  await idle(page, 'play')
  const boundary = await page.locator('.playground-section').evaluate(element =>
    scrollY + element.getBoundingClientRect().top - document.querySelector('.site-topbar')!.getBoundingClientRect().bottom - innerHeight * 0.3,
  )
  await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), boundary + 90)
  await idle(page, 'peek')
  const host = page.getByTestId('route-companion')
  const before = await host.getAttribute('data-transition-id')
  for (const delta of [-16, 18, -12, 20, -20]) {
    await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), boundary + delta)
    await page.waitForTimeout(200)
  }
  await idle(page, 'peek')
  expect(await host.getAttribute('data-transition-id')).toBe(before)
})

test('rapid clicks keep the latest action and do not restart the active animation', async ({ page }) => {
  await page.goto('/')
  await idle(page)
  const host = page.getByTestId('route-companion')
  await host.click()
  await expect(host).toHaveAttribute('data-fragments', 'true')
  const first = await host.getAttribute('data-transition-id')
  await host.click()
  await host.click()
  expect(await host.getAttribute('data-transition-id')).toBe(first)
  await idle(page, 'little')
  expect(Number(await host.getAttribute('data-transition-id'))).toBe(Number(first) + 1)
})

test('each transition randomizes trajectory and large cuts while keeping them stable in flight', async ({ page }) => {
  await page.goto('/')
  await idle(page)
  const host = page.getByTestId('route-companion')
  const plans: { pattern: string | undefined; seed: string | undefined; cuts: string[] }[] = []
  for (const pose of ['play', 'peek', 'little']) {
    await host.click()
    await expect(host).toHaveAttribute('data-fragments', 'true')
    const snapshot = await host.evaluate(async element => {
      const read = () => [...element.querySelectorAll<HTMLCanvasElement>('.companion-fragment canvas')].map(canvas => canvas.style.clipPath)
      const cuts = read()
      await new Promise(resolve => setTimeout(resolve, 90))
      return { pattern: element.dataset.fragmentTrajectory, seed: element.dataset.fragmentSeed, cuts, unchanged: JSON.stringify(cuts) === JSON.stringify(read()) }
    })
    expect(snapshot.unchanged).toBe(true)
    expect(snapshot.cuts).toHaveLength(6)
    let totalArea = 0
    for (const cut of snapshot.cuts) {
      const numbers = cut.match(/[\d.]+/g)!.map(Number)
      const points = Array.from({ length: numbers.length / 2 }, (_, i) => [numbers[i * 2] * 3.2, numbers[i * 2 + 1] * 3.4])
      const area = Math.abs(points.reduce((sum, [x, y], i) => {
        const [nx, ny] = points[(i + 1) % points.length]
        return sum + x * ny - nx * y
      }, 0)) / 2
      expect(area).toBeGreaterThan(9000)
      totalArea += area
    }
    expect(Math.abs(totalArea - 320 * 340)).toBeLessThan(2)
    plans.push(snapshot)
    await idle(page, pose)
  }
  for (let i = 1; i < plans.length; i++) {
    expect(plans[i].pattern).not.toBe(plans[i - 1].pattern)
    expect(plans[i].seed).not.toBe(plans[i - 1].seed)
    expect(plans[i].cuts).not.toEqual(plans[i - 1].cuts)
  }
})
