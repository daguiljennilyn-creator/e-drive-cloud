import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-500">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-bold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[12.5px] leading-6 text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
