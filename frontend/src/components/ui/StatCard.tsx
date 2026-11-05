import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '../../lib/cn'

export function StatCard({
  label,
  value,
  meta,
  icon: Icon,
  tone = 'brand',
  trend,
  onClick,
}: {
  label: string
  value: string | number
  meta?: string
  icon: LucideIcon
  tone?: 'brand' | 'success' | 'violet' | 'amber'
  trend?: string
  onClick?: () => void
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 ring-brand-100',
    success: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    violet: 'bg-violet-50 text-violet-600 ring-violet-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  }

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11.5px] font-medium text-muted">{label}</span>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset', tones[tone])}>
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-[28px] font-bold leading-none tracking-[-0.04em] text-ink">{value}</p>
        {onClick && <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-brand-500" />}
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {trend && (
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">
            {trend}
          </span>
        )}
        {meta && <span className="text-[10.5px] font-medium text-slate-500">{meta}</span>}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group rounded-2xl border border-line bg-white p-4 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-card)]">
      {content}
    </div>
  )
}

export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div
        className={cn('h-full rounded-full bg-brand-600 transition-all duration-500', barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
