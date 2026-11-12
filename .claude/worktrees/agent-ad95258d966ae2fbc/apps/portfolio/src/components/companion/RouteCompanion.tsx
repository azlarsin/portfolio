import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { navigate, type ResolvedRoute } from '../../app/router'
import { useLanguage } from '../../i18n/LanguageContext'
import { useMediaQuery } from '../common/useMediaQuery'
import { CompanionVisual } from './CompanionVisual'
import { CompanionStyleSwitch, useCompanionStyle } from './CompanionPreference'
import { CompanionFragments, dispatchFragments } from './CompanionFragments'
import { COMPANION_POSE_EVENT, COMPANION_SELECT_EVENT, COMPANION_TRANSITION_END, isCompanionPose, nextCompanionPose, poseForSection, poseForStyle, poseLabel, type CompanionPose } from './companionPoses'
import { makeTrajectory, type TrajectoryName } from './companionTrajectory'

type Rect = { left: number; top: number; width: number; height: number }
type Placement = 'hero' | 'floating' | 'dock'
type Request = { pose: CompanionPose; placement: Placement; zone: number; reason: 'route' | 'section' | 'greeting' | 'style' | 'selection' }
const ratio = 340 / 320
const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n))
const positionAt = (r: Rect) => `translate3d(${r.left}px, ${r.top}px, 0) scale(${r.width / 320})`
const mix = (a: Rect, b: Rect, p: number): Rect => ({ left: a.left + (b.left - a.left) * p, top: a.top + (b.top - a.top) * p, width: a.width + (b.width - a.width) * p, height: a.height + (b.height - a.height) * p })

/** One serial transition, plus one replaceable destination. Scroll never scrubs frames. */
export function RouteCompanion({ route }: { route: ResolvedRoute }) {
  const { language } = useLanguage()
  const { style, pose, setPose } = useCompanionStyle()
  const atHome = route.pathname === '/'
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const portraitRef = useRef<HTMLButtonElement>(null)
  const poseRef = useRef(pose)
  poseRef.current = pose
  const homePoseRef = useRef<CompanionPose>('snack')
  const placedRef = useRef(false)
  const sequenceRef = useRef(0)
  const lastRouteRef = useRef(route.pathname)
  const lastStyleRef = useRef(style)
  const lastPatternRef = useRef<TrajectoryName | undefined>(undefined)
  const requestActionRef = useRef<(pose?: CompanionPose) => void>(() => {})
  const [greeting, setGreeting] = useState(false)
  const greetingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const host = portraitRef.current
    if (!host) return
    const commit = (event: Event) => {
      const next = (event as CustomEvent<unknown>).detail
      if (isCompanionPose(next)) { poseRef.current = next; setPose(next) }
    }
    const select = (event: Event) => {
      const next = (event as CustomEvent<unknown>).detail
      if (isCompanionPose(next)) requestActionRef.current(next)
    }
    host.addEventListener(COMPANION_POSE_EVENT, commit)
    window.addEventListener(COMPANION_SELECT_EVENT, select)
    return () => { host.removeEventListener(COMPANION_POSE_EVENT, commit); window.removeEventListener(COMPANION_SELECT_EVENT, select) }
  }, [setPose])

  useLayoutEffect(() => {
    const element = portraitRef.current
    const slot = document.querySelector<HTMLElement>(`[data-companion-slot="${atHome ? 'home' : 'dock'}"]`)
    if (!element || !slot) return
    const host: HTMLButtonElement = element
    const routeChanged = lastRouteRef.current !== route.pathname
    const styleChanged = lastStyleRef.current !== style
    lastRouteRef.current = route.pathname
    lastStyleRef.current = style
    homePoseRef.current = poseForStyle(homePoseRef.current, style)
    let disposed = false
    let pendingLayout = true
    let frame = 0
    let settleTimer: ReturnType<typeof setTimeout> | null = null
    let watchdog: ReturnType<typeof setTimeout> | null = null
    let zone = 0
    let previousWidth = innerWidth
    let queued: Request | null = null
    let active: { id: number; request: Request; flightDone: boolean; fragmentDone: boolean; animation: Animation | null } | null = null

    const headerBottom = () => document.querySelector('.site-topbar')?.getBoundingClientRect().bottom ?? 76
    const rectFor = (placement: Placement): Rect => {
      const slotRect = slot.getBoundingClientRect()
      if (placement === 'dock') return slotRect
      if (placement === 'hero') return { left: slotRect.left, top: Math.max(headerBottom() + 4, slotRect.top), width: slotRect.width, height: slotRect.height }
      const mobile = innerWidth <= 800
      const width = mobile ? 72 : clamp((innerWidth - 1152) / 2 - 12, 132, 184)
      return { left: innerWidth - width - (mobile ? 24 : 40), top: innerHeight - width * ratio - 32, width, height: width * ratio }
    }
    const applyPosition = (placement: Placement, targetZone: number) => {
      host.style.transform = positionAt(rectFor(placement))
      host.dataset.placement = placement
      host.dataset.scrollProgress = placement === 'floating' ? '1.0000' : '0.0000'
      host.dataset.scene = String(targetZone)
      if (host.dataset.ready !== 'true') host.dataset.ready = 'true'
      if (host.dataset.onscreen !== 'true') host.dataset.onscreen = 'true'
    }
    const commit = (next: CompanionPose) => { poseRef.current = next; host.dataset.pose = next; setPose(next) }
    const detectZone = () => {
      if (!atHome) return 0
      // Distinct leave/return thresholds prevent jitter at the hero boundary.
      if ((zone === 0 && scrollY < 140) || (zone > 0 && scrollY < 64)) return 0
      const sections = [...document.querySelectorAll<HTMLElement>('main.page-home > .home-section')]
      const footer = document.querySelector<HTMLElement>('.site-footer')
      if (footer) sections.push(footer)
      const cursor = scrollY + headerBottom() + innerHeight * 0.3
      let next = Math.max(1, Math.min(zone, sections.length))
      while (next < sections.length && cursor > scrollY + sections[next].getBoundingClientRect().top + 64) next++
      while (next > 1 && cursor < scrollY + sections[next - 1].getBoundingClientRect().top - 64) next--
      return next
    }
    const sceneRequest = (): Request => ({ pose: poseForSection(zone, homePoseRef.current, style), placement: zone === 0 ? 'hero' : 'floating', zone, reason: 'section' })
    const sameTarget = (a: Request, b: Request) => a.pose === b.pose && a.placement === b.placement && a.zone === b.zone

    function drain() {
      if (disposed || pendingLayout || active || !queued) return
      if (queued.reason === 'section' && settleTimer) return
      const request = queued
      queued = null
      host.dataset.queuedPose = ''
      start(request)
    }
    function finish() {
      if (!active || !active.flightDone || !active.fragmentDone) return
      const request = active.request
      active = null
      if (watchdog) clearTimeout(watchdog)
      watchdog = null
      applyPosition(request.placement, request.zone)
      host.dataset.moving = 'false'
      host.dataset.transitionState = 'idle'
      drain()
    }
    function start(request: Request) {
      if (disposed) return
      if (request.reason === 'section' && request.pose === poseRef.current && request.placement === host.dataset.placement) {
        applyPosition(request.placement, request.zone)
        return
      }
      if (reducedMotion || !placedRef.current) {
        commit(request.pose)
        applyPosition(request.placement, request.zone)
        host.dataset.moving = 'false'
        host.dataset.transitionState = 'idle'
        drain()
        return
      }
      const id = ++sequenceRef.current
      const fromPose = poseRef.current
      const from = host.getBoundingClientRect()
      const to = rectFor(request.placement)
      const duration = request.reason === 'route' ? 1050 : 900
      const plan = makeTrajectory(lastPatternRef.current)
      lastPatternRef.current = plan.pattern
      active = { id, request, flightDone: true, fragmentDone: false, animation: null }
      host.dataset.transitionId = String(id)
      host.dataset.transitionState = 'running'
      host.dataset.targetPose = request.pose
      host.dataset.placement = request.placement
      host.dataset.scene = String(request.zone)
      if (watchdog) clearTimeout(watchdog)
      watchdog = setTimeout(() => {
        if (active?.id !== id) return
        const current = active
        active = null
        current.animation?.cancel()
        dispatchFragments(host, { type: 'stop' })
        commit(request.pose)
        applyPosition(request.placement, request.zone)
        host.dataset.moving = 'false'
        host.dataset.transitionState = 'idle'
        drain()
      }, 5000)
      const distance = Math.abs(from.left - to.left) + Math.abs(from.top - to.top) + Math.abs(from.width - to.width)
      if (distance > 2 && typeof host.animate === 'function') {
        const width = Math.max(from.width, to.width, innerWidth <= 800 ? 96 : 172)
        const middle = mix(from, to, 0.55)
        middle.width = width
        middle.height = width * ratio
        middle.left = clamp(middle.left + plan.bend, 24, Math.max(24, innerWidth - width - 24))
        middle.top = clamp(middle.top + Math.abs(plan.bend) * 0.6 + 22, headerBottom() + 12, Math.max(headerBottom() + 12, innerHeight - middle.height - 20))
        host.style.transform = positionAt(to)
        host.dataset.moving = 'true'
        active.flightDone = false
        const animation = host.animate([{ transform: positionAt(from), offset: 0 }, { transform: positionAt(middle), offset: 0.52 }, { transform: positionAt(to), offset: 1 }], { duration, easing: 'cubic-bezier(.3, 0, .2, 1)' })
        active.animation = animation
        animation.onfinish = () => { if (active?.id === id) { active.flightDone = true; host.dataset.moving = 'false'; finish() } }
      }
      dispatchFragments(host, { type: 'play', reason: request.reason, duration, strength: request.reason === 'section' ? 0.85 : 1.05, fromPose, toPose: request.pose, transitionId: id, trajectory: plan })
    }
    const submit = (request: Request) => {
      if (disposed || (!atHome && request.reason !== 'route')) return
      request.pose = poseForStyle(request.pose, style)
      if (active || pendingLayout) {
        queued = active && sameTarget(active.request, request) ? null : request
        host.dataset.queuedPose = queued?.pose ?? ''
      } else start(request)
    }
    const onEnd = (event: Event) => {
      const detail = (event as CustomEvent<{ transitionId?: number; canceled: boolean }>).detail
      if (!active || active.id !== detail?.transitionId) return
      if (detail.canceled) commit(active.request.pose)
      active.fragmentDone = true
      finish()
    }
    const settleScroll = () => {
      settleTimer = null
      if (!atHome || pendingLayout || disposed || document.hidden) return
      const next = detectZone()
      if (next !== zone) { zone = next; submit(sceneRequest()) }
      drain()
    }
    const followPosition = () => {
      frame = 0
      if (disposed || pendingLayout || active || document.hidden) return
      applyPosition(atHome ? zone === 0 ? 'hero' : 'floating' : 'dock', zone)
    }
    const onScroll = () => {
      if (pendingLayout || disposed) return
      if (!frame) frame = requestAnimationFrame(followPosition)
      if (!atHome) return
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = setTimeout(settleScroll, 160)
    }
    const cancel = (preserveTarget: boolean) => {
      const target = queued?.pose ?? active?.request.pose ?? poseRef.current
      const before = host.getBoundingClientRect()
      const animation = active?.animation
      active = null
      queued = null
      animation?.cancel()
      if (watchdog) clearTimeout(watchdog)
      watchdog = null
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = null
      dispatchFragments(host, { type: 'stop' })
      if (preserveTarget) commit(poseForStyle(target, style))
      if (placedRef.current) host.style.transform = positionAt(before)
      host.dataset.moving = 'false'
      host.dataset.transitionState = 'idle'
      host.dataset.queuedPose = ''
    }
    const resize = () => {
      if (innerWidth !== previousWidth) { previousWidth = innerWidth; cancel(true); zone = detectZone() }
      if (!frame) frame = requestAnimationFrame(followPosition)
    }
    const visibility = () => {
      if (document.hidden) cancel(true)
      else { zone = detectZone(); followPosition() }
    }
    requestActionRef.current = selected => {
      if (!atHome) return
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = null
      zone = detectZone()
      const next = selected ? poseForStyle(selected, style) : nextCompanionPose(queued?.pose ?? active?.request.pose ?? poseRef.current, style)
      if (zone === 0) homePoseRef.current = next
      submit({ pose: next, zone, placement: zone === 0 ? 'hero' : 'floating', reason: selected ? 'selection' : 'greeting' })
    }
    host.addEventListener(COMPANION_TRANSITION_END, onEnd)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', visibility)
    const observer = new ResizeObserver(() => { if (!pendingLayout && !frame) frame = requestAnimationFrame(followPosition) })
    observer.observe(slot)
    if (slot.parentElement) observer.observe(slot.parentElement)
    const hero = slot.closest('.home-hero')
    if (hero) observer.observe(hero)
    const header = document.querySelector('.site-topbar')
    if (header) observer.observe(header)
    frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => {
      frame = 0
      pendingLayout = false
      zone = detectZone()
      const placement: Placement = atHome ? zone === 0 ? 'hero' : 'floating' : 'dock'
      const destination = atHome ? poseForSection(zone, homePoseRef.current, style) : poseForStyle(route.pathname.startsWith('/archive') ? 'peek' : route.pathname === '/experience' ? 'thinking' : 'snack', style)
      if (placedRef.current && (routeChanged || styleChanged)) submit({ pose: styleChanged ? poseRef.current : destination, placement, zone, reason: routeChanged ? 'route' : 'style' })
      else { commit(destination); applyPosition(placement, zone); host.dataset.transitionState = 'idle' }
      placedRef.current = true
      drain()
    }) }) })
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      cancel(false)
      observer.disconnect()
      host.removeEventListener(COMPANION_TRANSITION_END, onEnd)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', visibility)
      requestActionRef.current = () => {}
    }
  }, [atHome, route.pathname, style, reducedMotion, setPose])
  useEffect(() => {
    const element = portraitRef.current
    if (!element) return
    const reset = () => {
      element.style.setProperty('--look-x', '0px')
      element.style.setProperty('--look-y', '0px')
    }
    reset()
    if (!atHome || reducedMotion || !finePointer) return
    let frame = 0
    let idleTimer: ReturnType<typeof setTimeout> | undefined
    let x = 0
    let y = 0
    const update = () => {
      frame = 0
      if (element.dataset.onscreen !== 'true') return
      const rect = element.getBoundingClientRect()
      const dx = (x - rect.left - rect.width / 2) / 180
      const dy = (y - rect.top - rect.height * 0.4) / 180
      element.style.setProperty('--look-x', `${Math.max(-3, Math.min(3, dx))}px`)
      element.style.setProperty('--look-y', `${Math.max(-2, Math.min(2, dy))}px`)
    }
    const follow = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      x = event.clientX
      y = event.clientY
      if (!frame) frame = requestAnimationFrame(update)
      clearTimeout(idleTimer)
      idleTimer = setTimeout(reset, 1800)
    }
    window.addEventListener('pointermove', follow, { passive: true })
    document.documentElement.addEventListener('pointerleave', reset)
    window.addEventListener('blur', reset)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(idleTimer)
      window.removeEventListener('pointermove', follow)
      document.documentElement.removeEventListener('pointerleave', reset)
      window.removeEventListener('blur', reset)
      reset()
    }
  }, [atHome, finePointer, reducedMotion])

  useEffect(() => {
    setGreeting(false)
    return () => { if (greetingTimer.current) clearTimeout(greetingTimer.current) }
  }, [route.pathname])
  const sayHello = () => {
    if (!atHome) { navigate('/'); return }
    setGreeting(true)
    requestActionRef.current()
    if (greetingTimer.current) clearTimeout(greetingTimer.current)
    greetingTimer.current = setTimeout(() => setGreeting(false), 1600)
  }
  const label = language === 'zh' ? atHome ? '和小小探索者打个招呼' : '回到首页' : atHome ? 'Say hello to the little explorer' : 'Back to home'
  return (
    <button ref={portraitRef} type="button" className="route-companion" data-testid="route-companion" data-mode={atHome ? 'home' : 'dock'} data-greeting={greeting} data-pose={pose} aria-label={label} title={atHome ? `${poseLabel(pose, language)} → ${poseLabel(nextCompanionPose(pose, style), language)}` : label} onClick={sayHello}>
      <span className="companion-aura" aria-hidden="true" />
      <CompanionVisual />
      <CompanionFragments hostRef={portraitRef} />
      <span className="companion-hello" aria-hidden="true">{language === 'zh' ? '嗨，一起探索！' : 'Hey, let’s explore!'}</span>
    </button>
  )
}

export function CompanionHomeSlot() {
  const { language } = useLanguage()
  const { pose } = useCompanionStyle()
  return (
    <div className="companion-home">
      <div className="companion-home-slot" data-companion-slot="home" aria-hidden="true">
        <span className="companion-orbit companion-orbit--one" />
        <span className="companion-orbit companion-orbit--two" />
        <span className="companion-spark companion-spark--one">✳</span>
        <span className="companion-spark companion-spark--two">+</span>
      </div>
      <span className="companion-caption" aria-hidden="true">
        <span /> {language === 'zh' ? `点我换动作 · ${poseLabel(pose, language)}` : `Tap to change · ${poseLabel(pose, language)}`}
      </span>
      <CompanionStyleSwitch />
    </div>
  )
}
