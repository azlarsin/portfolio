import * as THREE from 'three'
import type { CompanionPose } from './companionPoses'

/** A small original clay portrait, modelled in code so every moving part stays editable. */
export function createCompanionModel(): {
  root: THREE.Group
  head: THREE.Group
  eyes: THREE.Group[]
  hand: THREE.Group
  cape: THREE.Group
  setPose: (pose: CompanionPose) => void
  dispose: () => void
} {
  const root = new THREE.Group()
  root.name = 'little-explorer'
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const material = (color: string, roughness = 0.68) => {
    const result = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 })
    materials.add(result)
    return result
  }
  const skin = material('#e69c59', 0.6)
  const innerEar = material('#d98961', 0.76)
  const hairMaterial = material('#151816', 0.79)
  const hairHighlight = material('#363a33', 0.72)
  const shirtMaterial = material('#efc21b', 0.83)
  const collarMaterial = material('#153d63', 0.74)
  const ivory = material('#fff6e7', 0.86)
  const seamMaterial = material('#e3d7c3', 0.87)
  const white = material('#fff9e9', 0.18)
  const irisMaterial = material('#4f321c', 0.3)
  const pupilMaterial = material('#10130f', 0.2)
  const glintMaterial = material('#ffffff', 0.08)
  glintMaterial.emissive.set('#ffffff')
  glintMaterial.emissiveIntensity = 0.22
  const mouthMaterial = material('#5c261a', 0.8)
  const lipMaterial = material('#cf7151', 0.7)
  const coneMaterial = material('#e8aa35', 0.86)
  const waffleMaterial = material('#bd802b', 0.88)
  const waferEdge = material('#fbd78d', 0.88)

  const sphere = new THREE.SphereGeometry(1, 40, 28)
  geometries.add(sphere)

  function mesh(
    geometry: THREE.BufferGeometry,
    surface: THREE.Material,
    parent: THREE.Group,
  ) {
    geometries.add(geometry)
    const result = new THREE.Mesh(geometry, surface)
    result.castShadow = true
    result.receiveShadow = true
    parent.add(result)
    return result
  }

  function ellipsoid(
    parent: THREE.Group,
    surface: THREE.Material,
    position: [number, number, number],
    scale: [number, number, number],
  ) {
    const result = mesh(sphere, surface, parent)
    result.position.set(...position)
    result.scale.set(...scale)
    return result
  }

  function tube(
    parent: THREE.Group,
    points: THREE.Vector3[],
    radius: number,
    surface: THREE.Material,
    segments = 32,
  ) {
    return mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 8, false),
      surface,
      parent,
    )
  }

  function roundedLimb(
    parent: THREE.Group,
    start: THREE.Vector3,
    end: THREE.Vector3,
    radius: number,
    surface: THREE.Material,
  ) {
    const result = mesh(new THREE.CapsuleGeometry(radius, start.distanceTo(end), 8, 16), surface, parent)
    result.position.copy(start).add(end).multiplyScalar(0.5)
    result.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize())
    return result
  }

  // The lathed torso ends on a flat base, like a small collectable sculpture.
  const torsoProfile = new THREE.SplineCurve([
    new THREE.Vector2(0, -1.47),
    new THREE.Vector2(0.57, -1.47),
    new THREE.Vector2(0.65, -1.43),
    new THREE.Vector2(0.68, -1.24),
    new THREE.Vector2(0.65, -0.9),
    new THREE.Vector2(0.6, -0.59),
    new THREE.Vector2(0.46, -0.39),
    new THREE.Vector2(0.26, -0.33),
    new THREE.Vector2(0, -0.33),
  ])
  const torso = mesh(new THREE.LatheGeometry(torsoProfile.getPoints(64), 56), shirtMaterial, root)
  torso.scale.z = 0.7
  ellipsoid(root, skin, [0, -0.25, 0], [0.23, 0.25, 0.22])

  // The collar is a soft, slightly sloping navy ribbon around the neck.
  const collarPoints = Array.from({ length: 33 }, (_, i) => {
    const angle = (i / 32) * Math.PI * 2
    return new THREE.Vector3(
      Math.cos(angle) * 0.32,
      -0.4 - Math.max(0, Math.sin(angle)) * 0.17,
      Math.sin(angle) * 0.405,
    )
  })
  tube(root, collarPoints, 0.062, collarMaterial, 64)
  tube(root, collarPoints.map((p) => p.clone().add(new THREE.Vector3(0, -0.035, 0.027))), 0.014, shirtMaterial, 64)

  // A tiny abstract sun badge is deliberately free of lettering or brand marks.
  ellipsoid(root, collarMaterial, [0.08, -0.93, 0.453], [0.11, 0.12, 0.016])
  ellipsoid(root, shirtMaterial, [0.08, -0.928, 0.47], [0.086, 0.097, 0.008])
  const badge = mesh(new THREE.TorusGeometry(0.038, 0.007, 8, 24), collarMaterial, root)
  badge.position.set(0.08, -0.93, 0.481)
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2
    tube(root, [
      new THREE.Vector3(0.08 + Math.cos(angle) * 0.052, -0.93 + Math.sin(angle) * 0.052, 0.481),
      new THREE.Vector3(0.08 + Math.cos(angle) * 0.064, -0.93 + Math.sin(angle) * 0.064, 0.481),
    ], 0.005, collarMaterial, 2)
  }

  const cape = new THREE.Group()
  cape.name = 'ivory-cape'
  root.add(cape)
  ellipsoid(cape, ivory, [0, -0.48, -0.12], [0.79, 0.17, 0.38])

  // Each front panel is a closed, curved surface. The shallow waves make folds
  // respond to the scene lights instead of relying on painted shading.
  function capePoint(side: number, u: number, v: number, back = false) {
    const innerX = 0.075 + 0.28 * u
    const outerX = 0.76 + 0.29 * Math.sqrt(u)
    const x = side * THREE.MathUtils.lerp(innerX, outerX, v)
    const y = -0.385 - 1.09 * u - 0.115 * v - 0.035 * Math.sin(v * Math.PI)
    const fold = Math.sin(v * Math.PI * 3.4 + u * 0.9) * 0.023 * Math.sin(v * Math.PI)
    const z = 0.52 - 0.35 * v + Math.sin(v * Math.PI) * 0.095 + fold - (back ? 0.042 : 0)
    return new THREE.Vector3(x, y, z)
  }

  for (const side of [-1, 1]) {
    const width = 24
    const height = 32
    const layerSize = (width + 1) * (height + 1)
    const positions: number[] = []
    const indices: number[] = []
    for (let layer = 0; layer < 2; layer += 1) {
      for (let row = 0; row <= height; row += 1) {
        for (let column = 0; column <= width; column += 1) {
          const p = capePoint(side, row / height, column / width, layer === 1)
          positions.push(p.x, p.y, p.z)
        }
      }
    }
    const quad = (a: number, b: number, c: number, d: number, reverse = false) => {
      if (reverse) indices.push(a, c, b, a, d, c)
      else indices.push(a, b, c, a, c, d)
    }
    for (let row = 0; row < height; row += 1) {
      for (let column = 0; column < width; column += 1) {
        const a = row * (width + 1) + column
        const b = a + 1
        const d = a + width + 1
        const c = d + 1
        quad(a, b, c, d, side > 0)
        quad(a + layerSize, b + layerSize, c + layerSize, d + layerSize, side < 0)
      }
    }
    for (let row = 0; row < height; row += 1) {
      const a = row * (width + 1)
      const b = a + width + 1
      quad(a, b, b + layerSize, a + layerSize, side > 0)
      quad(a + width, b + width, b + width + layerSize, a + width + layerSize, side < 0)
    }
    for (let column = 0; column < width; column += 1) {
      quad(column, column + layerSize, column + 1 + layerSize, column + 1, side > 0)
      const a = height * (width + 1) + column
      quad(a, a + layerSize, a + layerSize + 1, a + 1, side < 0)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    const panel = mesh(geometry, ivory, cape)
    panel.material = ivory
    const edge = Array.from({ length: 24 }, (_, i) => capePoint(side, i / 23, 0).add(new THREE.Vector3(0, 0, 0.004)))
    tube(cape, edge, 0.013, seamMaterial, 28)
  }

  const leftBow = ellipsoid(cape, ivory, [-0.28, -0.50, 0.59], [0.24, 0.14, 0.06])
  leftBow.rotation.z = 0.60
  const towelLoop = mesh(new THREE.TorusGeometry(0.12, 0.036, 12, 40), ivory, cape)
  towelLoop.position.set(-0.28, -0.50, 0.645)
  towelLoop.rotation.z = 0.60
  towelLoop.scale.set(1.65, 0.95, 0.55)
  const rightBow = ellipsoid(cape, ivory, [0, -0.46, 0.58], [0.18, 0.105, 0.075])
  rightBow.rotation.z = -0.17
  const bowTail = ellipsoid(cape, ivory, [-0.25, -0.69, 0.59], [0.09, 0.23, 0.035])
  bowTail.rotation.z = -0.38
  ellipsoid(cape, ivory, [-0.09, -0.47, 0.64], [0.083, 0.10, 0.072])
  tube(cape, [new THREE.Vector3(-0.205, -0.428, 0.616), new THREE.Vector3(-0.14, -0.416, 0.636), new THREE.Vector3(-0.06, -0.442, 0.623)], 0.007, seamMaterial, 16)
  tube(cape, [new THREE.Vector3(0.205, -0.428, 0.616), new THREE.Vector3(0.14, -0.416, 0.636), new THREE.Vector3(0.06, -0.442, 0.623)], 0.007, seamMaterial, 16)

  const head = new THREE.Group()
  head.name = 'head-neck-pivot'
  head.position.y = 0.02
  head.scale.set(0.83, 1.08, 1)
  root.add(head)

  // The reference has broad temples and a tapered lower face, not a round toy head.
  const jawWidth = (normalizedY: number) => 1 - 0.10 * Math.max(0, -normalizedY)
  const faceGeometry = sphere.clone()
  const facePositions = faceGeometry.getAttribute('position')
  for (let index = 0; index < facePositions.count; index++) {
    facePositions.setX(index, facePositions.getX(index) * jawWidth(facePositions.getY(index)))
  }
  faceGeometry.computeVertexNormals()
  const face = mesh(faceGeometry, skin, head)
  face.position.y = 0.7
  face.scale.set(0.72, 0.85, 0.63)

  for (const side of [-1, 1]) {
    const ear = ellipsoid(head, skin, [side * 0.692, 0.65, -0.005], [0.13, 0.21, 0.11])
    ear.rotation.z = side * -0.16
    const inside = ellipsoid(head, innerEar, [side * 0.73, 0.65, 0.086], [0.065, 0.13, 0.021])
    inside.rotation.z = side * -0.17
    ellipsoid(head, skin, [side * 0.70, 0.592, 0.102], [0.044, 0.06, 0.03])
  }

  // Surface-aligned facial details remain attached even in three-quarter views.
  function faceZ(x: number, y: number, offset = 0) {
    const normalizedY = (y - 0.7) / 0.85
    return 0.63 * Math.sqrt(Math.max(0.01, 1 - (x / (0.72 * jawWidth(normalizedY))) ** 2 - normalizedY ** 2)) + offset
  }

  const eyes: THREE.Group[] = []
  for (const side of [-1, 1]) {
    const x = side * 0.285
    const eye = new THREE.Group()
    eye.name = side < 0 ? 'left-eye' : 'right-eye'
    eye.position.set(x, 0.73, faceZ(x, 0.73, 0.001))
    eye.rotation.y = side * 0.12
    head.add(eye)
    eyes.push(eye)
    const eyeFeatures = new THREE.Group()
    eye.add(eyeFeatures)

    // Sculpt almond-shaped openings and clip the iris at the lids. This avoids
    // protruding white discs, the biggest difference from the supplied portraits.
    const upperEye = (u: number) => 0.098 * Math.pow(Math.max(0, 1 - u * u), 0.7)
    const lowerEye = (u: number) => -0.066 * Math.pow(Math.max(0, 1 - u * u), 0.9)
    const eyeZ = (px: number, py: number) => 0.028 + 0.036 * Math.sqrt(Math.max(0, 1 - (px / 0.19) ** 2 - (py / 0.15) ** 2))
    const eyePositions: number[] = []
    const eyeIndices: number[] = []
    for (let row = 0; row <= 10; row++) {
      for (let column = 0; column <= 32; column++) {
        const u = column / 16 - 1
        const px = u * 0.178
        const py = THREE.MathUtils.lerp(lowerEye(u), upperEye(u), row / 10)
        eyePositions.push(px, py, eyeZ(px, py))
        if (row < 10 && column < 32) {
          const a = row * 33 + column
          eyeIndices.push(a, a + 1, a + 33, a + 1, a + 34, a + 33)
        }
      }
    }
    const eyeGeometry = new THREE.BufferGeometry()
    eyeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(eyePositions, 3))
    eyeGeometry.setIndex(eyeIndices)
    eyeGeometry.computeVertexNormals()
    mesh(eyeGeometry, white, eyeFeatures)

    function eyeDisc(radiusX: number, radiusY: number, surface: THREE.Material, offset: number) {
      const positions = [0, 0, eyeZ(0, 0) + offset]
      const indices: number[] = []
      for (let i = 0; i <= 48; i++) {
        const angle = i / 48 * Math.PI * 2
        const px = Math.cos(angle) * radiusX
        const py = THREE.MathUtils.clamp(Math.sin(angle) * radiusY, lowerEye(px / 0.178) + 0.002, upperEye(px / 0.178) - 0.002)
        positions.push(px, py, eyeZ(px, py) + offset)
        if (i < 48) indices.push(0, i + 1, i + 2)
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geometry.setIndex(indices)
      geometry.computeVertexNormals()
      return mesh(geometry, surface, eyeFeatures)
    }
    eyeDisc(0.091, 0.086, irisMaterial, 0.002)
    eyeDisc(0.053, 0.057, pupilMaterial, 0.004)
    ellipsoid(eyeFeatures, glintMaterial, [-0.027, 0.038, 0.071], [0.019, 0.022, 0.005])
    ellipsoid(eyeFeatures, glintMaterial, [0.033, -0.031, 0.071], [0.008, 0.009, 0.004])
    for (const upper of [true, false]) {
      const lid = Array.from({ length: 25 }, (_, i) => {
        const u = i / 12 - 1
        const px = u * 0.178
        const py = upper ? upperEye(u) : lowerEye(u)
        return new THREE.Vector3(px, py, eyeZ(px, py) + 0.003)
      })
      tube(eyeFeatures, lid, upper ? 0.012 : 0.006, upper ? hairMaterial : innerEar, 32)
    }

    const browPoints = Array.from({ length: 13 }, (_, i) => {
      const u = i / 12
      const bx = x - 0.178 + u * 0.356
      const by = 0.94 + Math.sin(u * Math.PI) * 0.029 + side * (0.5 - u) * 0.025
      return new THREE.Vector3(bx, by, faceZ(bx, by, 0.012))
    })
    tube(head, browPoints, 0.025, hairMaterial, 24)
  }

  ellipsoid(head, skin, [0, 0.574, 0.604], [0.076, 0.145, 0.068])
  ellipsoid(head, skin, [0, 0.476, 0.648], [0.115, 0.074, 0.085])
  for (const side of [-1, 1]) {
    ellipsoid(head, skin, [side * 0.090, 0.453, 0.625], [0.055, 0.040, 0.044])
    const nostril = ellipsoid(head, mouthMaterial, [side * 0.084, 0.432, 0.659], [0.025, 0.012, 0.008])
    nostril.rotation.z = side * -0.25
  }

  // An open, curious expression follows photo 4 rather than a stock toothy smile.
  function facialPatch(
    surface: THREE.Material,
    halfWidth: number,
    upper: (u: number) => number,
    lower: (u: number) => number,
    offset: number,
  ) {
    const positions: number[] = []
    const indices: number[] = []
    const columns = 32
    const rows = 8
    for (let row = 0; row <= rows; row += 1) {
      for (let column = 0; column <= columns; column += 1) {
        const u = (column / columns) * 2 - 1
        const x = u * halfWidth
        const y = THREE.MathUtils.lerp(upper(u), lower(u), row / rows)
        positions.push(x, y, faceZ(x, y, offset))
      }
    }
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const a = row * (columns + 1) + column
        indices.push(a, a + columns + 1, a + 1, a + 1, a + columns + 1, a + columns + 2)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    const result = mesh(geometry, surface, head)
    result.castShadow = false
    return result
  }

  const mouthParts: THREE.Object3D[] = []
  const mouthCurve = (u: number) => Math.sqrt(Math.max(0, 1 - u * u))
  mouthParts.push(facialPatch(mouthMaterial, 0.205, (u) => 0.235 + 0.143 * mouthCurve(u), (u) => 0.235 - 0.166 * mouthCurve(u), 0.009))
  const upperTeeth = (u: number) => 0.235 + 0.143 * mouthCurve(u * 0.7) - 0.004
  mouthParts.push(facialPatch(white, 0.144, upperTeeth, (u) => upperTeeth(u) - 0.027, 0.014))
  for (const upper of [true, false]) {
    const lip = Array.from({ length: 25 }, (_, i) => {
      const u = i / 12 - 1
      const x = u * 0.207
      const y = 0.235 + (upper ? 0.145 : -0.168) * mouthCurve(u)
      return new THREE.Vector3(x, y, faceZ(x, y, 0.012))
    })
    mouthParts.push(tube(head, lip, upper ? 0.009 : 0.016, lipMaterial, 32))
  }

  // The crop follows the photo's exposed forehead and close-cut temples.
  // Irregular, fine tips replace the previous smooth cap and hanging fringe.
  function scalpPoint(phi: number, t: number) {
    const front = Math.sin(phi)
    const hairline = front > 0
      ? 0.85 + 0.38 * Math.pow(front, 1.5) + 0.015 * Math.sin(phi * 19)
      : 0.76 + 0.08 * front
    const theta = t * Math.acos((hairline - 0.7) / 0.88)
    return new THREE.Vector3(
      Math.sin(theta) * Math.cos(phi) * 0.749,
      0.7 + Math.sign(Math.cos(theta)) * Math.pow(Math.abs(Math.cos(theta)), 0.78) * 0.88,
      Math.sin(theta) * Math.sin(phi) * 0.645 - 0.012,
    )
  }
  const scalpVertices: number[] = []
  const scalpIndices: number[] = []
  const scalpColumns = 96
  const scalpRows = 28
  for (let row = 0; row <= scalpRows; row++) {
    for (let column = 0; column <= scalpColumns; column++) {
      const point = scalpPoint(column / scalpColumns * Math.PI * 2, row / scalpRows)
      scalpVertices.push(point.x, point.y, point.z)
      if (row < scalpRows && column < scalpColumns) {
        const a = row * (scalpColumns + 1) + column
        scalpIndices.push(a, a + 1, a + 97, a + 1, a + 98, a + 97)
      }
    }
  }
  const scalpGeometry = new THREE.BufferGeometry()
  scalpGeometry.setAttribute('position', new THREE.Float32BufferAttribute(scalpVertices, 3))
  scalpGeometry.setIndex(scalpIndices)
  scalpGeometry.computeVertexNormals()
  mesh(scalpGeometry, hairMaterial, head)

  const tuftGeometry = new THREE.ConeGeometry(1, 1, 5)
  for (let i = 0; i < 185; i++) {
    const phi = i * 2.3999632297
    const t = 0.12 + Math.sqrt((i + 0.5) / 185) * 0.89
    const base = scalpPoint(phi, Math.min(t, 1))
    const normal = new THREE.Vector3(base.x / 0.735, (base.y - 0.7) / 0.88, (base.z + 0.012) / 0.645).normalize()
    const direction = normal.clone().multiplyScalar(0.5).add(new THREE.Vector3(0.16, 0.65, 0.04)).normalize()
    const length = 0.047 + (Math.sin(i * 3.79) + 1) * 0.021
    const tuft = mesh(tuftGeometry, i % 13 === 0 ? hairHighlight : hairMaterial, head)
    tuft.scale.set(0.014 + (i % 3) * 0.002, length, 0.010)
    tuft.position.copy(base).addScaledVector(direction, length * 0.25)
    tuft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
  }
  for (let i = 0; i < 72; i++) {
    const phi = i / 72 * Math.PI * 2
    const points = Array.from({ length: 14 }, (_, j) => {
      const t = 0.34 + j / 13 * 0.63
      const point = scalpPoint(phi + (1 - t) * 0.1, t)
      return point.add(new THREE.Vector3(0, 0.001, Math.sin(phi) * 0.003))
    })
    tube(head, points, 0.0025, i % 4 === 0 ? hairHighlight : hairMaterial, 16)
  }

  const hand = new THREE.Group()
  hand.name = 'ice-cream-hand'
  hand.position.set(0.44, -0.91, 0.33)
  root.add(hand)
  roundedLimb(hand, new THREE.Vector3(0.17, 0.4, -0.12), new THREE.Vector3(0.2, -0.12, 0.1), 0.09, skin)
  roundedLimb(hand, new THREE.Vector3(0.2, -0.12, 0.1), new THREE.Vector3(-0.31, 0.64, 0.39), 0.085, skin)
  const palm = ellipsoid(hand, skin, [-0.31, 0.70, 0.41], [0.11, 0.15, 0.085])
  palm.rotation.z = -0.35

  // A bitten, hollow wafer held at the lips, as in photo 4. No invented scoop.
  const coneGroup = new THREE.Group()
  coneGroup.position.set(-0.35, 0.88, 0.45)
  coneGroup.rotation.x = 0.12
  coneGroup.rotation.z = -0.05
  hand.add(coneGroup)
  const waferVertices: number[] = []
  const waferIndices: number[] = []
  const segments = 48
  const layers = 12
  const layerSize = (segments + 1) * (layers + 1)
  const rimY = (angle: number) => 0.25 - 0.07 * Math.pow(Math.max(0, Math.sin(angle)), 4) + 0.013 * Math.sin(angle * 13)
  function waferPoint(angle: number, t: number, inside = false) {
    const radius = 0.008 + t * 0.14 - (inside ? 0.012 * t : 0)
    return new THREE.Vector3(Math.cos(angle) * radius, -0.25 + t * (rimY(angle) + 0.25), Math.sin(angle) * radius)
  }
  for (let layer = 0; layer < 2; layer++) {
    for (let row = 0; row <= layers; row++) {
      for (let column = 0; column <= segments; column++) {
        const point = waferPoint(column / segments * Math.PI * 2, row / layers, layer === 1)
        waferVertices.push(point.x, point.y, point.z)
        if (row < layers && column < segments) {
          const a = layer * layerSize + row * (segments + 1) + column
          if (layer === 0) waferIndices.push(a, a + 49, a + 1, a + 1, a + 49, a + 50)
          else waferIndices.push(a, a + 1, a + 49, a + 1, a + 50, a + 49)
        }
      }
    }
  }
  const waferGeometry = new THREE.BufferGeometry()
  waferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(waferVertices, 3))
  waferGeometry.setIndex(waferIndices)
  waferGeometry.computeVertexNormals()
  mesh(waferGeometry, coneMaterial, coneGroup)
  const rimPoints = Array.from({ length: 97 }, (_, i) => waferPoint(i / 96 * Math.PI * 2, 1))
  tube(coneGroup, rimPoints, 0.009, waferEdge, 96)
  for (const direction of [-1, 1]) {
    for (let strip = 0; strip < 9; strip++) {
      const points = Array.from({ length: 25 }, (_, i) => {
        const t = 0.04 + i / 24 * 0.94
        const angle = strip / 9 * Math.PI * 2 + direction * t * Math.PI * 1.15
        const point = waferPoint(angle, t)
        return point.add(new THREE.Vector3(Math.cos(angle) * 0.002, 0, Math.sin(angle) * 0.002))
      })
      tube(coneGroup, points, 0.004, waffleMaterial, 24)
    }
  }
  for (let i = 0; i < 3; i++) {
    const y = 0.69 + i * 0.055
    tube(hand, [
      new THREE.Vector3(-0.43, y + 0.025, 0.45),
      new THREE.Vector3(-0.36, y + 0.01, 0.55),
      new THREE.Vector3(-0.28, y - 0.014, 0.54),
    ], 0.032, skin, 16)
    ellipsoid(hand, skin, [-0.28, y - 0.014, 0.54], [0.032, 0.032, 0.027])
  }
  roundedLimb(hand, new THREE.Vector3(-0.20, 0.64, 0.40), new THREE.Vector3(-0.22, 0.79, 0.47), 0.038, skin)

  const tongue = new THREE.Group()
  head.add(tongue)
  const tongueSurface = material('#d97166', 0.65)
  const tongueTip = ellipsoid(tongue, tongueSurface, [-0.025, 0.115, 0.595], [0.11, 0.14, 0.035])
  tongueTip.rotation.z = -0.22
  tube(tongue, [new THREE.Vector3(-0.005, 0.20, 0.63), new THREE.Vector3(-0.04, 0.12, 0.64), new THREE.Vector3(-0.08, 0.05, 0.62)], 0.007, lipMaterial, 16)

  const mouthCone = coneGroup.clone(true)
  mouthCone.position.set(0, 0.235, 0.68)
  mouthCone.rotation.set(Math.PI / 2, 0, 0)
  mouthCone.scale.setScalar(1.12)
  head.add(mouthCone)
  const relaxedArms = new THREE.Group()
  root.add(relaxedArms)
  for (const side of [-1, 1]) {
    roundedLimb(relaxedArms, new THREE.Vector3(side * 0.56, -0.64, -0.04), new THREE.Vector3(side * 0.64, -1.35, -0.11), 0.09, skin)
  }
  const setPose = (pose: CompanionPose) => {
    for (const part of mouthParts) part.visible = pose !== 'peek'
    hand.visible = pose === 'snack'
    cape.visible = pose !== 'play'
    tongue.visible = pose === 'play'
    mouthCone.visible = pose === 'peek'
    relaxedArms.visible = pose === 'play'
  }
  setPose('snack')

  return {
    root,
    head,
    eyes,
    hand,
    cape,
    setPose,
    dispose() {
      for (const geometry of geometries) geometry.dispose()
      for (const surface of materials) surface.dispose()
      geometries.clear()
      materials.clear()
    },
  }
}
