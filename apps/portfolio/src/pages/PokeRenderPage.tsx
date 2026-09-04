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
  createPokeRenderUrl,
  decodePokePrototype,
  type PokeElement,
  type PokeInteraction,
  type PokePage,
  type PokePrototype,
  type PokeTransitionEffect,
} from '../features/poke/protocol'

interface TransitionState extends PokeInteraction {
  fromPageId: string
  phase: 'ready' | 'running'
}

function transitionStyle(interaction: PokeInteraction): CSSProperties {
  return {
    transitionDuration: `${interaction.duration}s`,
    transitionTimingFunction: interaction.easing,
  }
}

function elementStyle(item: PokeElement): CSSProperties {
  const isText = item.type === 'text'
  const isButton = item.type === 'rect' && Boolean(item.text)
  const isHeadline = /headline|title/i.test(`${item.id} ${item.name}`)
  const isBodyCopy = /description|copy/i.test(`${item.id} ${item.name}`)
  return {
    left: item.x,
    top: item.y,
    width: item.width,
    height: item.height,
    borderRadius: item.type === 'circle' ? '50%' : item.radius,
    background: isText ? 'transparent' : item.fill,
    color: isText ? item.fill : isButton ? '#fff' : '#556170',
    opacity: item.opacity / 100,
    fontFamily: isHeadline ? 'Georgia, Times New Roman, serif' : 'inherit',
    fontSize: isHeadline ? 29 : isBodyCopy ? 10 : 10,
    fontWeight: isButton ? 700 : isHeadline ? 500 : 500,
    lineHeight: isHeadline ? 1.03 : isBodyCopy ? 1.55 : 1.2,
    padding: isText ? 2 : isButton || item.type === 'input' ? '0 15px' : 0,
    justifyContent: isButton ? 'center' : 'flex-start',
    touchAction: 'manipulation',
  }
}

function navContent(item: PokeElement) {
  const names = (item.text || 'Home\nExplore\nProfile').split('\n').slice(0, 5)
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
  interaction,
  onInteraction,
}: {
  item: PokeElement
  interaction?: PokeInteraction
  onInteraction: (interaction: PokeInteraction) => void
}) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const longPressTimer = useRef<number | null>(null)
  const longPressFired = useRef(false)

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  useEffect(() => clearLongPress, [])

  const fire = () => {
    if (interaction) onInteraction(interaction)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!interaction) return
    pointerStart.current = { x: event.clientX, y: event.clientY }
    longPressFired.current = false
    if (interaction.trigger === 'touch') {
      longPressTimer.current = window.setTimeout(() => {
        longPressFired.current = true
        fire()
      }, 520)
    }
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    clearLongPress()
    if (!interaction || !pointerStart.current) return
    const deltaX = event.clientX - pointerStart.current.x
    const deltaY = event.clientY - pointerStart.current.y
    pointerStart.current = null
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 30) return
    const direction =
      Math.abs(deltaX) > Math.abs(deltaY)
        ? deltaX < 0
          ? 'swipeLeft'
          : 'swipeRight'
        : deltaY < 0
          ? 'swipeUp'
          : 'swipeDown'
    if (interaction.trigger === direction) fire()
  }

  const commonProps = {
    className: `poke-prototype-element is-${item.type}${interaction ? ' is-interactive' : ''}`,
    style: {
      ...elementStyle(item),
      touchAction: interaction?.trigger.startsWith('swipe') ? 'none' : 'manipulation',
    },
    'data-element-id': item.id,
    onPointerDown,
    onPointerUp,
    onPointerCancel: () => {
      pointerStart.current = null
      clearLongPress()
    },
    onPointerLeave: clearLongPress,
    onContextMenu: (event: ReactMouseEvent<HTMLElement>) => {
      if (interaction?.trigger === 'touch') event.preventDefault()
    },
  }

  const content = item.type === 'nav' ? navContent(item) : item.text || null
  if (!interaction) return <div {...commonProps}>{content}</div>

  return (
    <button
      type="button"
      {...commonProps}
      aria-label={`${item.name} · ${interaction.trigger}`}
      onClick={() => {
        if (interaction.trigger === 'click' && !longPressFired.current) fire()
      }}
      onDoubleClick={() => {
        if (interaction.trigger === 'doubleClick') fire()
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
  interactions,
  onInteraction,
}: {
  page: PokePage
  role: 'current' | 'from' | 'to'
  transition: TransitionState | null
  interactions: Map<string, PokeInteraction>
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
      {page.elements.map((item) => (
        <PrototypeElement
          key={item.id}
          item={item}
          interaction={interactions.get(item.id)}
          onInteraction={onInteraction}
        />
      ))}
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

function PokePrototypePlayer({ project }: { project: PokePrototype }) {
  const pageMap = useMemo(
    () => new Map(project.pages.map((page) => [page.id, page])),
    [project.pages],
  )
  const interactions = useMemo(
    () => new Map(project.interactions.map((event) => [event.sourceId, event])),
    [project.interactions],
  )
  const [currentPageId, setCurrentPageId] = useState(project.pages[0].id)
  const [transition, setTransition] = useState<TransitionState | null>(null)
  const busyRef = useRef(false)
  const animationFrame = useRef<number | null>(null)
  const transitionTimer = useRef<number | null>(null)
  const { hostRef, scale } = useStageScale(project.stage.width, project.stage.height)

  const clearTransitionHandles = useCallback(() => {
    if (animationFrame.current !== null) window.cancelAnimationFrame(animationFrame.current)
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current)
    animationFrame.current = null
    transitionTimer.current = null
  }, [])

  useEffect(() => clearTransitionHandles, [clearTransitionHandles])

  const navigate = useCallback(
    (interaction: PokeInteraction) => {
      if (
        busyRef.current ||
        interaction.targetPageId === currentPageId ||
        !pageMap.has(interaction.targetPageId)
      ) {
        return
      }
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reducedMotion) {
        setCurrentPageId(interaction.targetPageId)
        return
      }

      busyRef.current = true
      const next: TransitionState = {
        ...interaction,
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
          setCurrentPageId(interaction.targetPageId)
          setTransition(null)
          busyRef.current = false
        },
        interaction.duration * 1000 + 60,
      )
    },
    [currentPageId, pageMap],
  )

  const navigateFromTab = (targetPageId: string) => {
    const fromIndex = project.pages.findIndex((page) => page.id === currentPageId)
    const toIndex = project.pages.findIndex((page) => page.id === targetPageId)
    navigate({
      sourceId: 'tab-bar',
      trigger: 'click',
      targetPageId,
      effect: toIndex < fromIndex ? 'push-right' : 'push-left',
      easing: 'ease-out',
      duration: 0.28,
    })
  }

  const currentPage = pageMap.get(currentPageId) || project.pages[0]
  const fromPage = transition ? pageMap.get(transition.fromPageId) : null
  const toPage = transition ? pageMap.get(transition.targetPageId) : null
  const selectedPageId = transition?.targetPageId || currentPageId

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
            style={{
              width: project.stage.width,
              height: project.stage.height,
              transform: `scale(${scale})`,
            }}
          >
            {transition && fromPage && toPage ? (
              <>
                <PrototypePage
                  page={fromPage}
                  role="from"
                  transition={transition}
                  interactions={interactions}
                  onInteraction={navigate}
                />
                <PrototypePage
                  page={toPage}
                  role="to"
                  transition={transition}
                  interactions={interactions}
                  onInteraction={navigate}
                />
              </>
            ) : (
              <PrototypePage
                page={currentPage}
                role="current"
                transition={null}
                interactions={interactions}
                onInteraction={navigate}
              />
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
        aria-label="返回原型首页"
        onClick={() => {
          clearTransitionHandles()
          busyRef.current = false
          setTransition(null)
          setCurrentPageId(project.pages[0].id)
        }}
      >
        ↺
      </button>
    </main>
  )
}

function PokeQrPreview({ encoded }: { encoded: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)
  const target = useMemo(() => createPokeRenderUrl(encoded), [encoded])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !encoded) return
    setError(false)
    void QRCode.toCanvas(canvas, target, {
      width: 224,
      margin: 2,
      errorCorrectionLevel: 'L',
      color: { dark: '#172035', light: '#ffffff' },
    }).catch(() => setError(true))
  }, [encoded, target])

  return (
    <main className="poke-qr-page">
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

  if (qrOnly) return <PokeQrPreview encoded={encoded} />
  if (state.status === 'ready') return <PokePrototypePlayer project={state.project} />

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
