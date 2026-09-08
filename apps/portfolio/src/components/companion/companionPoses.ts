export const companionPoses = ['snack', 'play', 'peek'] as const
export type CompanionPose = typeof companionPoses[number]

export function isCompanionPose(value: unknown): value is CompanionPose {
  return companionPoses.some((pose) => pose === value)
}

export function nextCompanionPose(pose: CompanionPose): CompanionPose {
  return companionPoses[(companionPoses.indexOf(pose) + 1) % companionPoses.length]
}

export function poseForSection(section: number, base: CompanionPose = 'snack'): CompanionPose {
  return companionPoses[(companionPoses.indexOf(base) + Math.max(0, section)) % companionPoses.length]
}

export function poseLabel(pose: CompanionPose, language: string) {
  return language === 'zh'
    ? { snack: '吃蛋筒', play: '做鬼脸', peek: '蛋筒小喇叭' }[pose]
    : { snack: 'Ice cream', play: 'Funny face', peek: 'Cone trumpet' }[pose]
}

export const COMPANION_POSE_EVENT = 'companion:pose'
