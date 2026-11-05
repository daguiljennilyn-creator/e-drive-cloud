import type { ReactNode } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/cn'

type Crumb = { label: string; to?: string }

export function PageHeader({
  crumbs,
  title,
  description,
  actions,
  className,
}: {
  crumbs?: Crumb[]
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  const navigate = useNavigate()
  const showBack = !!crumbs && crumbs.length > 1

  return (
    <div className={cn('flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between', className)}>
      <div>
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-brand-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        )}
        {crumbs && crumbs.length > 0 && (
          <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-[11.5px] font-medium text-muted">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                {crumb.to ? (
                  <Link to={crumb.to} className="transition hover:text-brand-600">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-500">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.035em] text-ink">{title}</h1>
        {description && (
          <p className="mt-1.5 text-[13px] leading-5 text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
