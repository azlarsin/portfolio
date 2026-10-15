import { readFile } from 'node:fs/promises'
import { test, expect, type Page } from '@playwright/test'

const errors = new WeakMap<Page, string[]>()
test.beforeEach(async ({ page }) => {
  errors.set(page, [])
  page.on('pageerror', (error) => errors.get(page)!.push(error.message))
  await page.setViewportSize({ width: 1440, height: 1000 })
})
test.afterEach(({ page }) => expect(errors.get(page)).toEqual([]))

async function openDemo(page: Page, experience: string) {
  await page.goto(`/demo?experience=${experience}`)
  return page.frameLocator('.demo-player-stage > iframe')
}

test('Poke saves a draft, round-trips a file, and preserves edits on invalid import', async ({ page }) => {
  const editor = await openDemo(page, 'poke-prototype-editor')
  const text = editor.locator('[data-prop="text"]')
  await text.fill('打开我的详情')
  await text.press('Tab')
  await editor.locator('[data-command="save"]').click()
  await expect(editor.locator('#toast')).toContainText('已保存到本机')
  await page.reload()
  await expect(text).toHaveValue('打开我的详情')

  const downloaded = page.waitForEvent('download')
  await editor.locator('[data-command="export"]').click()
  const download = await downloaded
  expect(download.suggestedFilename()).toBe('poke-project.json')
  const contents = await readFile((await download.path())!)
  const document = JSON.parse(contents.toString())
  expect(document.document.interactionEvents).toHaveLength(1)
  expect(document.document.elements.find((element: { id: string }) => element.id === 'cta').text).toBe('打开我的详情')

  await editor.locator('#resetExample').click()
  await editor.locator('#confirmOk').click()
  await expect(text).toHaveValue('打开详情 →')
  await editor.locator('#documentFile').setInputFiles({ name: 'project.json', mimeType: 'application/json', buffer: contents })
  await editor.locator('#confirmOk').click()
  await expect(text).toHaveValue('打开我的详情')
  await editor.locator('#documentFile').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{') })
  await expect(editor.locator('#toast')).toContainText('当前画布未改变')
  await expect(text).toHaveValue('打开我的详情')

  document.document.interactionEvents[0].elementActions[0].targetId = 'missing-element'
  await editor.locator('#documentFile').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(document)) })
  await expect(editor.locator('#toast')).toContainText('未替换当前画布')
  await expect(text).toHaveValue('打开我的详情')
  await editor.locator('#undo').click()
  await expect(text).toHaveValue('打开详情 →')
})

test('Poke reports unavailable storage and keeps export usable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError') } })
  })
  const editor = await openDemo(page, 'poke-prototype-editor')
  await editor.locator('[data-command="save"]').click()
  await expect(editor.locator('#toast')).toContainText('当前浏览器无法保存')
  const downloaded = page.waitForEvent('download')
  await editor.locator('[data-command="export"]').click()
  expect((await downloaded).suggestedFilename()).toBe('poke-project.json')
})

test('Poke preview runs its default interaction and returns to the first page', async ({ page }) => {
  const editor = await openDemo(page, 'poke-prototype-editor')
  await editor.locator('#preview').click()
  const preview = editor.frameLocator('#previewLiveFrame')
  await preview.locator('[data-element-id="cta"]').click()
  await expect(preview.locator('[data-page-id="details"]')).toBeVisible()
  await preview.locator('[data-element-id="details-back"]').click()
  await expect(preview.locator('[data-page-id="home"]')).toBeVisible()
})

test('Poke offers a working prototype on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const editor = await openDemo(page, 'poke-prototype-editor')
  await editor.locator('#mobilePreview').click()
  await editor.locator('[data-element-id="cta"]').click()
  await expect(editor.locator('[data-page-id="details"]')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('Agent asks for the missing product and opens the chosen product', async ({ page }) => {
  const lab = await openDemo(page, 'layered-route-agent')
  await expect(lab.locator('.agent-panel')).toBeVisible()
  await lab.locator('#agent-command').fill('打开订单 2')
  await lab.getByRole('button', { name: '查看步骤', exact: true }).click()
  await expect(lab.locator('.agent-clarification')).toContainText('哪个产品')
  await expect(lab.locator('.agent-clarification')).not.toContainText('99%')
  await lab.locator('.agent-clarification').getByRole('button', { name: 'Product 2', exact: true }).click()
  await lab.getByRole('button', { name: '运行任务', exact: true }).click()
  await expect(lab.getByRole('button', { name: '查看页面', exact: true })).toBeVisible({ timeout: 20_000 })
  await expect.poll(() => new URL(page.url()).searchParams.get('lab')).toBe('/product/2/order/2')
  await lab.getByRole('button', { name: '查看页面', exact: true }).click()
  await expect(lab.locator('[data-surface-id="/product/2/order/2"][data-reconstructible="true"]')).toBeVisible()
})

test('Agent route survives outer refresh and can be shared or opened separately', async ({ page }) => {
  const lab = await openDemo(page, 'layered-route-agent')
  await lab.locator('.agent-suggestions button').filter({ hasText: '进入编辑页' }).click()
  await lab.getByRole('button', { name: '运行任务', exact: true }).click()
  await expect(lab.getByRole('button', { name: '查看页面', exact: true })).toBeVisible({ timeout: 20_000 })
  await expect.poll(() => new URL(page.url()).searchParams.get('lab')).toBe('/product/1/order/2/edit')
  await page.reload()
  await expect(lab.locator('[data-surface-id="/product/1/order/2/edit"][data-reconstructible="true"]')).toBeVisible()
  await expect(lab.locator('[data-reconstructible="true"]')).toHaveCount(5)
  const standalone = new URL((await page.locator('.demo-player-open').getAttribute('href'))!)
  expect(standalone.searchParams.get('route') || standalone.pathname).toBe('/product/1/order/2/edit')
  expect(standalone.searchParams.has('embed')).toBe(false)

  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => Promise.reject(new Error('Denied')) }, configurable: true,
  }))
  await page.locator('.demo-player-share').click()
  await expect(page.locator('.demo-player-share-result input')).toHaveValue(page.url())
  const current = page.url()
  await page.evaluate(() => window.postMessage({ type: 'portfolio:lab-location', location: '/products' }, location.origin))
  await expect(page).toHaveURL(current)
})

test('the action graph opens a route from the actual Lab manifest', async ({ page }) => {
  const lab = await openDemo(page, 'layered-agent-action-graph')
  await expect(lab.getByRole('dialog', { name: 'Route Behavior Graph' })).toBeVisible()
  await expect(lab.getByRole('treeitem')).toHaveCount(35)
  await lab.getByRole('treeitem').filter({ hasText: '/product/2/order/2/fulfillment/tracking' }).click()
  await lab.getByRole('button', { name: '打开所选路由', exact: true }).click()
  await expect.poll(() => new URL(page.url()).searchParams.get('lab')).toBe('/product/2/order/2/fulfillment/tracking')
})

test('Bezier accepts values and keyboard adjustment, resets, and handles denied clipboard', async ({ page }) => {
  const bezier = await openDemo(page, 'bezier-easing-picker')
  await bezier.locator('#x1').fill('0.25')
  await bezier.locator('#startHandle').focus()
  await page.keyboard.press('ArrowRight')
  await expect(bezier.locator('#x1')).toHaveValue('0.26')
  await expect(bezier.locator('#code')).toContainText('cubic-bezier(0.26, 0, 1, 1)')
  await bezier.locator('#code').evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => Promise.reject(new Error('Denied')) }, configurable: true,
  }))
  await bezier.locator('#copy').click()
  await expect(bezier.locator('#copy')).toHaveText('已选中代码，请手动复制')
  expect(await bezier.locator('#code').evaluate(() => window.getSelection()?.toString())).toContain('cubic-bezier(0.26')
  await bezier.locator('#reset').click()
  await expect(bezier.locator('#x1')).toHaveValue('0.42')
})

test('geometry comparison preserves the computed result', async ({ page }) => {
  const geometry = await openDemo(page, 'irregular-shape-arrangement')
  await expect(geometry.locator('#status')).toContainText('已达到目标间距')
  const positions = await geometry.locator('#shapes > g').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('transform')))
  const gap = await geometry.locator('#measured-gap').textContent()
  await geometry.locator('#compare-before').check()
  await expect(geometry.locator('#scene')).toHaveAttribute('data-view', 'before')
  expect(await geometry.locator('#shapes > g').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('transform')))).not.toEqual(positions)
  await geometry.locator('#compare-before').uncheck()
  expect(await geometry.locator('#shapes > g').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('transform')))).toEqual(positions)
  await expect(geometry.locator('#measured-gap')).toHaveText(gap!)
})

test('DataView keeps the selected detail and map highlight synchronized after filtering', async ({ page }) => {
  const dataview = await openDemo(page, 'dataview-observatory')
  await expect(dataview.locator('[data-view-button="overview"]')).toHaveClass(/active/)
  await dataview.locator('[data-view-button="map"]').click()
  await dataview.locator('[data-family="alpha"]').click()
  const selected = dataview.locator('#mapNodes .selected')
  await expect(selected).toHaveCount(1)
  await expect(dataview.locator('#nodeDetail strong')).toHaveText((await selected.getAttribute('data-node'))!)
  await dataview.locator('[data-family="beta"]').click()
  await dataview.locator('[data-family="gamma"]').click()
  await expect(dataview.locator('#visibleNodeCount')).toHaveText('0')
  await expect(dataview.locator('#nodeDetail')).toContainText('NO VISIBLE NODE')
  await expect(selected).toHaveCount(0)
})
