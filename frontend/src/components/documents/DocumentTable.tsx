import { useEffect, useRef, type ReactNode } from 'react'
import {
  Download,
  Eye,
  Link2,
  Pencil,
  RotateCcw,
  Star,
  Trash2,
  Undo2,
} from 'lucide-react'
import type { Document } from '../../types'
import { formatDate } from '../../lib/format'
import { ActionMenu, type MenuItem } from '../ui/Menu'
import { StatusBadge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { FileIcon } from '../ui/FileIcon'
import { Spinner } from '../ui/Spinner'
import { cn } from '../../lib/cn'

type DocumentTableProps = {
  documents: Document[]
  loading?: boolean
  selected?: number[]
  onToggleSelect?: (id: number) => void
  onToggleAll?: () => void
  onClearSelection?: () => void
  bulkActions?: ReactNode
  onOpen: (document: Document) => void
  onEdit?: (document: Document) => void
  onShare?: (document: Document) => void
  onToggleFavorite?: (document: Document) => void
  onTrash?: (document: Document) => void
  onRestore?: (document: Document) => void
  onDeleteForever?: (document: Document) => void
  onDownload?: (document: Document) => void
  trashed?: boolean
  compact?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  className?: string
}

export function DocumentTable({
  documents,
  loading = false,
  selected = [],
  onToggleSelect,
  onToggleAll,
  onClearSelection,
  bulkActions,
  onOpen,
  onEdit,
  onShare,
  onToggleFavorite,
  onTrash,
  onRestore,
  onDeleteForever,
  onDownload,
  trashed = false,
  compact = false,
  emptyTitle = 'No documents found',
  emptyDescription = 'Try adjusting your search or upload a new document to get started.',
  emptyAction,
  className,
}: DocumentTableProps) {
  const selectable = typeof onToggleSelect === 'function'
  const allSelected = selectable && documents.length > 0 && selected.length === documents.length
  const someSelected = selectable && selected.length > 0 && !allSelected

  const actionsFor = (document: Document): MenuItem[] => {
    const items: MenuItem[] = [
      { label: 'View details', icon: Eye, onSelect: () => onOpen(document) },
    ]

    if (!trashed) {
      if (onEdit) items.push({ label: 'Edit document', icon: Pencil, onSelect: () => onEdit(document) })
      if (onShare) items.push({ label: 'Share securely', icon: Link2, onSelect: () => onShare(document) })
      if (onToggleFavorite) {
        items.push({
          label: document.is_favorite ? 'Remove favorite' : 'Add to favorites',
          icon: Star,
          onSelect: () => onToggleFavorite(document),
        })
      }
      if (onDownload) items.push({ label: 'Download file', icon: Download, onSelect: () => onDownload(document) })
      if (onTrash) {
        items.push({
          label: 'Move to trash',
          icon: Trash2,
          tone: 'danger',
          onSelect: () => onTrash(document),
        })
      }
    } else {
      if (onRestore) items.push({ label: 'Restore document', icon: Undo2, onSelect: () => onRestore(document) })
      if (onDownload) items.push({ label: 'Download file', icon: Download, onSelect: () => onDownload(document) })
      if (onDeleteForever) {
        items.push({
          label: 'Delete forever',
          icon: Trash2,
          tone: 'danger',
          onSelect: () => onDeleteForever(document),
        })
      }
    }

    return items
  }

  if (loading && documents.length === 0) {
    return (
      <div className={cn('flex min-h-56 items-center justify-center rounded-2xl border border-line bg-white', className)}>
        <Spinner label="Loading documents…" />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className={cn('rounded-2xl border border-line bg-white', className)}>
        <EmptyState
          icon={<RotateCcw className="h-6 w-6" />}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    )
  }

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-line bg-white', className)}>
      {selectable && selected.length > 0 && (
        <div className="flex flex-col gap-2 border-b border-brand-100 bg-brand-50/80 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-semibold text-brand-800">
              {selected.length} selected
            </span>
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="text-[11px] font-semibold text-brand-600 transition hover:text-brand-800"
              >
                Clear
              </button>
            )}
          </div>
          {bulkActions && <div className="flex flex-wrap items-center gap-1.5">{bulkActions}</div>}
        </div>
      )}

      <div className="hidden md:block">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="border-b border-line bg-slate-50/70 text-left">
              {selectable && (
                <th className="w-11 px-3 py-2.5">
                  <SelectAllCheckbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={() => onToggleAll?.()}
                  />
                </th>
              )}
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">
                Document
              </th>
              {!compact && (
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">
                  Category
                </th>
              )}
              <th className="hidden px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500 lg:table-cell">
                Size
              </th>
              <th className="hidden px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500 lg:table-cell">
                {trashed ? 'Trashed' : 'Modified'}
              </th>
              <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">
                Status
              </th>
              <th className="w-12 px-3 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {documents.map((document) => {
              const checked = selected.includes(document.id)
              return (
                <tr
                  key={document.id}
                  onClick={() => onOpen(document)}
                  className={cn(
                    'group cursor-pointer transition hover:bg-slate-50/80',
                    checked && 'bg-brand-50/40',
                  )}
                >
                  {selectable && (
                    <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleSelect?.(document.id)}
                        aria-label={`Select ${document.name}`}
                        className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                      />
                    </td>
                  )}
                  <td className="px-3 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FileIcon extension={document.extension} category={document.category} size="sm" />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-[12.5px] font-semibold text-ink">
                          <span className="truncate">{document.name}</span>
                          {document.is_favorite && (
                            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-500" />
                          )}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-muted">
                          {document.extension.toUpperCase()} · {document.human_size}
                        </p>
                      </div>
                    </div>
                  </td>
                  {!compact && (
                    <td className="px-3 py-3 text-[11.5px] text-slate-600">{document.category_label}</td>
                  )}
                  <td className="hidden px-3 py-3 text-[11.5px] text-slate-600 lg:table-cell">
                    {document.human_size}
                  </td>
                  <td className="hidden px-3 py-3 text-[11.5px] text-slate-500 lg:table-cell">
                    {formatDate(trashed ? document.deleted_at : document.last_modified_at)}
                  </td>
                  <td className="px-3 py-3">
                    {trashed ? (
                      <StatusBadge status="trashed" />
                    ) : (
                      <StatusBadge status={document.status} isExpired={document.is_expired} />
                    )}
                  </td>
                  <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                    <ActionMenu items={actionsFor(document)} align="end" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-line md:hidden">
        {documents.map((document) => {
          const checked = selected.includes(document.id)
          return (
            <div
              key={document.id}
              onClick={() => onOpen(document)}
              className={cn('cursor-pointer p-3.5 transition active:bg-slate-50', checked && 'bg-brand-50/40')}
            >
              <div className="flex items-start gap-3">
                {selectable && (
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleSelect?.(document.id)}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Select ${document.name}`}
                    className="mt-1.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-brand-600"
                  />
                )}
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <FileIcon extension={document.extension} category={document.category} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[12.5px] font-semibold text-ink">
                      <span className="truncate">{document.name}</span>
                      {document.is_favorite && (
                        <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-500" />
                      )}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-muted">
                      {document.category_label} · {document.human_size} ·{' '}
                      {formatDate(trashed ? document.deleted_at : document.last_modified_at)}
                    </p>
                    <div className="mt-2">
                      {trashed ? (
                        <StatusBadge status="trashed" />
                      ) : (
                        <StatusBadge status={document.status} isExpired={document.is_expired} />
                      )}
                    </div>
                  </div>
                  <div onClick={(event) => event.stopPropagation()}>
                    <ActionMenu items={actionsFor(document)} align="end" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean
  indeterminate: boolean
  onChange: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={checked ? 'Clear selection' : 'Select all documents'}
      className="h-4 w-4 rounded border-slate-300 accent-brand-600"
    />
  )
}
