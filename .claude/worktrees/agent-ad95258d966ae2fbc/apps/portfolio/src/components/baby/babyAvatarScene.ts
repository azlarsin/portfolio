import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

import { loadPortraitModel } from './babyImage'
const scenes = new WeakMap<HTMLCanvasElement, ReturnType<typeof createBabyAvatarScene>>()
const loader = new GLTFLoader()
async function loadModel(src: string) {
  const model = (await loader.parseAsync(await loadPortraitModel(src), '')).scene
  model.traverse(object => { if (object instanceof THREE.Mesh) {
    object.frustumCulled = false; object.castShadow = true; object.receiveShadow = false
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (material.userData.photoSurface !== undefined) material.toneMapped = false
    }
  } })
  return model
}
function disposeModel(model: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>()
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    geometries.add(object.geometry)
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material)
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
    }
  })
  for (const value of geometries) value.dispose()
  for (const value of materials) value.dispose()
  for (const value of textures) {
    if (typeof ImageBitmap !== 'undefined' && value.source.data instanceof ImageBitmap) value.source.data.close()
    value.dispose()
  }
}

/** One active renderer; each photo supplies its own fitted face, pose and surface colors. */
export function createBabyAvatarScene(canvas: HTMLCanvasElement, host: HTMLElement, unavailable: () => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(600, 660, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const scene = new THREE.Scene(), root = new THREE.Group()
  scene.add(root)
  const camera = new THREE.OrthographicCamera(-1.65, 1.65, 1.865, -1.765, .1, 30)
  camera.position.set(0, .12, 7); camera.lookAt(0, .04, 0)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa1aaa5, 1.2))
  const key = new THREE.DirectionalLight(0xffffff, 2); key.position.set(-3, 4, 5); key.castShadow = true
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2.5, bottom: -2 }); key.shadow.normalBias = .025; key.shadow.bias = -.0003; scene.add(key)
  const fill = new THREE.DirectionalLight(0xe8f0ff, .6); fill.position.set(4, 1, 3); scene.add(fill)
  const rim = new THREE.DirectionalLight(0xfff5df, 1.8); rim.position.set(1, 3, -3); scene.add(rim)
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.3, 48), new THREE.ShadowMaterial({ opacity: .15 }))
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.5; floor.receiveShadow = true; scene.add(floor)
  root.rotation.y = -.08
  let spinStart = 0
  let current: THREE.Group | undefined, source = '', disposed = false, failed = false, generation = 0, frame = 0
  let x = 0, y = 0, targetX = 0, targetY = 0
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const render = () => { if (!disposed && !failed) renderer.render(scene, camera) }
  const draw = (time = performance.now()) => {
    frame = 0
    if (disposed || failed || document.hidden) return
    x += (targetX - x) * .18; y += (targetY - y) * .18
    const spin = spinStart ? Math.min(1, (time - spinStart) / 1800) : 1
    const turn = spinStart ? (spin * spin * (3 - 2 * spin)) * Math.PI * 2 : 0
    root.rotation.set(y * .14, -.08 + x * .65 + turn, 0)
    canvas.dataset.yaw = root.rotation.y.toFixed(3)
    if (spin === 1) spinStart = 0
    render()
    if (spinStart || Math.abs(targetX - x) + Math.abs(targetY - y) > .003) request()
  }
  const request = () => { if (!frame && !disposed && !failed && !document.hidden) frame = requestAnimationFrame(draw) }
  const pointer = (event: PointerEvent) => {
    if (motion.matches) return
    const rect = host.getBoundingClientRect()
    targetX = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1)
    targetY = THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1)
    request()
  }
  const reset = () => { targetX = 0; targetY = 0; if (motion.matches) { x = 0; y = 0; spinStart = 0 }; request() }
  const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; spinStart = 0 } else request() }
  const lost = (event: Event) => { event.preventDefault(); failed = true; cancelAnimationFrame(frame); frame = 0; unavailable() }
  host.addEventListener('pointermove', pointer); host.addEventListener('pointerleave', reset)
  canvas.addEventListener('webglcontextlost', lost)
  document.addEventListener('visibilitychange', visibility); motion.addEventListener('change', reset)
  const controller = {
    spin() { if (!motion.matches) { spinStart = performance.now(); request() } },
    async setSource(src: string) {
      if (disposed || failed) throw new Error('3D 暂不可用')
      const token = ++generation
      const model = await loadModel(src)
      if (disposed || failed || token !== generation) { disposeModel(model); return false }
      if (current) { root.remove(current); disposeModel(current) }
      current = model; source = src; root.add(model); render(); return true
    },
    async capture(src: string) {
      if (disposed || failed) throw new Error('3D 暂不可用')
      const temporary = src === source ? undefined : await loadModel(src)
      if (disposed || failed) { if (temporary) disposeModel(temporary); throw new Error('3D 已关闭') }
      const copy = document.createElement('canvas'); copy.width = 600; copy.height = 660
      try {
        if (temporary) { if (current) current.visible = false; root.add(temporary) }
        render(); copy.getContext('2d')!.drawImage(canvas, 0, 0, 600, 660)
        return copy
      } finally {
        if (temporary) { root.remove(temporary); disposeModel(temporary); if (current) current.visible = true; render() }
      }
    },
    dispose() {
      disposed = true; generation++; cancelAnimationFrame(frame); scenes.delete(canvas)
      host.removeEventListener('pointermove', pointer); host.removeEventListener('pointerleave', reset)
      canvas.removeEventListener('webglcontextlost', lost); document.removeEventListener('visibilitychange', visibility); motion.removeEventListener('change', reset)
      if (current) disposeModel(current)
      floor.geometry.dispose(); floor.material.dispose(); key.shadow.map?.dispose(); renderer.dispose(); renderer.forceContextLoss()
    },
  }
  scenes.set(canvas, controller)
  return controller
}
export function captureAvatarPortrait(canvas: HTMLCanvasElement, src: string) {
  const controller = scenes.get(canvas)
  if (!controller) return Promise.reject(new Error('模型尚未载入'))
  return controller.capture(src)
}
