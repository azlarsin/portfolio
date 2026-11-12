import { useId } from 'react'
import type { CompanionPose } from './companionPoses'
import { companionPhotos } from './companionPhotos'

/** Keep source pixels intact; use the same framing live and in fragment captures. */
export function CompanionPhoto({ pose = 'snack' }: { pose?: CompanionPose }) {
  const id = useId().replace(/:/g, '')
  const photo = companionPhotos[pose]
  const [x, y, width, height] = photo.viewBox
  return (
    <span className="companion-photo-motion">
      <svg className="companion-photo" viewBox={photo.viewBox.join(' ')} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={`${id}-outline`}><path data-photo-outline="" d={photo.outline} /></clipPath>
          <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.94" stopColor="white" /><stop offset="1" stopColor="black" />
          </linearGradient>
          <mask data-photo-mask="" id={`${id}-mask`} maskUnits="userSpaceOnUse" x={x} y={y} width={width} height={height}>
            <rect data-photo-frame="" x={x} y={y} width={width} height={height} fill={`url(#${id}-fade)`} />
          </mask>
        </defs>
        <g mask={`url(#${id}-mask)`}>
          <image href={photo.src} width={photo.width} height={photo.height} clipPath={`url(#${id}-outline)`} />
        </g>
      </svg>
    </span>
  )
}
