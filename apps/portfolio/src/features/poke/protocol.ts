export const POKE_PREVIEW_VERSION = 3 as const
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

export interface PokeElementState {
  stateId: string
  x: number
  y: number
  width: number
  height: number
  fill: string
  radius: number
  opacity: number
  rotation: number
  text?: string
}

export interface PokeElement {
  id: string
  name: string
  type: PokeElementType
  states: PokeElementState[]
}

export interface PokePage {
  id: string
  name: string
  background: string
  elements: PokeElement[]
}

export interface PokeElementAction {
  targetId: string
  targetState: string
  startTime: number
  duration: number
  easing: PokeEasing
}

export interface PokePageAction {
  targetPageId: string
  effect: PokeTransitionEffect
  startTime: number
  duration: number
  easing: PokeEasing
}

export interface PokeInteraction {
  sourceId: string
  sourceState: string
  trigger: PokeTrigger
  elementActions: PokeElementAction[]
  pageAction: PokePageAction | null
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

function normalizeEasing(value: unknown): PokeEasing {
  return easings.has(value as PokeEasing) ? (value as PokeEasing) : 'ease-out'
}

function normalizeEffect(value: unknown): PokeTransitionEffect {
  return effects.has(value as PokeTransitionEffect)
    ? (value as PokeTransitionEffect)
    : 'push-left'
}

function normalizeState(
  value: Record<string, unknown>,
  fallbackId: string,
  stageWidth: number,
  stageHeight: number,
): PokeElementState {
  const result: PokeElementState = {
    stateId: text(value.stateId, fallbackId, 20),
    x: number(value.x, 0, -stageWidth * 2, stageWidth * 3),
    y: number(value.y, 0, -stageHeight * 2, stageHeight * 3),
    width: number(value.width, 80, 1, stageWidth * 3),
    height: number(value.height, 44, 1, stageHeight * 3),
    fill: color(value.fill, '#dfe6f2'),
    radius: number(value.radius, 0, 0, 999),
    opacity: number(value.opacity, 100, 0, 100),
    rotation: number(value.rotation, 0, -360, 360),
  }
  if (typeof value.text === 'string') result.text = value.text.slice(0, 280)
  return result
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
  const legacyInitial = normalizeState(
    {
      ...value,
      stateId: '0',
      fill: color(value.fill, type === 'text' ? '#202735' : '#dfe6f2'),
    },
    '0',
    stageWidth,
    stageHeight,
  )
  const rawStates = Array.isArray(value.states) ? value.states : []
  const seenStates = new Set<string>()
  const states = rawStates.slice(0, 3).flatMap((rawState, stateIndex) => {
    if (!isRecord(rawState)) return []
    const state = normalizeState(rawState, String(stateIndex), stageWidth, stageHeight)
    if (seenStates.has(state.stateId)) return []
    seenStates.add(state.stateId)
    return [state]
  })

  if (!seenStates.has('0')) states.unshift(legacyInitial)
  states.sort((left, right) => {
    if (left.stateId === '0') return -1
    if (right.stateId === '0') return 1
    return Number(left.stateId) - Number(right.stateId)
  })

  return {
    id: text(value.id, `element-${index}`, 80),
    name: text(value.name, `Element ${index + 1}`, 100),
    type,
    states: states.slice(0, 3),
  }
}

function normalizePageAction(
  value: unknown,
  pageIds: Set<string>,
): PokePageAction | null {
  if (!isRecord(value)) return null
  const targetPageId = text(value.targetPageId, '', 80)
  if (!pageIds.has(targetPageId)) return null
  return {
    targetPageId,
    effect: normalizeEffect(value.effect),
    startTime: number(value.startTime, 0, 0, 5),
    duration: number(value.duration ?? value.endTime, 0.35, 0.05, 3),
    easing: normalizeEasing(value.easing),
  }
}

export function normalizePokePrototype(value: unknown): PokePrototype | null {
  if (!isRecord(value) || ![1, 2, 3].includes(Number(value.version))) return null

  const rawStage = isRecord(value.stage) ? value.stage : {}
  const stageWidth = number(rawStage.width, 280, 240, 1024)
  const stageHeight = number(rawStage.height, 522, 360, 1366)
  if (!Array.isArray(value.pages) || value.pages.length === 0) return null

  const pageIds = new Set<string>()
  const pages = value.pages.slice(0, 12).flatMap((rawPage, pageIndex) => {
    if (!isRecord(rawPage)) return []
    let id = text(rawPage.id, `page-${pageIndex}`, 80)
    if (pageIds.has(id)) id = `${id}-${pageIndex}`
    pageIds.add(id)
    const rawElements = Array.isArray(rawPage.elements) ? rawPage.elements : []
    const seenElements = new Set<string>()
    const elements = rawElements.slice(0, 180).flatMap((rawElement, elementIndex) => {
      const element = normalizeElement(rawElement, elementIndex, stageWidth, stageHeight)
      if (!element || seenElements.has(element.id)) return []
      seenElements.add(element.id)
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
      typeof rawTab.pageId === 'string' && pageIds.has(rawTab.pageId)
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

  const elements = pages.flatMap((page) => page.elements)
  const elementMap = new Map(elements.map((element) => [element.id, element]))
  const elementPage = new Map(
    pages.flatMap((page) => page.elements.map((element) => [element.id, page.id] as const)),
  )
  const rawInteractions = Array.isArray(value.interactions) ? value.interactions : []
  const interactions = rawInteractions.slice(0, 180).flatMap((rawEvent): PokeInteraction[] => {
    if (!isRecord(rawEvent)) return []
    const sourceId = text(rawEvent.sourceId, '', 80)
    const source = elementMap.get(sourceId)
    if (!source) return []
    const sourceStateCandidate = text(rawEvent.sourceState, '0', 20)
    const sourceState = source.states.some((state) => state.stateId === sourceStateCandidate)
      ? sourceStateCandidate
      : '0'
    const trigger = triggers.has(rawEvent.trigger as PokeTrigger)
      ? (rawEvent.trigger as PokeTrigger)
      : 'click'

    if (value.version === 1 || 'targetPageId' in rawEvent) {
      const legacyPageAction = normalizePageAction(
        { ...rawEvent, startTime: 0, duration: rawEvent.duration },
        pageIds,
      )
      return legacyPageAction
        ? [{ sourceId, sourceState, trigger, elementActions: [], pageAction: legacyPageAction }]
        : []
    }

    const rawElementActions = Array.isArray(rawEvent.elementActions)
      ? rawEvent.elementActions
      : []
    const elementActions = rawElementActions.slice(0, 32).flatMap(
      (rawAction): PokeElementAction[] => {
        if (!isRecord(rawAction)) return []
        const targetId = text(rawAction.targetId, '', 80)
        const target = elementMap.get(targetId)
        const targetState = text(rawAction.targetState, '0', 20)
        if (
          !target ||
          elementPage.get(targetId) !== elementPage.get(sourceId) ||
          !target.states.some((state) => state.stateId === targetState)
        ) {
          return []
        }
        return [
          {
            targetId,
            targetState,
            startTime: number(rawAction.startTime, 0, 0, 5),
            duration: number(rawAction.duration, 0.3, 0.05, 3),
            easing: normalizeEasing(rawAction.easing),
          },
        ]
      },
    )
    const pageAction = normalizePageAction(rawEvent.pageAction, pageIds)
    if (!elementActions.length && !pageAction) return []
    return [{ sourceId, sourceState, trigger, elementActions, pageAction }]
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

const elementTypeCodes: Record<PokeElementType, string> = {
  rect: 'r',
  circle: 'c',
  text: 't',
  image: 'i',
  input: 'n',
  nav: 'v',
}
const triggerCodes: Record<PokeTrigger, string> = {
  click: 'c',
  doubleClick: 'd',
  touch: 'h',
  swipeLeft: 'l',
  swipeRight: 'r',
  swipeUp: 'u',
  swipeDown: 'n',
}
const effectCodes: Record<PokeTransitionEffect, string> = {
  'push-left': 'l',
  'push-right': 'r',
  'push-up': 'u',
  'push-down': 'd',
  fade: 'f',
  modal: 'm',
}
const easingCodes: Record<PokeEasing, string> = {
  'ease-out': 'o',
  'ease-in-out': 'b',
  linear: 'l',
}

function reverseCodes<T extends string>(codes: Record<T, string>) {
  return Object.fromEntries(Object.entries(codes).map(([key, code]) => [code, key])) as Record<
    string,
    T
  >
}

const elementTypesByCode = reverseCodes(elementTypeCodes)
const triggersByCode = reverseCodes(triggerCodes)
const effectsByCode = reverseCodes(effectCodes)
const easingsByCode = reverseCodes(easingCodes)

function compactPokePrototype(project: PokePrototype) {
  return [
    POKE_PREVIEW_VERSION,
    [project.stage.width, project.stage.height],
    [project.statusBar.color, project.statusBar.background],
    [
      project.tabBar.background,
      project.tabBar.normalColor,
      project.tabBar.selectedColor,
      project.tabBar.tabs.map((tab) => [tab.text, tab.icon, tab.pageId]),
    ],
    project.pages.map((page) => [
      page.id,
      page.background,
      page.elements.map((element) => [
        element.id,
        elementTypeCodes[element.type],
        element.states.map((state) => [
          state.stateId,
          state.x,
          state.y,
          state.width,
          state.height,
          state.fill,
          state.radius,
          state.opacity,
          state.rotation,
          state.text ?? null,
        ]),
      ]),
    ]),
    project.interactions.map((interaction) => [
      interaction.sourceId,
      interaction.sourceState,
      triggerCodes[interaction.trigger],
      interaction.elementActions.map((action) => [
        action.targetId,
        action.targetState,
        action.startTime,
        action.duration,
        easingCodes[action.easing],
      ]),
      interaction.pageAction
        ? [
            interaction.pageAction.targetPageId,
            effectCodes[interaction.pageAction.effect],
            interaction.pageAction.startTime,
            interaction.pageAction.duration,
            easingCodes[interaction.pageAction.easing],
          ]
        : null,
    ]),
  ]
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function expandCompactPokePrototype(value: unknown) {
  const root = array(value)
  const stage = array(root[1])
  const statusBar = array(root[2])
  const tabBar = array(root[3])
  const pages = array(root[4])
  const interactions = array(root[5])
  const compactVersion = Number(root[0])
  return {
    version: root[0],
    title: 'Poke Prototype',
    stage: { width: stage[0], height: stage[1] },
    statusBar: { color: statusBar[0], background: statusBar[1] },
    tabBar: {
      background: tabBar[0],
      normalColor: tabBar[1],
      selectedColor: tabBar[2],
      tabs: array(tabBar[3]).map((rawTab, tabIndex) => {
        const tab = array(rawTab)
        return { id: `tab-${tabIndex}`, text: tab[0], icon: tab[1], pageId: tab[2] }
      }),
    },
    pages: pages.map((rawPage) => {
      const page = array(rawPage)
      return {
        id: page[0],
        name: page[0],
        background: page[1],
        elements: array(page[2]).map((rawElement) => {
          const element = array(rawElement)
          return {
            id: element[0],
            name: element[0],
            type: elementTypesByCode[String(element[1])],
            states: array(element[2]).map((rawState) => {
              const state = array(rawState)
              return {
                stateId: state[0],
                x: state[1],
                y: state[2],
                width: state[3],
                height: state[4],
                fill: state[5],
                radius: state[6],
                opacity: state[7],
                rotation: compactVersion >= 3 ? state[8] : 0,
                text: compactVersion >= 3 ? state[9] : state[8],
              }
            }),
          }
        }),
      }
    }),
    interactions: interactions.map((rawInteraction) => {
      const interaction = array(rawInteraction)
      const rawPageAction = Array.isArray(interaction[4]) ? interaction[4] : null
      return {
        sourceId: interaction[0],
        sourceState: interaction[1],
        trigger: triggersByCode[String(interaction[2])],
        elementActions: array(interaction[3]).map((rawAction) => {
          const action = array(rawAction)
          return {
            targetId: action[0],
            targetState: action[1],
            startTime: action[2],
            duration: action[3],
            easing: easingsByCode[String(action[4])],
          }
        }),
        pageAction: rawPageAction
          ? {
              targetPageId: rawPageAction[0],
              effect: effectsByCode[String(rawPageAction[1])],
              startTime: rawPageAction[2],
              duration: rawPageAction[3],
              easing: easingsByCode[String(rawPageAction[4])],
            }
          : null,
      }
    }),
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
  const raw = new TextEncoder().encode(JSON.stringify(compactPokePrototype(normalized)))

  if (typeof CompressionStream !== 'undefined') {
    const compressed = await transformBytes(raw, new CompressionStream('gzip'))
    if (compressed.length < raw.length) return `c.${bytesToBase64Url(compressed)}`
  }
  return `k.${bytesToBase64Url(raw)}`
}

export async function decodePokePrototype(encoded: string) {
  if (!encoded || encoded.length > 64_000) {
    throw new Error('Poke preview data is empty or too large.')
  }
  const separator = encoded.indexOf('.')
  if (separator < 1) throw new Error('Poke preview data has an unknown format.')
  const mode = encoded.slice(0, separator)
  let bytes = base64UrlToBytes(encoded.slice(separator + 1))

  if (mode === 'g' || mode === 'c') {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('This browser cannot open compressed Poke previews.')
    }
    bytes = await transformBytes(bytes, new DecompressionStream('gzip'))
  } else if (mode !== 'j' && mode !== 'k') {
    throw new Error('Poke preview data has an unknown format.')
  }

  if (bytes.length > 1_000_000) {
    throw new Error('Poke preview data expands beyond the supported size.')
  }

  const parsed = JSON.parse(new TextDecoder().decode(bytes))
  const decoded = normalizePokePrototype(
    mode === 'c' || mode === 'k' ? expandCompactPokePrototype(parsed) : parsed,
  )
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

export function createPokePayloadId(encoded: string) {
  let hash = 2166136261
  for (let index = 0; index < encoded.length; index += 1) {
    hash ^= encoded.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0').toUpperCase()
}
