import { expect, test, type Page } from '@playwright/test'

async function unlock(page: Page) {
  await page.goto('/baby')
  await page.getByLabel('家庭暗号').fill('0321')
  await page.getByRole('button', { name: '进入小小宇宙' }).click()
  await expect(page.locator('.baby-card')).toHaveCount(10)
}
async function openViewer(page: Page) {
  await unlock(page)
  await page.getByRole('button', { name: '打开吃蛋筒', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '回忆放映室' })).toBeVisible()
}
test.beforeEach(async ({ page }) => { await page.route('https://admin.azlar.cc/**', route => route.fulfill({ json: { photos: [] } })) })

test('public routes fully hide the companion regardless of old preferences/URLs', async ({ page }) => {
  const portraits: string[] = []
  page.on('request', request => { if (/\/portraits\/|companionScene/.test(request.url())) portraits.push(request.url()) })
  await page.addInitScript(() => localStorage.setItem('portfolio-companion-style', '3d'))
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 })
    for (const url of ['/?companion=photo', '/?companion=3d', '/?companion=svg', '/experience', '/archive']) {
      await page.goto(url)
      await expect(page.locator('.route-companion,.companion-home,.companion-dock-slot,.companion-style-switch,.companion-picker')).toHaveCount(0)
      await expect(page.locator('a[href="/baby"],a[href="/baby/"]')).toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
  }
  expect(portraits).toEqual([])
})

test('gate blocks all album requests until the correct password and relocks on refresh', async ({ page }) => {
  const requests: string[] = []
  page.on('request', r => { if (/\/portraits\/|\/baby\/album/.test(r.url())) requests.push(r.url()) })
  await page.goto('/baby')
  await expect(page.getByLabel('家庭暗号')).toBeFocused()
  await expect(page.getByLabel('家庭暗号')).toHaveCSS('outline-style', 'none')
  await expect(page.locator('.baby-password-wrap')).toHaveCSS('border-color', 'rgb(182, 219, 165)')
  await page.getByLabel('家庭暗号').fill('1111')
  await page.getByRole('button', { name: '进入小小宇宙' }).click()
  await expect(page.getByRole('alert')).toContainText('暗号不对')
  expect(requests).toEqual([])
  await page.getByLabel('家庭暗号').fill('0321')
  await page.getByRole('button', { name: '进入小小宇宙' }).click()
  await expect(page.locator('.baby-card')).toHaveCount(10)
  await page.reload()
  await expect(page.getByLabel('家庭暗号')).toBeVisible()
  await expect(page.locator('.baby-card')).toHaveCount(0)
})

for (const effect of ['particles', 'hologram', 'fragments']) test(`${effect} animates real pixels and finishes on the next photo`, async ({ page }) => {
  await openViewer(page)
  await page.getByLabel('转场效果').selectOption(effect)
  await page.getByRole('button', { name: '下一张', exact: true }).click()
  await expect(page.getByTestId('baby-stage')).toHaveAttribute('data-transitioning', 'true')
  await expect.poll(() => page.locator('.baby-transition').evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
    return data.some((value, i) => i % 4 === 3 && value > 0)
  })).toBe(true)
  await expect(page.getByTestId('baby-stage')).toHaveAttribute('data-photo-id', 'play', { timeout: 7000 })
  await expect(page.getByTestId('baby-stage')).toHaveAttribute('data-transitioning', 'false')
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByTestId('baby-stage')).toHaveAttribute('data-photo-id', 'snack')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: '打开吃蛋筒', exact: true })).toBeFocused()
})

test('paper Canvas, WebGL and fallback stay usable, including wheel and rapid switching', async ({ page }) => {
  await openViewer(page)
  const viewer = page.getByRole('dialog', { name: '回忆放映室' })
  await viewer.getByRole('button', { name: '纸片', exact: true }).click()
  await expect(page.locator('.baby-stage .baby-portrait-host')).toHaveAttribute('data-renderer', 'paper-canvas')
  await expect.poll(() => page.locator('.baby-stage .baby-paper').evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
    return pixels.some((value, i) => i % 4 === 3 && value > 0)
  })).toBe(true)
  // Gallery and filmstrip use static paper thumbnails, only the open image has a canvas.
  await expect(page.locator('.baby-paper')).toHaveCount(1)
  await page.getByLabel('转场效果').selectOption('fragments')
  await page.getByRole('button', { name: '下一张', exact: true }).click()
  await expect(page.getByTestId('baby-stage')).toHaveAttribute('data-photo-id', 'play')
  await expect(page.locator('.baby-stage .baby-portrait-host')).toHaveAttribute('data-renderer', 'paper-canvas')
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByTestId('baby-stage')).toHaveAttribute('data-photo-id', 'snack')
  await viewer.getByRole('button', { name: '3D', exact: true }).click()
  await expect(viewer.locator('.baby-filmstrip button')).toHaveCount(10)
  await expect(page.locator('.baby-stage .baby-portrait-host')).toHaveAttribute('data-renderer', 'webgl', { timeout: 15000 })
  await viewer.getByRole('button', { name: '让数字人转一圈' }).click()
  await expect.poll(() => page.locator('.baby-stage .baby-model').getAttribute('data-yaw').then(value=>Number(value))).toBeGreaterThan(1)
  await page.locator('.baby-stage .baby-model').evaluate((canvas: HTMLCanvasElement) => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await expect(page.getByText('3D 暂不可用，已显示静态预览')).toBeVisible()
  await viewer.getByRole('button', { name: '照片', exact: true }).click()
  await page.getByTestId('baby-stage').hover()
  await page.mouse.wheel(0, 120)
  await expect(page.getByTestId('baby-stage')).toHaveAttribute('data-photo-id', 'play')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('baby-stage')).toHaveAttribute('data-photo-id', 'thinking', { timeout: 10000 })
})

test('iPad slideshow loops, wakes controls, pauses and supports swipes', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openViewer(page)
  await page.getByLabel('播放间隔').selectOption('5')
  await page.getByRole('button', { name: '播放幻灯片', exact: true }).click()
  await expect(page.getByTestId('baby-stage')).toHaveAttribute('data-photo-id', 'play', { timeout: 8000 })
  await page.getByRole('button', { name: '暂停幻灯片', exact: true }).click()
  const box = (await page.getByTestId('baby-stage').boundingBox())!
  await page.mouse.move(box.x + box.width * .7, box.y + box.height / 2)
  await page.mouse.down(); await page.mouse.move(box.x + box.width * .2, box.y + box.height / 2); await page.mouse.up()
  await expect(page.getByTestId('baby-stage')).toHaveAttribute('data-photo-id', 'peek')
  await page.getByRole('dialog').evaluate(el => { el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })) })
  await expect(page.getByTestId('baby-stage')).toHaveAttribute('data-photo-id', 'play')
  expect(await page.getByRole('dialog').evaluate(el => el.scrollWidth <= innerWidth)).toBe(true)
})

test('screensaver hides controls, keeps the screen awake and releases its lock when paused', async ({ page }) => {
  await page.addInitScript(() => {
    const state = { acquired: 0, released: 0 };
    (window as unknown as { wakeState: typeof state }).wakeState = state;
    Object.defineProperty(navigator, 'wakeLock', { value: { request: async () => {
      state.acquired++;
      return { release: async () => { state.released++ }, addEventListener: () => {} };
    } } });
  });
  await openViewer(page);
  await page.getByLabel('播放间隔').selectOption('15');
  await page.getByRole('button', { name: '播放幻灯片', exact: true }).click();
  await expect(page.getByText('屏幕常亮', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveAttribute('data-quiet', 'true', { timeout: 8000 });
  await page.getByRole('button', { name: '显示播放控件' }).click();
  await page.getByRole('button', { name: '暂停幻灯片', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { wakeState: { released: number } }).wakeState.released)).toBeGreaterThan(0);
});

test('narrow screens fit and failed cloud sync preserves the built-in album', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route('https://admin.azlar.cc/**', route => route.abort());
  await unlock(page);
  await expect(page.getByText('正在展示已载入的回忆 · 云端暂未连接')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '打开吃蛋筒', exact: true }).click();
  const viewer = page.getByRole('dialog');
  expect(await viewer.evaluate(el => el.scrollWidth <= innerWidth)).toBe(true);
  for (const label of ['照片', '纸片', '3D']) await expect(viewer.getByRole('button', { name: label, exact: true })).toBeInViewport();
  await expect(page.getByLabel('转场效果')).toBeInViewport();
});


test('3D includes all photos and preserves the selected photo when switching modes', async ({ page }) => {
  await unlock(page)
  await page.getByRole('button', { name: '3D', exact: true }).click()
  await expect(page.locator('.baby-card')).toHaveCount(10)
  expect(new Set(await page.locator('.baby-card .baby-portrait-host').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-model-src')))).size).toBe(10)
  await page.getByRole('button', { name: '打开蛋筒小喇叭', exact: true }).click()
  const viewer = page.getByRole('dialog', { name: '回忆放映室' })
  await expect(page.locator('.baby-stage [data-renderer="webgl"]')).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('baby-stage')).toHaveAttribute('data-photo-id', 'little')
  await viewer.getByRole('button', { name: '纸片', exact: true }).click()
  await expect(viewer.locator('.baby-filmstrip button')).toHaveCount(10)
  await viewer.getByRole('button', { name: '查看比个耶', exact: true }).click()
  await expect(page.getByTestId('baby-stage')).toHaveAttribute('data-photo-id', 'peace')
  await expect.poll(() => page.locator('.baby-viewer-main').evaluate(main => {
    const stage = main.querySelector('.baby-stage')!.getBoundingClientRect(), bounds = main.getBoundingClientRect()
    return main.scrollTop === 0 && stage.top >= bounds.top - 1 && stage.bottom <= bounds.bottom + 1
  })).toBe(true)
  await viewer.getByRole('button', { name: '3D', exact: true }).click()
  await expect(page.getByTestId('baby-stage')).toHaveAttribute('data-photo-id', 'peace')
})
