import * as THREE from 'three'
import { createCompanionModel } from './createCompanionModel'

/** Demand-rendered: no permanent animation loop while the visitor reads a page. */
export function createCompanionScene(
  canvas: HTMLCanvasElement,
  host: HTMLButtonElement,
  onUnavailable: () => void,
) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(320, 340, false)
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.02
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1.65, 1.65, 1.8, -1.70625, 0.1, 30)
  camera.position.set(0, 0.12, 7)
  camera.lookAt(0, 0.04, 0)
  const hemisphere = new THREE.HemisphereLight(0xfff9ef, 0x879e8b, 1.7)
  scene.add(hemisphere)
  const key = new THREE.DirectionalLight(0xfff1df, 2.6)
  key.position.set(-3, 4, 5)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.left = -2
  key.shadow.camera.right = 2
  key.shadow.camera.top = 2.5
  key.shadow.camera.bottom = -2
  key.shadow.normalBias = 0.025
  key.shadow.bias = -0.0003
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xe8f0ff, 0.85)
  fill.position.set(4, 1, 3)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xfff5df, 1.8)
  rim.position.set(1, 3, -3)
  scene.add(rim)

  const model = createCompanionModel()
  scene.add(model.root)
  const shadowGeometry = new THREE.CircleGeometry(1.25, 48)
  const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.14 })
  const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -1.5
  shadow.receiveShadow = true
  scene.add(shadow)

  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const pointer = matchMedia('(hover: hover) and (pointer: fine)')
  let frame = 0
  let disposed = false
  let unavailable = false
  let lookX = 0
  let lookY = 0
  let currentX = 0
  let currentY = 0
  let helloStart = 0
  let travelStart = 0
  let previousGreeting = false
  let previousMoving = false
  let idleTimer: ReturnType<typeof setTimeout> | undefined

  const visible = () => !document.hidden && host.dataset.onscreen !== 'false'
  const requestDraw = () => {
    if (!frame && !disposed && !unavailable && visible()) frame = requestAnimationFrame(draw)
  }

  function draw(time: number) {
    frame = 0
    if (disposed || unavailable || !visible()) return
    const reduce = motion.matches
    const atHome = host.dataset.mode === 'home'
    const targetX = reduce || !atHome ? 0 : lookX
    const targetY = reduce || !atHome ? 0 : lookY
    currentX = reduce ? 0 : THREE.MathUtils.lerp(currentX, targetX, 0.16)
    currentY = reduce ? 0 : THREE.MathUtils.lerp(currentY, targetY, 0.16)
    const hello = !reduce && host.dataset.greeting === 'true'
      ? Math.min(1, (time - helloStart) / 1600) : 1
    const travel = !reduce && host.dataset.moving === 'true'
      ? Math.min(1, (time - travelStart) / 720) : 1
    const helloWave = hello < 1 ? Math.sin(hello * Math.PI * 4) * Math.sin(hello * Math.PI) : 0
    const travelTilt = travel < 1 ? Math.sin(travel * Math.PI) : 0
    model.root.rotation.y = -0.16 + currentX * 0.24 + travelTilt * 0.42
    model.root.rotation.z = travelTilt * -0.045
    model.head.rotation.y = currentX * 0.22
    model.head.rotation.x = currentY * 0.12 + helloWave * 0.07
    model.head.rotation.z = helloWave * 0.045
    model.hand.rotation.z = helloWave * 0.22
    model.cape.rotation.y = travelTilt * -0.12
    const blink = hello > 0.18 && hello < 0.29
      ? 1 - 0.92 * Math.sin(((hello - 0.18) / 0.11) * Math.PI) : 1
    for (const eye of model.eyes) eye.scale.y = blink
    canvas.dataset.yaw = model.root.rotation.y.toFixed(3)
    renderer.render(scene, camera)
    if (Math.abs(currentX - targetX) > 0.002 || Math.abs(currentY - targetY) > 0.002 || hello < 1 || travel < 1) {
      requestDraw()
    }
  }

  const sync = () => {
    const greeting = host.dataset.greeting === 'true'
    const moving = host.dataset.moving === 'true'
    if (greeting && !previousGreeting) helloStart = performance.now()
    if (moving && !previousMoving) travelStart = performance.now()
    previousGreeting = greeting
    previousMoving = moving
    if (!visible() || motion.matches) {
      cancelAnimationFrame(frame)
      frame = 0
      lookX = 0
      lookY = 0
    }
    requestDraw()
  }
  const resetLook = () => {
    lookX = 0
    lookY = 0
    requestDraw()
  }
  const follow = (event: PointerEvent) => {
    if (motion.matches || !pointer.matches || event.pointerType !== 'mouse' || host.dataset.mode !== 'home' || !visible()) return
    const rect = host.getBoundingClientRect()
    lookX = THREE.MathUtils.clamp((event.clientX - rect.left - rect.width / 2) / (innerWidth * 0.35), -1, 1)
    lookY = THREE.MathUtils.clamp((event.clientY - rect.top - rect.height * 0.4) / (innerHeight * 0.4), -1, 1)
    clearTimeout(idleTimer)
    idleTimer = setTimeout(resetLook, 1800)
    requestDraw()
  }
  const loseContext = (event: Event) => {
    event.preventDefault()
    unavailable = true
    cancelAnimationFrame(frame)
    frame = 0
    onUnavailable()
  }
  const observer = new MutationObserver(sync)
  observer.observe(host, { attributes: true, attributeFilter: ['data-mode', 'data-onscreen', 'data-moving', 'data-greeting'] })
  window.addEventListener('pointermove', follow, { passive: true })
  window.addEventListener('blur', resetLook)
  document.documentElement.addEventListener('pointerleave', resetLook)
  document.addEventListener('visibilitychange', sync)
  motion.addEventListener('change', sync)
  canvas.addEventListener('webglcontextlost', loseContext)
  sync()

  return {
    dispose() {
      if (disposed) return
      disposed = true
      cancelAnimationFrame(frame)
      clearTimeout(idleTimer)
      observer.disconnect()
      window.removeEventListener('pointermove', follow)
      window.removeEventListener('blur', resetLook)
      document.documentElement.removeEventListener('pointerleave', resetLook)
      document.removeEventListener('visibilitychange', sync)
      motion.removeEventListener('change', sync)
      canvas.removeEventListener('webglcontextlost', loseContext)
      model.dispose()
      shadowGeometry.dispose()
      shadowMaterial.dispose()
      key.shadow.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
