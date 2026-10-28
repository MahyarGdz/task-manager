import type { ReactNode } from 'react'
import { cx } from './cx'
import type { Icon } from './icons'

export type SpotAccent = 'data' | 'filtered' | 'complete' | 'selection' | 'none'

/** Four-point sparkle centred on (x, y). */
const sparkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`

/**
 * Small paper-sheet illustration for empty states and step headers. Drawn with theme tokens only,
 * so it follows light/dark without separate assets. The icon names the subject; the accent says
 * what kind of emptiness it is (nothing yet, nothing matched, all done, pick something).
 */
export function SpotArt({ icon: Icon, accent = 'data', className }: { icon: Icon; accent?: SpotAccent; className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={cx('ui-spot-art', className)} aria-hidden="true" focusable="false">
      <circle cx="80" cy="62" r="50" fill="var(--brand-soft)" />
      <circle cx="80" cy="62" r="57" fill="none" stroke="var(--border)" strokeDasharray="2 6" strokeLinecap="round" />
      <rect x="44" y="26" width="62" height="78" rx="8" fill="var(--subtle)" stroke="var(--border)" transform="rotate(-9 75 65)" />
      <rect x="56" y="24" width="62" height="80" rx="8" fill="var(--ink)" opacity=".07" />
      <rect x="53" y="19" width="62" height="80" rx="8" fill="var(--surface)" stroke="var(--border)" />
      <rect x="80" y="30" width="26" height="5" rx="2.5" fill="var(--brand)" />
      <rect x="62" y="42" width="44" height="3.5" rx="1.75" fill="var(--border)" />
      <rect x="72" y="50" width="34" height="3.5" rx="1.75" fill="var(--border)" />
      <circle cx="84" cy="76" r="14" fill="var(--brand-soft)" stroke="var(--brand)" strokeWidth="1.5" />
      <Icon x={76} y={68} size={16} strokeWidth={1.9} color="var(--brand)" />
      <path d={sparkle(28, 38, 6)} fill="var(--brand)" opacity=".55" />
      <path d={sparkle(136, 74, 4.5)} fill="var(--brand)" opacity=".4" />
      <circle cx="132" cy="44" r="2" fill="var(--brand)" opacity=".35" />
      <circle cx="32" cy="92" r="2.5" fill="var(--brand)" opacity=".3" />
      {accent === 'data' && (
        <g>
          <circle cx="117" cy="22" r="11" fill="var(--brand)" stroke="var(--surface)" strokeWidth="3" />
          <path d="M117 17v10M112 22h10" stroke="var(--on-brand)" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}
      {accent === 'complete' && (
        <g>
          <circle cx="117" cy="22" r="11" fill="var(--positive)" stroke="var(--surface)" strokeWidth="3" />
          <path
            d="m112 22.5 3.4 3.4 6.4-7"
            fill="none"
            stroke="var(--surface)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
      {accent === 'filtered' && (
        <g>
          <path d="m36 98 9-9" stroke="var(--ink-3)" strokeWidth="6" strokeLinecap="round" />
          <circle cx="54" cy="80" r="14" fill="var(--surface)" fillOpacity=".75" stroke="var(--ink-3)" strokeWidth="3.5" />
          <path d="M48 76a7 7 0 0 1 7-4" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" opacity=".6" />
        </g>
      )}
      {accent === 'selection' && (
        <g>
          <path
            d="M126 92a9 9 0 0 0-9-9M131 92a14 14 0 0 0-14-14"
            fill="none"
            stroke="var(--brand)"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity=".5"
          />
          <path
            d="m112 87 14 30 3.8-12.2L142 101Z"
            fill="var(--ink)"
            stroke="var(--surface)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            transform="rotate(-24 112 87) translate(4 -2)"
          />
        </g>
      )}
    </svg>
  )
}

/** Pointed Persian arch for the window behind the counter. */
const ARCH = 'M70 560V340C70 276 118 238 180 204C242 238 290 276 290 340V560Z'
/** Waisted tea glass (استکان کمرباریک), symmetric about x = 390. */
const GLASS =
  'M364 512C364 532 373 540 373 552C373 562 366 570 366 582C366 594 372 602 372 602H408C408 602 414 594 414 582C414 570 407 562 407 552C407 540 416 532 416 512Z'

/** Morning at a café counter: ledger, tea and the till's receipt under a girih-lattice window. */
export function CafeCounterArt({ className }: { className?: string }) {
  const ledgerRows = [540, 551, 562, 573]
  const receiptRows: [number, number][] = [
    [462, 30],
    [472, 22],
    [486, 34],
    [496, 18],
    [506, 28]
  ]
  return (
    <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="dc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c1d2c" />
          <stop offset=".75" stopColor="#16384f" />
        </linearGradient>
        <pattern id="dc-girih" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M10 10h20v20H10ZM20 5.86 34.14 20 20 34.14 5.86 20ZM20 0v5.86M20 34.14V40M0 20h5.86M34.14 20H40"
            fill="none"
            stroke="#70d3cd"
          />
        </pattern>
        <pattern id="dc-lattice" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="translate(0 4) scale(.9)">
          <path
            d="M10 10h20v20H10ZM20 5.86 34.14 20 20 34.14 5.86 20ZM20 0v5.86M20 34.14V40M0 20h5.86M34.14 20H40"
            fill="none"
            stroke="#a6ece6"
            strokeWidth="1.6"
          />
        </pattern>
        <radialGradient id="dc-sun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#f6cf86" stopOpacity=".85" />
          <stop offset=".55" stopColor="#e9a85a" stopOpacity=".25" />
          <stop offset="1" stopColor="#e9a85a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dc-tea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e7a552" />
          <stop offset="1" stopColor="#9c3f17" />
        </linearGradient>
        <linearGradient id="dc-counter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#12293b" />
          <stop offset="1" stopColor="#0b1a27" />
        </linearGradient>
        <clipPath id="dc-arch">
          <path d={ARCH} />
        </clipPath>
        <clipPath id="dc-glass">
          <path d={GLASS} />
        </clipPath>
      </defs>

      <rect width="600" height="800" fill="url(#dc-sky)" />
      <rect width="600" height="800" fill="url(#dc-girih)" opacity=".05" />

      {/* Window: dawn behind a girih lattice. */}
      <g clipPath="url(#dc-arch)">
        <rect x="60" y="190" width="240" height="380" fill="#1f4a63" />
        <circle cx="180" cy="560" r="190" fill="url(#dc-sun)" />
        <rect x="60" y="190" width="240" height="380" fill="url(#dc-lattice)" opacity=".42" />
      </g>
      <path d={ARCH} fill="none" stroke="#2c6482" strokeWidth="9" />
      <rect x="56" y="556" width="248" height="10" rx="3" fill="#2c6482" />
      <path d="M70 566H290L430 612H120Z" fill="#f6cf86" opacity=".07" />
      <path d={sparkle(322, 440, 7)} fill="#70d3cd" opacity=".7" />
      <path d={sparkle(96, 176, 5)} fill="#70d3cd" opacity=".5" />
      <circle cx="340" cy="470" r="2.5" fill="#70d3cd" opacity=".45" />

      {/* Counter. */}
      <rect y="612" width="600" height="188" fill="url(#dc-counter)" />
      <rect y="603" width="600" height="14" rx="2" fill="#2b5d78" />
      <rect y="603" width="600" height="3" fill="#4a89a5" />
      <path d="M100 628V800M300 628V800M500 628V800" stroke="#173548" strokeWidth="2" />

      {/* Ledger, open on a petrol cover. */}
      <rect x="84" y="592" width="232" height="13" rx="3" fill="#0a7a80" />
      <path d="M96 596Q150 586 200 598V528Q150 516 104 526Z" fill="#f4f8fa" />
      <path d="M200 598Q250 586 304 596L296 526Q250 516 200 528Z" fill="#e1eaf0" />
      <path d="M200 528V598" stroke="#bfcfd9" strokeWidth="1.5" />
      {ledgerRows.map((y) => (
        <g key={y} fill="none" stroke="#c7d5de" strokeWidth="1.5" strokeLinecap="round">
          <path d={`M114 ${y}Q150 ${y - 7} 190 ${y + 1}`} />
          <path d={`M210 ${y + 1}Q250 ${y - 7} 286 ${y}`} />
        </g>
      ))}
      <path d="M240 584Q262 578 284 583" fill="none" stroke="#086d73" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M232 598V646L238 640L244 646V598Z" fill="#e0a33f" />

      {/* Tea on its saucer, with two sugar cubes. */}
      <ellipse cx="390" cy="606" rx="46" ry="8" fill="#eef3f6" />
      <ellipse cx="390" cy="606" rx="46" ry="8" fill="none" stroke="#d9a54a" strokeWidth="2" />
      <ellipse cx="390" cy="605" rx="28" ry="4.5" fill="#d6e0e7" />
      <g clipPath="url(#dc-glass)">
        <rect x="360" y="528" width="60" height="80" fill="url(#dc-tea)" opacity=".94" />
      </g>
      <ellipse cx="390" cy="528" rx="22" ry="3" fill="#f2bd6d" />
      <path d={GLASS} fill="#ffffff" fillOpacity=".12" stroke="#ffffff" strokeOpacity=".6" strokeWidth="1.5" />
      <ellipse cx="390" cy="512" rx="26" ry="3.5" fill="none" stroke="#ffffff" strokeOpacity=".75" strokeWidth="1.5" />
      <path d="M371 520C371 534 379 542 379 552" fill="none" stroke="#ffffff" strokeOpacity=".55" strokeWidth="2.5" strokeLinecap="round" />
      <g className="dc-steam" fill="none" stroke="#ffffff" strokeOpacity=".4" strokeWidth="3" strokeLinecap="round">
        <path d="M382 500C376 488 390 480 384 466C380 456 388 450 386 440" />
        <path d="M398 498C393 490 404 484 399 472" />
      </g>
      <rect x="446" y="589" width="14" height="14" rx="2" fill="#f7fafc" stroke="#cfd9e0" />
      <rect x="462" y="592" width="12" height="12" rx="2" fill="#f7fafc" stroke="#cfd9e0" transform="rotate(14 468 598)" />

      {/* Till receipt printer: the day's total, printed. */}
      <path d="M494 562V446l6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6V562Z" fill="#fbfcfd" />
      {receiptRows.map(([y, w]) => (
        <rect key={y} x={536 - w} y={y} width={w} height="3.5" rx="1.75" fill="#c3d0d9" />
      ))}
      <path d="M500 520H536" stroke="#c3d0d9" strokeWidth="1.5" strokeDasharray="3 3" />
      <rect x="502" y="530" width="34" height="5" rx="2.5" fill="#086d73" />
      <rect x="476" y="562" width="88" height="44" rx="8" fill="#dbe5eb" />
      <rect x="476" y="556" width="88" height="14" rx="7" fill="#eef3f6" />
      <path d="M490 562H550" stroke="#93a8b6" strokeWidth="2" strokeLinecap="round" />
      <rect x="476" y="588" width="88" height="18" rx="6" fill="#c5d3dc" />
      <circle cx="550" cy="580" r="3" fill="#70d3cd" />
    </svg>
  )
}

/** The illustrated side panel shared by the welcome and sign-in screens. */
export function EntryArt({ kicker, footer, children }: { kicker: string; footer: ReactNode; children: ReactNode }) {
  return (
    <aside className="entry-art" aria-label="پیشخوان کافه">
      <CafeCounterArt className="entry-art-scene" />
      <div className="entry-art-top">
        <span className="entry-art-dot" />
        {kicker}
      </div>
      <div className="entry-art-copy">{children}</div>
      <div className="entry-art-footer">{footer}</div>
    </aside>
  )
}
