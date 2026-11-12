import { test, expect } from '@playwright/test'

test('mobile navigation contains focus, restores it on dismissal, and closes on resize', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const menu = page.getByRole('button', { name: '打开导航', exact: true })
  const dialog = page.getByRole('dialog', { name: '主导航' })
  await menu.click()
  await expect(dialog).toBeVisible()
  for (let index = 0; index < 24; index++) {
    await page.keyboard.press('Tab')
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(menu).toBeFocused()
  await menu.click()
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  await page
    .getByRole('navigation', { name: '主导航' })
    .getByRole('link', { name: '职业经历', exact: true })
    .click()
  await expect(page).toHaveURL(/\/experience$/)
  await expect(page.locator('main h1')).toBeFocused()
})

test('mobile navigation links and preference controls remain usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: '打开导航', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: '深色', exact: true }).click()
  await dialog.getByRole('button', { name: 'EN', exact: true }).click()
  await dialog
    .getByRole('link', { name: 'Personal Projects', exact: true })
    .click()
  await expect(dialog).not.toBeVisible()
  await expect(page).toHaveURL(/\/archive$/)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('main h1')).toHaveText('Personal Projects')
})

test('theme controls stay synchronized between mobile and desktop navigation', async ({
  page,
}) => {
  await page.goto('/')
  await page
    .locator('.topbar-preferences')
    .getByRole('button', { name: '深色', exact: true })
    .click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '打开导航', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(
    dialog.getByRole('button', { name: '深色', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await dialog.getByRole('button', { name: '浅色', exact: true }).click()
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(dialog).not.toBeVisible()
  await expect(
    page
      .locator('.topbar-preferences')
      .getByRole('button', { name: '浅色', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('blocked browser storage does not prevent rendering or theme selection', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError')
      },
    })
  })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('main h1')).toContainText('陈成')
  await page
    .locator('.topbar-preferences')
    .getByRole('button', { name: '深色', exact: true })
    .click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(errors).toEqual([])
})

test('chapter links remain below the header and track long chapters while scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/work/meican-platform#platform-shell')
  const chapter = page.locator('#platform-shell')
  await expect(
    page.locator('.case-toc [aria-current="location"]'),
  ).toHaveAttribute('href', '/work/meican-platform#platform-shell')
  const rect = await chapter.boundingBox()
  expect(rect?.y).toBeGreaterThanOrEqual(76)
  await page.evaluate(() => window.scrollBy(0, 160))
  await expect(
    page.locator('.case-toc [aria-current="location"]'),
  ).toHaveAttribute('href', '/work/meican-platform#platform-shell')
})

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`home and case content fit at ${width}px in both languages`, async ({
    page,
  }) => {
    const height = width === 320 ? 568 : 900
    await page.setViewportSize({ width, height })
    for (const language of ['zh', 'en']) {
      await page.addInitScript(
        (value) => localStorage.setItem('portfolio-language', value),
        language,
      )
      await page.goto('/')
      const selected = await page.locator('#selected-work-title').boundingBox()
      expect(selected?.y).toBeLessThan(height - 20)
      for (const route of [
        '/',
        '/work/meican-platform',
        '/archive',
        '/resume',
      ]) {
        if (route !== '/') await page.goto(route)
        await expect(page.locator('main h1')).toBeVisible()
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width)
        expect(
          await page.locator('main').evaluate((main) =>
            [...main.querySelectorAll('*')]
              .filter((element) => {
                const rect = element.getBoundingClientRect()
                return (
                  rect.width > 0 &&
                  (rect.right > innerWidth + 1 || rect.left < -1)
                )
              })
              .map((element) => element.className),
          ),
        ).toEqual([])
      }
    }
  })
}
