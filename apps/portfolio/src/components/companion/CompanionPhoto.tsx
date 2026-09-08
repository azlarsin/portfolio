import { useId } from 'react'
import type { CompanionPose } from './companionPoses'

/** Preserve the reference-based portrait pixels; only its complete silhouette moves. */
export function CompanionPhoto({ pose = 'snack' }: { pose?: CompanionPose }) {
  const id = useId().replace(/:/g, '')
  const silhouette = `${id}-photo-silhouette`
  const fade = `${id}-photo-fade`
  const mask = `${id}-photo-mask`
  if (pose !== 'snack') {
    const play = pose === 'play'
    const path = play
      ? 'M232 1280L226 916C233 855 252 786 286 742C322 704 362 688 410 677L438 672L441 653C409 623 399 589 396 550L392 516C382 494 386 457 400 453L409 458L414 404C416 349 440 301 485 276L477 278L497 266L492 267L516 257L511 256L538 249L533 245L560 247L572 244L584 249L599 247L614 255L629 257L643 267L656 273L670 287L681 303L692 325L699 350L702 381L701 414L693 449L682 485L677 503C696 498 704 508 700 529C696 558 681 580 657 590C642 619 621 644 594 662L589 689C626 704 663 720 692 748C724 788 739 851 748 917L753 985C740 1005 705 1016 677 1009L670 1051L651 1090L640 1137L643 1216L654 1280Z'
      : 'M48 1280L98 1208L158 1149L208 1054L243 938L272 818L293 734C314 652 356 602 414 575L437 570L441 552C417 523 405 487 402 452L399 400C389 379 394 321 404 312L407 284L415 239L424 198L440 153L455 124L474 97L497 68L519 48L543 32L556 23L579 24L598 19L616 25L638 23L660 30L675 30L693 38L710 42L725 52L743 61L757 77L771 92L782 114L796 137L803 163L809 187L814 216L812 245L805 277L800 311L789 340L784 361C798 362 797 383 790 404C783 437 768 457 746 468C724 516 698 553 661 578L656 600C691 606 729 622 756 642C806 679 830 733 841 796L850 858L853 942L847 1033L832 1126L817 1216L816 1280Z'
    return (
      <span className="companion-photo-motion">
        <svg className="companion-photo" viewBox={play ? '250 230 600 637.5' : '207 0 800 850'} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <defs><mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="960" height="1280"><path d={path} fill="white" stroke="black" strokeWidth="6" /></mask></defs>
          <image href={`/portraits/explorer-${pose}.jpg`} width="960" height="1280" mask={`url(#${mask})`} />
        </svg>
      </span>
    )
  }
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
