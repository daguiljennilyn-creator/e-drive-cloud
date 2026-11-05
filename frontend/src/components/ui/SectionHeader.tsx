import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'

export function SectionHeader({
  title,
  actionLabel,
  actionTo,
  onAction,
  className,
}: {
  title: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <h2 className="text-[14px] font-bold tracking-[-0.01em] text-ink">{title}</h2>
      {actionLabel &&
        (actionTo ? (
          <Link
            to={actionTo}
            className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-brand-600 transition hover:text-brand-700"
          >
            {actionLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-brand-600 transition hover:text-brand-700"
          >
            {actionLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ))}
    </div>
  )
}
