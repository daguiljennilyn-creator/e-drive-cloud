import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ArchiveRestore,
  CalendarClock,
  HardDrive,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Undo2,
} from 'lucide-react'
import type { Document, DocumentsResponse } from '../../types'
import { documentsApi } from '../../lib/endpoints'
import { apiErrorMessage, downloadFile } from '../../lib/api'
import { formatBytes } from '../../lib/format'
import { useDebouncedValue } from '../../lib/useDebounce'
import { useToast } from '../../context/ToastContext'
import { DocumentDetails } from '../../components/documents/DocumentDetails'
import { DocumentTable } from '../../components/documents/DocumentTable'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Input'
import { SearchInput } from '../../components/ui/Toolbar'
import { cn } from '../../lib/cn'

const sortOptions = [
  { value: 'last_modified_at', label: 'Last modified' },
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'File size' },
  { value: 'created_at', label: 'Date added' },
]

export function TrashPage() {
  const { success, error } = useToast()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [sort, setSort] = useState('last_modified_at')
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<DocumentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const [details, setDetails] = useState<Document | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<Document | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null)
  const [bulkAction, setBulkAction] = useState<'restore' | 'delete' | null>(null)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const [working, setWorking] = useState(false)

  const reload = useCallback(() => setReloadKey((value) => value + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setFailed(null)

    documentsApi
      .list({
        trashed: 'only',
        q: debouncedSearch.trim() || undefined,
        sort,
        direction,
        per_page: 10,
        page,
      })
      .then((response) => {
        if (!active) return
        setData(response.data)
        if (response.data.meta.last_page < page && page > 1) {
          setPage(Math.max(1, response.data.meta.last_page))
        }
      })
      .catch((caught) => {
        if (active) setFailed(apiErrorMessage(caught, 'Trash could not be loaded.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [debouncedSearch, sort, direction, page, reloadKey])

  const documents = data?.data ?? []
  const meta = data?.meta
  const pageSize = documents.reduce((total, item) => total + item.size, 0)

  const restore = async () => {
    if (!restoreTarget) return
    setWorking(true)
    try {
      await documentsApi.restore(restoreTarget.id)
      success('Document restored', `${restoreTarget.name} is back in your vault.`)
      setRestoreTarget(null)
      setSelected((current) => current.filter((id) => id !== restoreTarget.id))
      reload()
    } catch (caught) {
      error('Could not restore document', apiErrorMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  const deleteForever = async () => {
    if (!deleteTarget) return
    setWorking(true)
    try {
      await documentsApi.forceDelete(deleteTarget.id)
      success('Permanently deleted', `${deleteTarget.name} and its stored file were removed.`)
      setDeleteTarget(null)
      setSelected((current) => current.filter((id) => id !== deleteTarget.id))
      reload()
    } catch (caught) {
      error('Could not delete document', apiErrorMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  const runBulk = async () => {
    if (!bulkAction) return
    setWorking(true)
    try {
      const response = await documentsApi.bulk(bulkAction, selected)
      success(
        bulkAction === 'restore' ? 'Documents restored' : 'Documents deleted',
        response.data.message,
      )
      setSelected([])
      setBulkAction(null)
      reload()
    } catch (caught) {
      error('Bulk action failed', apiErrorMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  const emptyTrash = async () => {
    setWorking(true)
    try {
      const response = await documentsApi.emptyTrash()
      success('Trash emptied', response.data.message)
      setSelected([])
      setConfirmEmpty(false)
      setPage(1)
      reload()
    } catch (caught) {
      error('Could not empty trash', apiErrorMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  const download = async (document: Document) => {
    try {
      await downloadFile(document.download_url, document.original_name)
      success('Download started', document.original_name)
    } catch (caught) {
      error('Download failed', apiErrorMessage(caught))
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Trash' }]}
        title="Trash"
        description="Deleted files stay recoverable for 30 days before they are permanently removed."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={reload}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            <Button
              variant="danger"
              disabled={!meta || meta.total === 0}
              onClick={() => setConfirmEmpty(true)}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Empty trash
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <TrashStat icon={Trash2} label="Items in trash" value={String(meta?.total ?? 0)} tone="amber" />
        <TrashStat icon={HardDrive} label="Size on this page" value={formatBytes(pageSize)} tone="brand" />
        <TrashStat icon={CalendarClock} label="Retention window" value="30 days" tone="violet" />
        <TrashStat icon={ShieldCheck} label="Encryption" value="AES-256" tone="success" />
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-[11.5px] leading-5 text-amber-900/80">
          Files in trash still count toward your storage until they are permanently deleted. Restore
          anything you need before the retention window closes.
        </p>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col gap-2.5 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Search deleted documents…"
            ariaLabel="Search trash"
            className="w-full sm:max-w-[320px]"
          />
          <div className="flex items-center gap-2">
            <Select
              options={sortOptions}
              value={sort}
              onChange={(event) => {
                setSort(event.target.value)
                setPage(1)
              }}
              aria-label="Sort trash"
              className="h-9 w-[150px] text-[12px]"
            />
            <button
              type="button"
              onClick={() => {
                setDirection((value) => (value === 'asc' ? 'desc' : 'asc'))
                setPage(1)
              }}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-slate-500 transition hover:bg-slate-50"
              aria-label={`Sort ${direction === 'asc' ? 'descending' : 'ascending'}`}
              title={direction === 'asc' ? 'Ascending' : 'Descending'}
            >
              {direction === 'asc' ? (
                <ArrowUpNarrowWide className="h-4 w-4" />
              ) : (
                <ArrowDownWideNarrow className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <DocumentTable
          documents={documents}
          loading={loading}
          trashed
          selected={selected}
          onToggleSelect={(id) =>
            setSelected((current) =>
              current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
            )
          }
          onToggleAll={() =>
            setSelected((current) =>
              current.length === documents.length ? [] : documents.map((item) => item.id),
            )
          }
          onClearSelection={() => setSelected([])}
          bulkActions={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setBulkAction('restore')}
                leftIcon={<Undo2 className="h-3.5 w-3.5" />}
              >
                Restore {selected.length}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setBulkAction('delete')}
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Delete forever
              </Button>
            </>
          }
          onOpen={setDetails}
          onRestore={setRestoreTarget}
          onDeleteForever={setDeleteTarget}
          onDownload={(document) => void download(document)}
          className="rounded-none border-0"
          emptyTitle={debouncedSearch ? 'No matching deleted files' : 'Trash is empty'}
          emptyDescription={
            debouncedSearch
              ? 'Try a different search term to find a deleted document.'
              : 'Documents you delete will appear here and remain recoverable for 30 days.'
          }
          emptyAction={
            debouncedSearch ? (
              <Button
                variant="secondary"
                onClick={() => setSearch('')}
                leftIcon={<ArchiveRestore className="h-4 w-4" />}
              >
                Clear search
              </Button>
            ) : undefined
          }
        />

        {failed && !data ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[12.5px] font-semibold text-ink">Trash unavailable</p>
            <p className="mt-1 text-[11.5px] text-muted">{failed}</p>
            <Button className="mt-4" onClick={reload} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Try again
            </Button>
          </div>
        ) : null}

        {meta && meta.total > 0 && (
          <div className="border-t border-line px-4 py-3.5">
            <Pagination meta={meta} onPageChange={setPage} noun="deleted documents" />
          </div>
        )}
      </Card>

      {failed && data ? (
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5 text-[11.5px] text-amber-800">
          {failed}
        </p>
      ) : null}

      <DocumentDetails
        document={details}
        open={Boolean(details)}
        onClose={() => setDetails(null)}
        trashed
        onRestored={() => {
          setDetails(null)
          reload()
        }}
        onDeleted={() => {
          setDetails(null)
          reload()
        }}
      />

      <ConfirmDialog
        open={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        onConfirm={restore}
        loading={working}
        title="Restore document?"
        description={
          restoreTarget
            ? `${restoreTarget.name} will return to your vault with its original metadata intact.`
            : ''
        }
        confirmLabel="Restore document"
        tone="primary"
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteForever}
        loading={working}
        title="Delete forever?"
        description={
          deleteTarget
            ? `${deleteTarget.name} and its stored file will be permanently deleted. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete forever"
      />

      <ConfirmDialog
        open={bulkAction === 'restore'}
        onClose={() => setBulkAction(null)}
        onConfirm={runBulk}
        loading={working}
        title={`Restore ${selected.length} document${selected.length === 1 ? '' : 's'}?`}
        description="The selected files will return to your vault."
        confirmLabel="Restore files"
        tone="primary"
      />

      <ConfirmDialog
        open={bulkAction === 'delete'}
        onClose={() => setBulkAction(null)}
        onConfirm={runBulk}
        loading={working}
        title={`Delete ${selected.length} document${selected.length === 1 ? '' : 's'} forever?`}
        description="The selected files and their stored copies will be permanently removed. This cannot be undone."
        confirmLabel="Delete forever"
      />

      <ConfirmDialog
        open={confirmEmpty}
        onClose={() => setConfirmEmpty(false)}
        onConfirm={emptyTrash}
        loading={working}
        title="Empty the trash?"
        description={`All ${meta?.total ?? 0} deleted document${meta?.total === 1 ? '' : 's'} will be permanently removed from the server. This cannot be undone.`}
        confirmLabel="Empty trash"
      />
    </div>
  )
}

function TrashStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Trash2
  label: string
  value: string
  tone: 'brand' | 'success' | 'amber' | 'violet'
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 ring-brand-100',
    success: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-[var(--shadow-card)]">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', tones[tone])}>
        <Icon className="h-4 w-4" strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-medium text-muted">{label}</p>
        <p className="mt-0.5 truncate text-[18px] font-bold leading-none tracking-[-0.03em] text-ink">{value}</p>
      </div>
    </div>
  )
}
