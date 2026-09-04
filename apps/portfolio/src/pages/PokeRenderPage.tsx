import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import QRCode from 'qrcode'
import type { ResolvedRoute } from '../app/router'
import {
  createPokePayloadId,
  createPokeRenderUrl,
  decodePokePrototype,
  type PokeEasing,
  type PokeElement,
  type PokeElementState,
  type PokeInteraction,
  type PokePage,
  type PokePageAction,
  type PokePrototype,
  type PokeTrigger,
} from '../features/poke/protocol'

interface TransitionState extends PokePageAction {
  fromPageId: string
  phase: 'ready' | 'running'
}

interface ElementMotion {
  duration: number
  easing: PokeEasing
}

function transitionStyle(action: PokePageAction): CSSProperties {
  return {
    transitionDuration: `${action.duration}s`,
    transitionTimingFunction: action.easing,
  }
}

function elementStyle(
  item: PokeElement,
  state: PokeElementState,
  motion?: ElementMotion,
): CSSProperties {
  const isText = item.type === 'text'
  const isButton = item.type === 'rect' && Boolean(state.text)
  const isHeadline = /headline|title/i.test(`${item.id} ${item.name}`)
  const isBodyCopy = /description|copy/i.test(`${item.id} ${item.name}`)
  return {
    left: state.x,
    top: state.y,
    width: state.width,
    height: state.height,
    borderRadius: item.type === 'circle' ? '50%' : state.radius,
    background: isText ? 'transparent' : state.fill,
    color: isText ? state.fill : isButton ? '#fff' : '#556170',
    opacity: state.opacity / 100,
    fontFamily: isHeadline ? 'Georgia, Times New Roman, serif' : 'inherit',
    fontSize: isHeadline ? 29 : isBodyCopy ? 10 : 10,
    fontWeight: isButton ? 700 : isHeadline ? 500 : 500,
    lineHeight: isHeadline ? 1.03 : isBodyCopy ? 1.55 : 1.2,
    padding: isText ? 2 : isButton || item.type === 'input' ? '0 15px' : 0,
    justifyContent: isButton ? 'center' : 'flex-start',
    transitionDuration: motion ? `${motion.duration}s` : undefined,
    transitionTimingFunction: motion?.easing,
  }
}

function navContent(state: PokeElementState) {
  const names = (state.text || 'Home\nExplore\nProfile').split('\n').slice(0, 5)
  const icons = ['⌂', '◇', '○', '★', '＋']
  return names.map((name, index) => (
    <span key={`${name}-${index}`}>
      <b>{icons[index]}</b>
      <small>{name}</small>
    </span>
  ))
}

function PrototypeElement({
  item,
  state,
  interactions,
  motion,
  onInteraction,
}: {
  item: PokeElement
  state: PokeElementState
  interactions: PokeInteraction[]
  motion?: ElementMotion
  onInteraction: (interaction: PokeInteraction) => void
}) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const longPressTimer = useRef<number | null>(null)
  const clickTimer = useRef<number | null>(null)
  const suppressClick = useRef(false)

  const clearTimers = () => {
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current)
    if (clickTimer.current !== null) window.clearTimeout(clickTimer.current)
    longPressTimer.current = null
    clickTimer.current = null
  }

  useEffect(() => clearTimers, [])

  const eventFor = (trigger: PokeTrigger) =>
    interactions.find((interaction) => interaction.trigger === trigger)
  const fire = (trigger: PokeTrigger) => {
    const interaction = eventFor(trigger)
    if (interaction) onInteraction(interaction)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!interactions.length) return
    pointerStart.current = { x: event.clientX, y: event.clientY }
    suppressClick.current = false
    if (eventFor('touch')) {
      longPressTimer.current = window.setTimeout(() => {
        suppressClick.current = true
        fire('touch')
      }, 520)
    }
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current)
    longPressTimer.current = null
    if (!pointerStart.current) return
    const deltaX = event.clientX - pointerStart.current.x
    const deltaY = event.clientY - pointerStart.current.y
    pointerStart.current = null
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 30) return
    const direction: PokeTrigger =
      Math.abs(deltaX) > Math.abs(deltaY)
        ? deltaX < 0
          ? 'swipeLeft'
          : 'swipeRight'
        : deltaY < 0
          ? 'swipeUp'
          : 'swipeDown'
    if (eventFor(direction)) {
      suppressClick.current = true
      fire(direction)
      window.setTimeout(() => {
        suppressClick.current = false
      }, 0)
    }
  }

  const interactive = interactions.length > 0
  const hasSwipe = interactions.some((interaction) => interaction.trigger.startsWith('swipe'))
  const commonProps = {
    className: `poke-prototype-element is-${item.type}${interactive ? ' is-interactive' : ''}`,
    style: {
      ...elementStyle(item, state, motion),
      touchAction: hasSwipe ? 'none' : 'manipulation',
    },
    'data-element-id': item.id,
    'data-state-id': state.stateId,
    onPointerDown,
    onPointerUp,
    onPointerCancel: () => {
      pointerStart.current = null
      clearTimers()
    },
    onPointerLeave: () => {
      if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    },
    onContextMenu: (event: ReactMouseEvent<HTMLElement>) => {
      if (eventFor('touch')) event.preventDefault()
    },
  }

  const content = item.type === 'nav' ? navContent(state) : state.text || null
  if (!interactive) return <div {...commonProps}>{content}</div>

  return (
    <button
      type="button"
      {...commonProps}
      aria-label={`${item.name} · interaction target`}
      onClick={() => {
        if (suppressClick.current || !eventFor('click')) return
        if (eventFor('doubleClick')) {
          clickTimer.current = window.setTimeout(() => fire('click'), 240)
        } else {
          fire('click')
        }
      }}
      onDoubleClick={() => {
        if (!eventFor('doubleClick')) return
        if (clickTimer.current !== null) window.clearTimeout(clickTimer.current)
        clickTimer.current = null
        fire('doubleClick')
      }}
    >
      {content}
    </button>
  )
}

function PrototypePage({
  page,
  role,
  transition,
  stateIds,
  motions,
  interactionMap,
  onInteraction,
}: {
  page: PokePage
  role: 'current' | 'from' | 'to'
  transition: TransitionState | null
  stateIds: Record<string, string>
  motions: Record<string, ElementMotion>
  interactionMap: Map<string, PokeInteraction[]>
  onInteraction: (interaction: PokeInteraction) => void
}) {
  const effect = transition?.effect || 'fade'
  return (
    <section
      className={`poke-prototype-page is-${role}`}
      data-effect={effect}
      data-page-id={page.id}
      style={{
        background: page.background,
        ...(transition ? transitionStyle(transition) : {}),
      }}
      aria-hidden={role === 'from' ? true : undefined}
    >
      {page.elements.map((item) => {
        const stateId = stateIds[item.id] || '0'
        const state =
          item.states.find((candidate) => candidate.stateId === stateId) || item.states[0]
        return (
          <PrototypeElement
            key={item.id}
            item={item}
            state={state}
            interactions={interactionMap.get(`${item.id}:${state.stateId}`) || []}
            motion={motions[item.id]}
            onInteraction={onInteraction}
          />
        )
      })}
    </section>
  )
}

function useStageScale(width: number, height: number) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    const measure = () => {
      const bounds = host.getBoundingClientRect()
      setScale(Math.max(0.2, Math.min(bounds.width / width, bounds.height / height)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [height, width])

  return { hostRef, scale }
}

function initialElementStates(project: PokePrototype) {
  return Object.fromEntries(
    project.pages.flatMap((page) => page.elements.map((element) => [element.id, '0'])),
  )
}

function PokePrototypePlayer({
  project,
  payloadId,
}: {
  project: PokePrototype
  payloadId: string
}) {
  const pageMap = useMemo(
    () => new Map(project.pages.map((page) => [page.id, page])),
    [project.pages],
  )
  const interactionMap = useMemo(() => {
    const result = new Map<string, PokeInteraction[]>()
    project.interactions.forEach((interaction) => {
      const key = `${interaction.sourceId}:${interaction.sourceState}`
      result.set(key, [...(result.get(key) || []), interaction])
    })
    return result
  }, [project.interactions])
  const [currentPageId, setCurrentPageId] = useState(project.pages[0].id)
  const [stateIds, setStateIds] = useState<Record<string, string>>(() =>
    initialElementStates(project),
  )
  const [motions, setMotions] = useState<Record<string, ElementMotion>>({})
  const [transition, setTransition] = useState<TransitionState | null>(null)
  const busyRef = useRef(false)
  const animationFrame = useRef<number | null>(null)
  const transitionTimer = useRef<number | null>(null)
  const actionTimers = useRef(new Set<number>())
  const { hostRef, scale } = useStageScale(project.stage.width, project.stage.height)

  const clearTimers = useCallback(() => {
    if (animationFrame.current !== null) window.cancelAnimationFrame(animationFrame.current)
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current)
    actionTimers.current.forEach((timer) => window.clearTimeout(timer))
    actionTimers.current.clear()
    animationFrame.current = null
    transitionTimer.current = null
  }, [])

  useEffect(() => clearTimers, [clearTimers])
  useEffect(() => {
    window.parent.postMessage({ type: 'poke:runtime-ready', payloadId }, '*')
  }, [payloadId])

  const schedule = useCallback((action: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      actionTimers.current.delete(timer)
      action()
    }, Math.max(0, delay) * 1000)
    actionTimers.current.add(timer)
  }, [])

  const navigate = useCallback(
    (action: PokePageAction) => {
      if (
        busyRef.current ||
        action.targetPageId === currentPageId ||
        !pageMap.has(action.targetPageId)
      ) {
        return
      }
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reducedMotion) {
        setCurrentPageId(action.targetPageId)
        return
      }

      busyRef.current = true
      const next: TransitionState = {
        ...action,
        fromPageId: currentPageId,
        phase: 'ready',
      }
      setTransition(next)
      animationFrame.current = window.requestAnimationFrame(() => {
        animationFrame.current = window.requestAnimationFrame(() => {
          setTransition((active) => (active ? { ...active, phase: 'running' } : null))
        })
      })
      transitionTimer.current = window.setTimeout(
        () => {
          setCurrentPageId(action.targetPageId)
          setTransition(null)
          busyRef.current = false
        },
        action.duration * 1000 + 60,
      )
    },
    [currentPageId, pageMap],
  )

  const runInteraction = useCallback(
    (interaction: PokeInteraction) => {
      interaction.elementActions.forEach((action) => {
        schedule(() => {
          setMotions((current) => ({
            ...current,
            [action.targetId]: { duration: action.duration, easing: action.easing },
          }))
          setStateIds((current) => ({ ...current, [action.targetId]: action.targetState }))
        }, action.startTime)
      })
      if (interaction.pageAction) {
        const pageAction = interaction.pageAction
        schedule(() => navigate(pageAction), pageAction.startTime)
      }
    },
    [navigate, schedule],
  )

  const navigateFromTab = (targetPageId: string) => {
    const fromIndex = project.pages.findIndex((page) => page.id === currentPageId)
    const toIndex = project.pages.findIndex((page) => page.id === targetPageId)
    navigate({
      targetPageId,
      effect: toIndex < fromIndex ? 'push-right' : 'push-left',
      easing: 'ease-out',
      startTime: 0,
      duration: 0.28,
    })
  }

  const currentPage = pageMap.get(currentPageId) || project.pages[0]
  const fromPage = transition ? pageMap.get(transition.fromPageId) : null
  const toPage = transition ? pageMap.get(transition.targetPageId) : null
  const selectedPageId = transition?.targetPageId || currentPageId
  const pageProps = { stateIds, motions, interactionMap, onInteraction: runInteraction }

  return (
    <main className="poke-render-shell" aria-label={project.title}>
      <div className="poke-render-viewport" ref={hostRef}>
        <div
          className="poke-render-scaled-frame"
          style={{
            width: project.stage.width * scale,
            height: project.stage.height * scale,
          }}
        >
          <div
            className={`poke-prototype-stage${transition?.phase === 'running' ? ' is-running' : ''}`}
            data-payload-id={payloadId}
            style={{
              width: project.stage.width,
              height: project.stage.height,
              transform: `scale(${scale})`,
            }}
          >
            {transition && fromPage && toPage ? (
              <>
                <PrototypePage page={fromPage} role="from" transition={transition} {...pageProps} />
                <PrototypePage page={toPage} role="to" transition={transition} {...pageProps} />
              </>
            ) : (
              <PrototypePage page={currentPage} role="current" transition={null} {...pageProps} />
            )}

            <div
              className="poke-prototype-statusbar"
              style={{
                color: project.statusBar.color,
                background: project.statusBar.background,
              }}
            >
              <span>9:41</span>
              <span className="poke-status-icons" aria-hidden="true">▮▮▮ ◒ ▰</span>
            </div>
            <nav
              className="poke-prototype-tabbar"
              aria-label="Prototype pages"
              style={{ background: project.tabBar.background }}
            >
              {project.tabBar.tabs.map((tab) => {
                const selected = tab.pageId === selectedPageId
                return (
                  <button
                    type="button"
                    key={tab.id}
                    disabled={!tab.pageId}
                    aria-current={selected ? 'page' : undefined}
                    style={{
                      color: selected
                        ? project.tabBar.selectedColor
                        : project.tabBar.normalColor,
                    }}
                    onClick={() => {
                      if (tab.pageId) navigateFromTab(tab.pageId)
                    }}
                  >
                    <b aria-hidden="true">{tab.icon}</b>
                    <span>{tab.text}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="poke-render-restart"
        aria-label="返回原型首页并重置元素状态"
        onClick={() => {
          clearTimers()
          busyRef.current = false
          setTransition(null)
          setMotions({})
          setStateIds(initialElementStates(project))
          setCurrentPageId(project.pages[0].id)
        }}
      >
        ↺
      </button>
    </main>
  )
}

function PokeQrPreview({ encoded, payloadId }: { encoded: string; payloadId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)
  const target = useMemo(() => createPokeRenderUrl(encoded), [encoded])

  useLayoutEffect(() => {
    document.documentElement.classList.add('poke-qr-document')
    return () => document.documentElement.classList.remove('poke-qr-document')
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !encoded) return
    setError(false)
    try {
      canvas.dataset.qrVersion = String(
        QRCode.create(target, { errorCorrectionLevel: 'L' }).version,
      )
    } catch {
      setError(true)
      return
    }
    void QRCode.toCanvas(canvas, target, {
      width: 188,
      margin: 4,
      errorCorrectionLevel: 'L',
      color: { dark: '#172035', light: '#ffffff' },
    })
      .then(() => {
        window.parent.postMessage(
          { type: 'poke:qr-ready', payloadId },
          '*',
        )
      })
      .catch(() => {
        setError(true)
        window.parent.postMessage(
          { type: 'poke:qr-error', payloadId },
          '*',
        )
      })
  }, [encoded, payloadId, target])

  return (
    <main className="poke-qr-page" data-payload-id={payloadId}>
      {error || !encoded ? (
        <div className="poke-qr-error">预览数据过长，请减少画布元素后重试。</div>
      ) : (
        <>
          <canvas ref={canvasRef} aria-label="扫码打开手机预览" />
          <p>使用手机相机扫码</p>
          <small>交互与动效会随项目数据一起打开</small>
        </>
      )}
    </main>
  )
}

export function PokeRenderPage({ route }: { route: ResolvedRoute }) {
  const query = useMemo(() => new URLSearchParams(route.search), [route.search])
  const encoded = query.get('data') || ''
  const payloadId = useMemo(() => createPokePayloadId(encoded), [encoded])
  const qrOnly = query.get('qr') === '1'
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'ready'; project: PokePrototype }
    | { status: 'error' }
  >({ status: 'loading' })

  useEffect(() => {
    if (qrOnly) return
    let active = true
    if (!encoded) {
      setState({ status: 'error' })
      return
    }
    setState({ status: 'loading' })
    void decodePokePrototype(encoded)
      .then((project) => {
        if (active) setState({ status: 'ready', project })
      })
      .catch(() => {
        if (active) setState({ status: 'error' })
      })
    return () => {
      active = false
    }
  }, [encoded, qrOnly])

  if (qrOnly) return <PokeQrPreview encoded={encoded} payloadId={payloadId} />
  if (state.status === 'ready') {
    return <PokePrototypePlayer project={state.project} payloadId={payloadId} />
  }

  return (
    <main className="poke-render-state" aria-live="polite">
      {state.status === 'loading' ? (
        <div className="poke-render-loader" aria-label="正在打开 Poke 预览" />
      ) : (
        <div>
          <small>POKE LIVE PREVIEW</small>
          <h1>无法打开这份原型</h1>
          <p>链接中的预览数据缺失或已损坏。请回到 Poke 编辑器重新生成二维码。</p>
          <a href="/archive/poke-prototype-editor">返回 Poke 项目</a>
        </div>
      )}
    </main>
  )
}
