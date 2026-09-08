import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { navigate, type ResolvedRoute } from '../../app/router'
import { useLanguage } from '../../i18n/LanguageContext'
import { useMediaQuery } from '../common/useMediaQuery'
import { CompanionVisual } from './CompanionVisual'
import { CompanionStyleSwitch } from './CompanionPreference'

const portraitWidth = 320

function positionAt(rect: DOMRect) {
  return `translate3d(${rect.left}px, ${rect.top}px, 0) scale(${rect.width / portraitWidth})`
}

/** One character stays mounted while the pages beneath it change. Slots reserve its space. */
export function RouteCompanion({ route }: { route: ResolvedRoute }) {
  const { language } = useLanguage()
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
    const slot = document.querySelector<HTMLElement>(
      `[data-companion-slot="${atHome ? 'home' : 'dock'}"]`,
    )
    if (!element || !slot) return

    let frame = 0
    let pendingRoute = true
    let disposed = false

    const freezeFlight = () => {
      if (!flightRef.current) return
      const current = element.getBoundingClientRect()
      flightRef.current.cancel()
      flightRef.current = null
      element.style.transform = positionAt(current)
      element.dataset.moving = 'false'
    }

    const relocate = (animate: boolean) => {
      const target = slot.getBoundingClientRect()
      if (!target.width) return
      const previous = placedRef.current ? element.getBoundingClientRect() : target
      freezeFlight()
      const transform = positionAt(target)
      element.style.transform = transform
      const headerBottom = document.querySelector('.site-topbar')?.getBoundingClientRect().bottom ?? 0
      element.dataset.onscreen = String(!atHome || (target.top >= headerBottom - 1 && target.top < innerHeight))
      element.dataset.ready = 'true'

      if (animate && placedRef.current && !reducedMotion && typeof element.animate === 'function') {
        element.dataset.moving = 'true'
        const flight = element.animate(
          [{ transform: positionAt(previous) }, { transform }],
          { duration: 720, easing: 'cubic-bezier(.22, 1, .36, 1)' },
        )
        flightRef.current = flight
        flight.onfinish = () => {
          if (disposed || flightRef.current !== flight) return
          flightRef.current = null
          element.dataset.moving = 'false'
          // Scroll restoration or a resize may have moved the destination during flight.
          relocate(false)
        }
      }
      placedRef.current = true
    }

    const schedulePosition = () => {
      if (pendingRoute || frame || flightRef.current) return
      frame = requestAnimationFrame(() => {
        frame = 0
        relocate(false)
      })
    }

    // The router restores scroll in two frames. Measure the destination after that.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          frame = 0
          pendingRoute = false
          relocate(true)
        })
      })
    })
    window.addEventListener('scroll', schedulePosition, { passive: true })
    window.addEventListener('resize', schedulePosition)
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
      window.removeEventListener('resize', schedulePosition)
      // Preserve the current visual position when navigation interrupts a flight.
      freezeFlight()
    }
  }, [atHome, route.pathname, reducedMotion])

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
        <span /> {language === 'zh' ? '保持好奇，继续探索。' : 'Stay curious. Keep exploring.'}
      </span>
      <CompanionStyleSwitch />
    </div>
  )
}
