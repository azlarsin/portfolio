import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { navigate, type ResolvedRoute } from '../../app/router'
import { useLanguage } from '../../i18n/LanguageContext'
import { useMediaQuery } from '../common/useMediaQuery'
import { CompanionVisual } from './CompanionVisual'
import { CompanionStyleSwitch, useCompanionStyle } from './CompanionPreference'
import { CompanionFragments, dispatchFragments } from './CompanionFragments'

const portraitWidth = 320
const portraitRatio = 340 / portraitWidth
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const smooth = (value: number) => value * value * (3 - 2 * value)
type PortraitRect = { left: number; top: number; width: number; height: number }

function floatingRect(): PortraitRect {
  const mobile = innerWidth <= 800
  const width = mobile ? 72 : clamp((innerWidth - 1152) / 2 - 12, 132, 184)
  return { left: innerWidth - width - (mobile ? 22 : 34), top: innerHeight - width * portraitRatio - (mobile ? 28 : 38), width, height: width * portraitRatio }
}

function lerpRect(from: PortraitRect, to: PortraitRect, progress: number): PortraitRect {
  const width = from.width + (to.width - from.width) * progress
  return { left: from.left + (to.left - from.left) * progress, top: from.top + (to.top - from.top) * progress, width, height: width * portraitRatio }
}

function positionAt(rect: PortraitRect) {
  return `translate3d(${rect.left}px, ${rect.top}px, 0) scale(${rect.width / portraitWidth})`
}

/** One character stays mounted while the pages beneath it change. Slots reserve its space. */
export function RouteCompanion({ route }: { route: ResolvedRoute }) {
  const { language } = useLanguage()
  const { style } = useCompanionStyle()
  const previousStyle = useRef(style)
  const atHome = route.pathname === '/'
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const portraitRef = useRef<HTMLButtonElement>(null)
  const flightRef = useRef<Animation | null>(null)
  const placedRef = useRef(false)
  const [greeting, setGreeting] = useState(false)
  const greetingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useLayoutEffect(() => {
    const element = portraitRef.current
    const slot = document.querySelector<HTMLElement>(`[data-companion-slot="${atHome ? 'home' : 'dock'}"]`)
    if (!element || !slot) return
    let frame = 0
    let pendingRoute = true
    let disposed = false
    let previousProgress = 0
    let previousSection = -1
    let lastSectionBurst = 0

    const freezeFlight = () => {
      if (!flightRef.current) return
      const current = element.getBoundingClientRect()
      flightRef.current.cancel()
      flightRef.current = null
      element.style.transform = positionAt(current)
      element.dataset.moving = 'false'
    }

    const measure = () => {
      const rect = slot.getBoundingClientRect()
      const headerBottom = document.querySelector('.site-topbar')?.getBoundingClientRect().bottom ?? 76
      if (!atHome) return { rect, progress: 0, placement: 'dock' }
      const start = Math.max(0, scrollY + rect.top - headerBottom - 40)
      let progress = clamp((scrollY - start) / (innerWidth <= 800 ? 240 : 340))
      if (reducedMotion) progress = progress > 0 ? 1 : 0
      if (progress === 0) return { rect, progress, placement: 'hero' }
      const departure = { left: rect.left, top: headerBottom + 40, width: rect.width, height: rect.height }
      const target = lerpRect(departure, floatingRect(), smooth(progress))
      target.top -= Math.sin(progress * Math.PI) * 36
      return { rect: target, progress, placement: 'floating' }
    }

    const sectionIndex = () => {
      const sections = [...new Set(document.querySelectorAll<HTMLElement>('main > section, main .home-section, main .case-chapter, main .career-timeline article'))]
      const active = sections.reduce((index, section, next) => section.getBoundingClientRect().top < innerHeight * 0.58 ? next : index, -1)
      return sections.length > 1 ? active : Math.floor(scrollY / Math.max(420, innerHeight * 0.75))
    }

    const place = (target: ReturnType<typeof measure>) => {
      element.style.transform = positionAt(target.rect)
      element.dataset.onscreen = 'true'
      element.dataset.ready = 'true'
      element.dataset.placement = target.placement
      element.dataset.scrollProgress = target.progress.toFixed(4)
    }

    const fly = (target: ReturnType<typeof measure>, reason: 'route' | 'section') => {
      const previous = placedRef.current ? element.getBoundingClientRect() : target.rect
      freezeFlight()
      place(target)
      if (!placedRef.current || reducedMotion || typeof element.animate !== 'function') {
        dispatchFragments(element, { type: 'stop' })
        return
      }
      const smallScreen = innerWidth <= 800
      const duration = reason === 'route' ? 1180 : 940
      const midWidth = reason === 'section'
        ? Math.max(target.rect.width, smallScreen ? 88 : 120)
        : Math.max(previous.width, target.rect.width, smallScreen ? 104 : 192)
      const centerX = (previous.left + previous.width / 2) * 0.4 + (target.rect.left + target.rect.width / 2) * 0.6
      const middle: PortraitRect = {
        left: clamp(centerX - midWidth / 2, 26, innerWidth - midWidth - 26),
        top: Math.max(86, (previous.top + target.rect.top) / 2 + (reason === 'route' ? 44 : 20)),
        width: midWidth,
        height: midWidth * portraitRatio,
      }
      middle.top = Math.min(middle.top, innerHeight - middle.height - 20)
      element.dataset.moving = 'true'
      const flight = element.animate([
        { transform: positionAt(previous), offset: 0 },
        { transform: positionAt(lerpRect(previous, middle, 0.55)), offset: 0.25 },
        { transform: positionAt(middle), offset: 0.55 },
        { transform: positionAt(target.rect), offset: 1 },
      ], { duration, easing: 'cubic-bezier(.4, 0, .16, 1)' })
      flightRef.current = flight
      dispatchFragments(element, { type: 'play', reason, duration, strength: reason === 'route' ? 1.25 : 0.8 })
      flight.onfinish = () => {
        if (disposed || flightRef.current !== flight) return
        flightRef.current = null
        element.dataset.moving = 'false'
        const latest = measure()
        place(latest)
        previousProgress = latest.progress
        previousSection = sectionIndex()
        if (latest.progress > 0 && latest.progress < 1) dispatchFragments(element, { type: 'scrub', progress: latest.progress })
      }
    }

    const updateScroll = () => {
      frame = 0
      if (pendingRoute || flightRef.current || disposed || document.hidden) return
      const target = measure()
      if (!target.rect.width) return
      place(target)
      const currentSection = sectionIndex()
      const changedProgress = Math.abs(target.progress - previousProgress) > 0.0001
      if (changedProgress) {
        const jumpedAcross = Math.abs(target.progress - previousProgress) > 0.85
        dispatchFragments(element, jumpedAcross && !reducedMotion
          ? { type: 'play', reason: 'section', duration: 920, strength: 1 }
          : { type: 'scrub', progress: target.progress, strength: 1.15 })
      } else if ((!atHome || target.progress === 1) && currentSection !== previousSection && previousSection >= 0 && performance.now() - lastSectionBurst > 950) {
        lastSectionBurst = performance.now()
        fly(target, 'section')
      }
      previousProgress = target.progress
      previousSection = currentSection
    }

    const schedulePosition = () => {
      if (pendingRoute || frame || flightRef.current) return
      frame = requestAnimationFrame(updateScroll)
    }
    const resize = () => {
      freezeFlight()
      dispatchFragments(element, { type: 'stop' })
      schedulePosition()
    }
    const visibility = () => {
      if (document.hidden) {
        freezeFlight()
        dispatchFragments(element, { type: 'stop' })
      } else schedulePosition()
    }

    // Match the router's two-frame scroll restoration before measuring a new page.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          frame = 0
          pendingRoute = false
          const target = measure()
          fly(target, 'route')
          placedRef.current = true
          previousProgress = target.progress
          previousSection = sectionIndex()
        })
      })
    })
    window.addEventListener('scroll', schedulePosition, { passive: true })
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', visibility)
    const observer = new ResizeObserver(schedulePosition)
    observer.observe(slot)
    if (slot.parentElement) observer.observe(slot.parentElement)
    const hero = slot.closest('.home-hero')
    if (hero) observer.observe(hero)
    const header = document.querySelector('.site-topbar')
    if (header) observer.observe(header)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedulePosition)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', visibility)
      freezeFlight()
      dispatchFragments(element, { type: 'stop' })
    }
  }, [atHome, route.pathname, reducedMotion])

  useEffect(() => {
    if (previousStyle.current === style) return
    previousStyle.current = style
    const frame = requestAnimationFrame(() => dispatchFragments(portraitRef.current, { type: 'play', reason: 'style', duration: 1050 }))
    return () => cancelAnimationFrame(frame)
  }, [style])

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
    return () => {
      if (greetingTimer.current) clearTimeout(greetingTimer.current)
    }
  }, [route.pathname])

  const sayHello = () => {
    if (!atHome) {
      navigate('/')
      return
    }
    setGreeting(true)
    dispatchFragments(portraitRef.current, { type: 'play', reason: 'greeting', duration: 1320, strength: 1.35 })
    if (greetingTimer.current) clearTimeout(greetingTimer.current)
    greetingTimer.current = setTimeout(() => setGreeting(false), 1600)
  }

  const label = language === 'zh'
    ? (atHome ? '和小小探索者打个招呼' : '回到首页')
    : (atHome ? 'Say hello to the little explorer' : 'Back to home')

  return (
    <button
      ref={portraitRef}
      type="button"
      className="route-companion"
      data-testid="route-companion"
      data-mode={atHome ? 'home' : 'dock'}
      data-greeting={greeting}
      aria-label={label}
      title={label}
      onClick={sayHello}
    >
      <span className="companion-aura" aria-hidden="true" />
      <CompanionVisual />
      <CompanionFragments hostRef={portraitRef} />
      <span className="companion-hello" aria-hidden="true">
        {language === 'zh' ? '嗨，一起探索！' : 'Hey, let’s explore!'}
      </span>
    </button>
  )
}

export function CompanionHomeSlot() {
  const { language } = useLanguage()
  return (
    <div className="companion-home">
      <div className="companion-home-slot" data-companion-slot="home" aria-hidden="true">
        <span className="companion-orbit companion-orbit--one" />
        <span className="companion-orbit companion-orbit--two" />
        <span className="companion-spark companion-spark--one">✳</span>
        <span className="companion-spark companion-spark--two">+</span>
      </div>
      <span className="companion-caption" aria-hidden="true">
        <span /> {language === 'zh' ? '滚动试试，也可以点我。' : 'Scroll to explore. Tap to play.'}
      </span>
      <CompanionStyleSwitch />
    </div>
  )
}
