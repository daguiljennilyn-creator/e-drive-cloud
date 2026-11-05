import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-[12px] text-muted', className)}>
      <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
      {label}
    </span>
  )
}

export function PageLoader({ label = 'Loading your vault…' }: { label?: string }) {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-2xl bg-brand-200/50" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </div>
      <p className="text-[12.5px] font-medium text-muted">{label}</p>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200/70', className)} />
}
