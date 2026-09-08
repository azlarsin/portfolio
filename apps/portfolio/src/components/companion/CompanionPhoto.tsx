import { useId } from 'react'

/** Preserve the reference-based portrait pixels; only its complete silhouette moves. */
export function CompanionPhoto() {
  const id = useId().replace(/:/g, '')
  const silhouette = `${id}-photo-silhouette`
  const fade = `${id}-photo-fade`
  const mask = `${id}-photo-mask`
  return (
    <span className="companion-photo-motion">
      <svg
        className="companion-photo"
        viewBox="190 0 850 903.125"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Display clipping keeps the generated raster untouched. The source's
              background is opaque, so alpha must not be assumed by consumers. */}
          <clipPath id={silhouette} clipPathUnits="userSpaceOnUse">
            <path d="M48 1402L73 1360 96 1323 132 1286 174 1245 190 1190 208 1114 226 1034 244 953 262 870 284 786 303 721 326 672 353 634 393 608 421 595 441 574 480 565 493 561C462 532 438 499 420 459L399 424 389 392 385 368 387 346 390 325 385 329 390 302 388 289 395 265 391 270 400 241 398 227 407 207 407 191 416 178 412 179 425 158 422 155 435 138 430 137 451 117 447 115 467 100 462 98 484 82 480 78 502 68 497 65 521 56 516 51 541 46 534 40 558 37 552 32 578 33 579 27 599 31 609 25 623 30 638 27 651 34 664 30 678 38 693 37 706 48 719 50 730 62 743 65 752 81 764 85 769 103 779 112 778 128 787 142 784 158 793 173 789 189 798 208 792 223 797 241 791 257 795 274 788 296 790 317 782 333C793 326 800 335 799 354C799 388 779 423 754 440C742 483 721 513 692 542L684 563C718 569 744 579 771 593C811 611 843 638 866 674C890 713 905 753 911 804L918 875 923 948 924 1011 919 1091 912 1187 909 1294 909 1402Z" />
          </clipPath>
          <linearGradient id={fade} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="white" />
            <stop offset="0.94" stopColor="white" />
            <stop offset="1" stopColor="black" />
          </linearGradient>
          <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="1122" height="903.125">
            <rect width="1122" height="903.125" fill={`url(#${fade})`} />
          </mask>
        </defs>
        <g mask={`url(#${mask})`}>
          <image
            href="/portraits/explorer-photo-v1.png"
            width="1122"
            height="1402"
            clipPath={`url(#${silhouette})`}
            preserveAspectRatio="xMidYMin meet"
          />
        </g>
      </svg>
    </span>
  )
}
