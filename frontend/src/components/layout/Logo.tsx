import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

export function Logo({
  light = false,
  compact = false,
  to = '/dashboard',
}: {
  light?: boolean
  compact?: boolean
  to?: string
}) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5">
      <img src="/logo.svg" alt="E-Drive Cloud" className="h-9 w-9 rounded-xl shadow-lg" />
      {!compact && (
        <span className="min-w-0">
          <span
            className={cn(
              'block text-[14px] font-bold leading-tight tracking-[-0.02em]',
              light ? 'text-white' : 'text-ink',
            )}
          >
            E-Drive Cloud
          </span>
          <span
            className={cn(
              'mt-0.5 block text-[8.5px] font-semibold uppercase tracking-[0.16em]',
              light ? 'text-brand-200/80' : 'text-slate-400',
            )}
          >
            Enterprise · v4.1.2
          </span>
        </span>
      )}
    </Link>
  )
}