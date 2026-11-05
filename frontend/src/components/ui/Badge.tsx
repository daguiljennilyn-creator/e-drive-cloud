import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'dark' | 'outline'

const tones: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-700 ring-amber-100',
  danger: 'bg-red-50 text-red-700 ring-red-100',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  dark: 'bg-navy text-white ring-navy/10',
  outline: 'bg-white text-slate-600 ring-line',
}

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className,
}: {
  children: ReactNode
  tone?: Tone
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function StatusBadge({ status, isExpired }: { status: string; isExpired?: boolean }) {
  if (isExpired || status === 'expired') {
    return (
      <Badge tone="danger" dot>
        Expired
      </Badge>
    )
  }
  switch (status) {
    case 'verified':
      return (
        <Badge tone="success" dot>
          Verified
        </Badge>
      )
    case 'shared':
      return (
        <Badge tone="brand" dot>
          Shared
        </Badge>
      )
    case 'trashed':
      return (
        <Badge tone="warning" dot>
          Trashed
        </Badge>
      )
    case 'draft':
      return (
        <Badge tone="warning" dot>
          Draft
        </Badge>
      )
    default:
      return (
        <Badge tone="success" dot>
          Active
        </Badge>
      )
  }
}

export function HealthBadge({ health }: { health: string }) {
  if (health === 'strong') {
    return (
      <Badge tone="success" dot>
        Strong
      </Badge>
    )
  }
  if (health === 'fair') {
    return (
      <Badge tone="warning" dot>
        Rotate
      </Badge>
    )
  }
  return (
    <Badge tone="danger" dot>
      Weak
    </Badge>
  )
}
