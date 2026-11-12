export const companionPoses = ['snack', 'play', 'peek', 'little', 'thinking', 'surprise', 'cream', 'together', 'peace', 'riding'] as const
export type CompanionPose = typeof companionPoses[number]
export type CompanionStyle = 'photo' | '3d'
export const modelPoses: readonly CompanionPose[] = ['snack', 'play', 'peek']

export function availablePoses(style: CompanionStyle): readonly CompanionPose[] {
  return style === '3d' ? modelPoses : companionPoses
}
export function poseForStyle(pose: CompanionPose, style: CompanionStyle): CompanionPose {
  return availablePoses(style).includes(pose) ? pose : 'snack'
}
export function isCompanionPose(value: unknown): value is CompanionPose {
  return companionPoses.some(pose => pose === value)
}
export function nextCompanionPose(pose: CompanionPose, style: CompanionStyle = 'photo'): CompanionPose {
  const poses = availablePoses(style)
  return poses[(Math.max(0, poses.indexOf(pose)) + 1) % poses.length]
}
export function poseForSection(section: number, base: CompanionPose = 'snack', style: CompanionStyle = 'photo'): CompanionPose {
  const poses = availablePoses(style)
  return poses[(Math.max(0, poses.indexOf(base)) + Math.max(0, section)) % poses.length]
}
export function poseLabel(pose: CompanionPose, language: string) {
  return language === 'zh'
    ? { snack: '吃蛋筒', play: '做鬼脸', peek: '蛋筒小喇叭', little: '小小笑脸', thinking: '托腮想想', surprise: '惊喜一下', cream: '奶油胡子', together: '一起合影', peace: '比个耶', riding: '骑行出发' }[pose]
    : { snack: 'Ice cream', play: 'Funny face', peek: 'Cone trumpet', little: 'Little smile', thinking: 'Thinking', surprise: 'Surprise', cream: 'Cream moustache', together: 'Together', peace: 'Peace sign', riding: 'Ready to ride' }[pose]
}
export const COMPANION_POSE_EVENT = 'companion:pose'
export const COMPANION_SELECT_EVENT = 'companion:select'
export const COMPANION_TRANSITION_END = 'companion:transition-end'
