import type { Priority, Status } from '../../../../shared/dto'
import { PRIORITY, statusAccent } from './model'

type IconProps = { size?: number; className?: string }

/**
 * Status as a progress glyph: dashed ring (backlog), empty ring (todo), half pie (doing),
 * three-quarter pie (review), filled check (done). The shape alone tells the state.
 */
export function StatusIcon({ status, size = 14, className }: IconProps & { status: Status }) {
  const c = statusAccent(status)
  const pie = (fraction: number) => {
    const r = 3.5
    const a = 2 * Math.PI * fraction - Math.PI / 2
    const large = fraction > 0.5 ? 1 : 0
    return `M7 7 L7 ${7 - r} A${r} ${r} 0 ${large} 1 ${7 + r * Math.cos(a)} ${7 + r * Math.sin(a)} Z`
  }
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} className={className} aria-hidden="true" style={{ flexShrink: 0 }}>
      {status === 'done' ? (
        <>
          <circle cx="7" cy="7" r="6" fill={c} />
          <path d="M4.4 7.2l1.8 1.8 3.5-3.7" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <circle
            cx="7"
            cy="7"
            r="5.75"
            fill="none"
            stroke={c}
            strokeWidth="1.5"
            strokeDasharray={status === 'backlog' ? '1.4 1.6' : undefined}
          />
          {status === 'doing' && <path d={pie(0.5)} fill={c} />}
          {status === 'review' && <path d={pie(0.75)} fill={c} />}
        </>
      )}
    </svg>
  )
}

/** Signal bars for low/medium/high, an alert badge for urgent, three dashes for none. */
export function PriorityIcon({ priority, size = 14, className }: IconProps & { priority: Priority }) {
  const rank = PRIORITY[priority].rank
  if (priority === 'urgent') {
    return (
      <svg viewBox="0 0 14 14" width={size} height={size} className={className} aria-hidden="true" style={{ flexShrink: 0 }}>
        <rect x="1" y="1" width="12" height="12" rx="3" fill={PRIORITY.urgent.color} />
        <path d="M7 3.8v4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="7" cy="10.1" r="0.95" fill="#fff" />
      </svg>
    )
  }
  if (priority === 'none') {
    return (
      <svg viewBox="0 0 14 14" width={size} height={size} className={className} aria-hidden="true" style={{ flexShrink: 0 }}>
        {[2, 6, 10].map((x) => (
          <rect key={x} x={x} y="6.25" width="2.2" height="1.5" rx="0.5" fill="currentColor" opacity="0.55" />
        ))}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} className={className} aria-hidden="true" style={{ flexShrink: 0 }}>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={1.5 + i * 4}
          y={9 - i * 3}
          width="3"
          height={3.5 + i * 3}
          rx="0.8"
          fill="currentColor"
          opacity={i < rank ? 1 : 0.25}
        />
      ))}
    </svg>
  )
}
