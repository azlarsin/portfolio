export const trajectoryNames = ['burst', 'orbit', 'fan', 'ribbon'] as const
export type TrajectoryName = typeof trajectoryNames[number]
export interface TrajectoryPlan { seed: number; pattern: TrajectoryName; order: number[]; polygons: number[][][]; pieces: { angle: number; distance: number; rotation: number; phase: number; scale: number }[]; bend: number }

function generator(seed: number) {
  let state = seed >>> 0 || 1
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296 }
}

function largePieces(random: () => number): number[][][] {
  const middle = () => 136 + random() * 48
  const y1 = 100 + random() * 35
  const y2 = 220 + random() * 24
  const [x0, x1, x2, x3] = [middle(), middle(), middle(), middle()]
  const e0 = [[x0, 0], [x0 - 8, y1 * 0.38], [x1 + 9, y1 * 0.72], [x1, y1]]
  const e1 = [[x1, y1], [x1 + 10, y1 + (y2 - y1) * 0.36], [x2 - 9, y1 + (y2 - y1) * 0.7], [x2, y2]]
  const e2 = [[x2, y2], [x2 + 8, y2 + (340 - y2) * 0.38], [x3 - 9, y2 + (340 - y2) * 0.72], [x3, 340]]
  const left1 = [[0, y1 - 4], [x1 / 3, y1 + 7], [x1 * 0.67, y1 - 7], [x1, y1]]
  const right1 = [[x1, y1], [x1 + (320 - x1) / 3, y1 + 8], [x1 + (320 - x1) * 0.7, y1 - 6], [320, y1 + 3]]
  const left2 = [[0, y2 + 4], [x2 / 3, y2 - 7], [x2 * 0.67, y2 + 8], [x2, y2]]
  const right2 = [[x2, y2], [x2 + (320 - x2) / 3, y2 + 7], [x2 + (320 - x2) * 0.7, y2 - 7], [320, y2 - 3]]
  const backwards = (points: number[][]) => [...points].reverse().slice(1)
  return [
    [[0, 0], ...e0, ...backwards(left1)],
    [[x0, 0], [320, 0], right1[3], ...backwards(right1), ...backwards(e0)],
    [...left1, ...e1.slice(1), ...backwards(left2)],
    [...right1, right2[3], ...backwards(right2), ...backwards(e1)],
    [...left2, ...e2.slice(1), [0, 340]],
    [...right2, [320, 340], [x3, 340], ...backwards(e2)],
  ]
}
/** Random once per transition. All frames then follow that immutable plan. */
export function makeTrajectory(previous?: TrajectoryName): TrajectoryPlan {
  const seed = crypto.getRandomValues(new Uint32Array(1))[0]
  const random = generator(seed)
  const choices = trajectoryNames.filter(name => name !== previous)
  const pattern = choices[Math.floor(random() * choices.length)]
  const order = [0, 1, 2, 3, 4, 5]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return { seed, pattern, order, polygons: largePieces(random), bend: (random() - 0.5) * 120, pieces: order.map((_, index) => ({ angle: index / 6 * Math.PI * 2 + (random() - 0.5) * 0.9, distance: 52 + random() * 48, rotation: (random() - 0.5) * 95, phase: random() * Math.PI * 2, scale: 0.92 + random() * 0.16 })) }
}
export function pieceTransform(plan: TrajectoryPlan, index: number, progress: number, strength: number) {
  const phase = Math.max(0, Math.min(1, (progress - plan.order[index] * 0.045) / 0.775))
  const t = phase * phase * (3 - 2 * phase)
  const spread = Math.sin(Math.PI * t)
  const piece = plan.pieces[index]
  let angle = piece.angle
  if (plan.pattern === 'orbit') angle += t * Math.PI * 1.2
  let x = Math.cos(angle) * piece.distance
  let y = Math.sin(angle) * piece.distance * 0.8
  if (plan.pattern === 'fan') { x = (index % 2 ? 1 : -1) * piece.distance; y = (index / 5 - 0.5) * 135 + Math.sin(t * Math.PI) * 24 }
  if (plan.pattern === 'ribbon') { x = Math.sin(t * Math.PI * 1.8 + piece.phase) * piece.distance; y = (index / 5 - 0.5) * 150 + Math.cos(t * Math.PI + piece.phase) * 32 }
  const scaleX = 0.52 + 0.48 * Math.abs(Math.cos(Math.PI * t))
  return { incoming: t >= 0.5, spread, transform: `translate3d(${x * spread * strength}px, ${y * spread * strength}px, 0) rotate(${piece.rotation * spread}deg) scale(${1 + (piece.scale - 1) * spread}) scaleX(${scaleX})` }
}
