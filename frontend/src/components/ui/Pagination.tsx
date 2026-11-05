import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { PaginationMeta } from '../../types'

function pageWindow(current: number, last: number): (number | 'ellipsis')[] {
  if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1)
  const pages: (number | 'ellipsis')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(last - 1, current + 1)
  if (start > 2) pages.push('ellipsis')
  for (let page = start; page <= end; page += 1) pages.push(page)
  if (end < last - 1) pages.push('ellipsis')
  pages.push(last)
  return pages
}

export function Pagination({
  meta,
  onPageChange,
  noun = 'items',
  className,
}: {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  noun?: string
  className?: string
}) {
  if (meta.total === 0) return null

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 sm:flex-row',
        className,
      )}
    >
      <p className="text-[11.5px] text-muted">
        Showing <span className="font-semibold text-slate-700">{meta.from ?? 0}</span>–
        <span className="font-semibold text-slate-700">{meta.to ?? 0}</span> of{' '}
        <span className="font-semibold text-slate-700">{meta.total}</span> {noun}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={meta.current_page <= 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageWindow(meta.current_page, meta.last_page).map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-[11.5px] font-semibold transition',
                page === meta.current_page
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-line bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              {page}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={meta.current_page >= meta.last_page}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
