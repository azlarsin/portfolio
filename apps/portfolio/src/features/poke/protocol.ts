export const POKE_PREVIEW_VERSION = 1 as const
export const POKE_RENDER_PATH = '/poke/render'
export const POKE_CANONICAL_ORIGIN = 'https://me.azlar.cc'

export type PokeElementType =
  | 'rect'
  | 'circle'
  | 'text'
  | 'image'
  | 'input'
  | 'nav'

export type PokeTrigger =
  | 'click'
  | 'doubleClick'
  | 'touch'
  | 'swipeLeft'
  | 'swipeRight'
  | 'swipeUp'
  | 'swipeDown'

export type PokeTransitionEffect =
  | 'push-left'
  | 'push-right'
  | 'push-up'
  | 'push-down'
  | 'fade'
  | 'modal'

export type PokeEasing = 'ease-out' | 'ease-in-out' | 'linear'

export interface PokeElement {
  id: string
  name: string
  type: PokeElementType
  x: number
  y: number
  width: number
  height: number
  fill: string
  radius: number
  opacity: number
  text?: string
}

export interface PokePage {
  id: string
  name: string
  background: string
  elements: PokeElement[]
}

export interface PokeInteraction {
  sourceId: string
  trigger: PokeTrigger
  targetPageId: string
  effect: PokeTransitionEffect
  easing: PokeEasing
  duration: number
}

export interface PokeTab {
  id: string
  text: string
  icon: string
  pageId: string | null
}

export interface PokePrototype {
  version: typeof POKE_PREVIEW_VERSION
  title: string
  stage: {
    width: number
    height: number
  }
  statusBar: {
    color: string
    background: string
  }
  tabBar: {
    background: string
    normalColor: string
    selectedColor: string
    tabs: PokeTab[]
  }
  pages: PokePage[]
  interactions: PokeInteraction[]
}

const elementTypes = new Set<PokeElementType>([
  'rect',
  'circle',
  'text',
  'image',
  'input',
  'nav',
])
const triggers = new Set<PokeTrigger>([
  'click',
  'doubleClick',
  'touch',
  'swipeLeft',
  'swipeRight',
  'swipeUp',
  'swipeDown',
])
const effects = new Set<PokeTransitionEffect>([
  'push-left',
  'push-right',
  'push-up',
  'push-down',
  'fade',
  'modal',
])
const easings = new Set<PokeEasing>(['ease-out', 'ease-in-out', 'linear'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown, fallback: string, maximum = 120) {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, maximum)
    : fallback
}

function number(value: unknown, fallback: number, minimum: number, maximum: number) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed)
    ? Math.min(maximum, Math.max(minimum, parsed))
    : fallback
}

function color(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback
  const candidate = value.trim()
  if (/^#[\da-f]{3,8}$/i.test(candidate)) return candidate
  if (/^rgba?\([\d\s.,%]+\)$/i.test(candidate)) return candidate
  return fallback
}

function normalizeElement(
  value: unknown,
  index: number,
  stageWidth: number,
  stageHeight: number,
): PokeElement | null {
  if (!isRecord(value) || !elementTypes.has(value.type as PokeElementType)) {
    return null
  }

  const type = value.type as PokeElementType
  const width = number(value.width, 80, 1, stageWidth * 3)
  const height = number(value.height, 44, 1, stageHeight * 3)
  const result: PokeElement = {
    id: text(value.id, `element-${index}`, 80),
    name: text(value.name, `Element ${index + 1}`, 100),
    type,
    x: number(value.x, 0, -stageWidth * 2, stageWidth * 3),
    y: number(value.y, 0, -stageHeight * 2, stageHeight * 3),
    width,
    height,
    fill: color(value.fill, type === 'text' ? '#202735' : '#dfe6f2'),
    radius: number(value.radius, type === 'circle' ? 50 : 0, 0, 999),
    opacity: number(value.opacity, 100, 0, 100),
  }

  if (typeof value.text === 'string') {
    result.text = value.text.slice(0, 280)
  }
  return result
}

export function normalizePokePrototype(value: unknown): PokePrototype | null {
  if (!isRecord(value) || value.version !== POKE_PREVIEW_VERSION) return null

  const rawStage = isRecord(value.stage) ? value.stage : {}
  const stageWidth = number(rawStage.width, 280, 240, 1024)
  const stageHeight = number(rawStage.height, 522, 360, 1366)
  if (!Array.isArray(value.pages) || value.pages.length === 0) return null

  const seenPageIds = new Set<string>()
  const pages = value.pages.slice(0, 12).flatMap((rawPage, pageIndex) => {
    if (!isRecord(rawPage)) return []
    let id = text(rawPage.id, `page-${pageIndex}`, 80)
    if (seenPageIds.has(id)) id = `${id}-${pageIndex}`
    seenPageIds.add(id)
    const rawElements = Array.isArray(rawPage.elements) ? rawPage.elements : []
    const seenElementIds = new Set<string>()
    const elements = rawElements.slice(0, 180).flatMap((rawElement, elementIndex) => {
      const element = normalizeElement(rawElement, elementIndex, stageWidth, stageHeight)
      if (!element || seenElementIds.has(element.id)) return []
      seenElementIds.add(element.id)
      return [element]
    })
    return [
      {
        id,
        name: text(rawPage.name, `Page ${pageIndex + 1}`, 80),
        background: color(rawPage.background, '#f8f9fc'),
        elements,
      },
    ]
  })
  if (!pages.length) return null

  const statusBar = isRecord(value.statusBar) ? value.statusBar : {}
  const rawTabBar = isRecord(value.tabBar) ? value.tabBar : {}
  const rawTabs = Array.isArray(rawTabBar.tabs) ? rawTabBar.tabs : []
  const tabs = rawTabs.slice(0, 5).flatMap((rawTab, tabIndex): PokeTab[] => {
    if (!isRecord(rawTab)) return []
    const pageId =
      typeof rawTab.pageId === 'string' && seenPageIds.has(rawTab.pageId)
        ? rawTab.pageId
        : null
    return [
      {
        id: text(rawTab.id, `tab-${tabIndex}`, 80),
        text: text(rawTab.text, `Tab ${tabIndex + 1}`, 28),
        icon: text(rawTab.icon, '○', 4),
        pageId,
      },
    ]
  })

  const elementIds = new Set(pages.flatMap((page) => page.elements.map((item) => item.id)))
  const rawInteractions = Array.isArray(value.interactions) ? value.interactions : []
  const interactions = rawInteractions.slice(0, 180).flatMap((rawEvent): PokeInteraction[] => {
    if (!isRecord(rawEvent)) return []
    const sourceId = text(rawEvent.sourceId, '', 80)
    const targetPageId = text(rawEvent.targetPageId, '', 80)
    if (!elementIds.has(sourceId) || !seenPageIds.has(targetPageId)) return []
    const trigger = triggers.has(rawEvent.trigger as PokeTrigger)
      ? (rawEvent.trigger as PokeTrigger)
      : 'click'
    const effect = effects.has(rawEvent.effect as PokeTransitionEffect)
      ? (rawEvent.effect as PokeTransitionEffect)
      : 'push-left'
    const easing = easings.has(rawEvent.easing as PokeEasing)
      ? (rawEvent.easing as PokeEasing)
      : 'ease-out'
    return [
      {
        sourceId,
        targetPageId,
        trigger,
        effect,
        easing,
        duration: number(rawEvent.duration, 0.35, 0.08, 2.4),
      },
    ]
  })

  return {
    version: POKE_PREVIEW_VERSION,
    title: text(value.title, 'Poke Prototype', 100),
    stage: { width: stageWidth, height: stageHeight },
    statusBar: {
      color: color(statusBar.color, '#667080'),
      background: color(statusBar.background, '#ffffff'),
    },
    tabBar: {
      background: color(rawTabBar.background, '#ffffff'),
      normalColor: color(rawTabBar.normalColor, '#8b95a5'),
      selectedColor: color(rawTabBar.selectedColor, '#2e67dd'),
      tabs: tabs.length
        ? tabs
        : [{ id: 'tab-home', text: 'Home', icon: '⌂', pageId: pages[0].id }],
    },
    pages,
    interactions,
  }
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function transformBytes(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
) {
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
  const transformed = new Blob([buffer])
    .stream()
    .pipeThrough(stream as unknown as TransformStream<Uint8Array, Uint8Array>)
  return new Uint8Array(await new Response(transformed).arrayBuffer())
}

export async function encodePokePrototype(project: PokePrototype) {
  const normalized = normalizePokePrototype(project)
  if (!normalized) throw new Error('Poke preview data is invalid.')
  const raw = new TextEncoder().encode(JSON.stringify(normalized))

  if (typeof CompressionStream !== 'undefined') {
    const compressed = await transformBytes(raw, new CompressionStream('gzip'))
    if (compressed.length < raw.length) return `g.${bytesToBase64Url(compressed)}`
  }
  return `j.${bytesToBase64Url(raw)}`
}

export async function decodePokePrototype(encoded: string) {
  if (!encoded || encoded.length > 64_000) {
    throw new Error('Poke preview data is empty or too large.')
  }
  const separator = encoded.indexOf('.')
  if (separator < 1) throw new Error('Poke preview data has an unknown format.')
  const mode = encoded.slice(0, separator)
  let bytes = base64UrlToBytes(encoded.slice(separator + 1))

  if (mode === 'g') {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('This browser cannot open compressed Poke previews.')
    }
    bytes = await transformBytes(bytes, new DecompressionStream('gzip'))
  } else if (mode !== 'j') {
    throw new Error('Poke preview data has an unknown format.')
  }

  if (bytes.length > 1_000_000) {
    throw new Error('Poke preview data expands beyond the supported size.')
  }

  const decoded = normalizePokePrototype(JSON.parse(new TextDecoder().decode(bytes)))
  if (!decoded) throw new Error('Poke preview data is incomplete.')
  return decoded
}

export function createPokeRenderUrl(
  encoded: string,
  origin = POKE_CANONICAL_ORIGIN,
) {
  const url = new URL(POKE_RENDER_PATH, origin)
  url.searchParams.set('data', encoded)
  return url.toString()
}
