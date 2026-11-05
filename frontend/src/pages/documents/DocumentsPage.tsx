import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Award,
  CalendarClock,
  FolderOpen,
  HardDrive,
  Link2,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Star,
  UserRound,
} from 'lucide-react'
import type { Document, DocumentsResponse, DocumentStats } from '../../types'
import { documentsApi } from '../../lib/endpoints'
import { apiErrorMessage, downloadFile } from '../../lib/api'
import { formatBytes } from '../../lib/format'
import { useDebouncedValue } from '../../lib/useDebounce'
import { DOCUMENT_SUBCATEGORIES } from '../../lib/constants'
import { useToast } from '../../context/ToastContext'
import { DocumentDetails } from '../../components/documents/DocumentDetails'
import { DocumentTable } from '../../components/documents/DocumentTable'
import { ShareDialog } from '../../components/documents/ShareDialog'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Spinner'
import { FilterTabs, SearchInput } from '../../components/ui/Toolbar'
import { cn } from '../../lib/cn'

type ExplorerMode = 'all' | 'certificates' | 'personal'
type Filter = 'all' | 'favorites' | 'shared' | 'expiring' | 'verified'

const sortOptions = [
  { value: 'last_modified_at', label: 'Last modified' },
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'File size' },
  { value: 'expires_at', label: 'Expiry date' },
  { value: 'created_at', label: 'Date added' },
]

const copy: Record<
  ExplorerMode,
  { title: string; description: string; newLabel: string; emptyTitle: string; emptyDescription: string }
> = {
  all: {
    title: 'My Documents',
    description: 'Every file in your encrypted vault, organised, searchable and protected.',
    newLabel: 'New document',
    emptyTitle: 'No documents yet',
    emptyDescription: 'Upload your first file to start building your encrypted document vault.',
  },
  certificates: {
    title: 'Certificates',
    description: 'Professional certifications and awards sealed with cryptographic verification.',
    newLabel: 'New certificate',
    emptyTitle: 'No certificates yet',
    emptyDescription: 'Add a certificate to keep verified proof of your qualifications in one place.',
  },
  personal: {
    title: 'Personal Files',
    description: 'Identity, home, finance and family records kept in your private vault.',
    newLabel: 'New personal file',
    emptyTitle: 'No personal files yet',
    emptyDescription: 'Upload identity documents, insurance policies or other personal records.',
  },
}

export function DocumentsPage({ mode = 'all' }: { mode?: ExplorerMode }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { success, error } = useToast()

  const initialExpiring = searchParams.get('expiring') === '1'
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [filter, setFilter] = useState<Filter>(initialExpiring ? 'expiring' : 'all')
  const [subcategory, setSubcategory] = useState('all')
  const [sort, setSort] = useState('last_modified_at')
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<DocumentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const [details, setDetails] = useState<Document | null>(null)
  const [sharing, setSharing] = useState<Document | null>(null)
  const [trashTarget, setTrashTarget] = useState<Document | null>(null)
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [working, setWorking] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const queryParam = searchParams.get('q') ?? ''
  useEffect(() => {
    setSearch(queryParam)
    setPage(1)
  }, [queryParam])

  const reload = useCallback(() => setReloadKey((value) => value + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setFailed(null)

    documentsApi
      .list({
        q: debouncedSearch.trim() || undefined,
        category:
          mode === 'certificates' ? 'certificate' : mode === 'personal' ? 'personal' : 'all',
        subcategory: mode === 'personal' && subcategory !== 'all' ? subcategory : undefined,
        status: mode === 'certificates' && filter === 'verified' ? 'verified' : undefined,
        favorites: filter === 'favorites' || undefined,
        shared: filter === 'shared' || undefined,
        expiring: filter === 'expiring' || undefined,
        sort,
        direction,
        per_page: 10,
        page,
      })
      .then((response) => {
        if (!active) return
        setData(response.data)
      })
      .catch((caught) => {
        if (!active) return
        setFailed(apiErrorMessage(caught, 'Your documents could not be loaded.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [debouncedSearch, filter, subcategory, sort, direction, page, mode, reloadKey])

  const patchDocument = (next: Document) => {
    setData((current) =>
      current
        ? { ...current, data: current.data.map((item) => (item.id === next.id ? next : item)) }
        : current,
    )
    setDetails((current) => (current?.id === next.id ? next : current))
    setSharing((current) => (current?.id === next.id ? next : current))
  }

  const changeFilter = (next: Filter) => {
    setFilter(next)
    setPage(1)
    if (searchParams.has('expiring')) {
      const params = new URLSearchParams(searchParams)
      params.delete('expiring')
      setSearchParams(params, { replace: true })
    }
  }

  const toggleFavorite = async (document: Document) => {
    try {
      const response = await documentsApi.favorite(document.id)
      patchDocument(response.data.document)
      success(
        response.data.document.is_favorite ? 'Added to favorites' : 'Removed from favorites',
        document.name,
      )
    } catch (caught) {
      error('Could not update favorite', apiErrorMessage(caught))
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

  const moveToTrash = async () => {
    if (!trashTarget) return
    setWorking(true)
    try {
      await documentsApi.remove(trashTarget.id)
      success('Moved to trash', `${trashTarget.name} can be restored from Trash.`)
      setTrashTarget(null)
      setSelected((current) => current.filter((id) => id !== trashTarget.id))
      reload()
    } catch (caught) {
      error('Could not move to trash', apiErrorMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  const bulkTrash = async () => {
    setWorking(true)
    try {
      const response = await documentsApi.bulk('trash', selected)
      success('Moved to trash', response.data.message)
      setSelected([])
      setConfirmBulk(false)
      reload()
    } catch (caught) {
      error('Bulk action failed', apiErrorMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  const verifyAll = async () => {
    setVerifying(true)
    try {
      const response = await documentsApi.verifyAll()
      success('Certificates verified', response.data.message)
      reload()
    } catch (caught) {
      error('Could not verify certificates', apiErrorMessage(caught))
    } finally {
      setVerifying(false)
    }
  }

  const meta = data?.meta
  const stats = data?.stats
  const documents = data?.data ?? []

  const filterTabs = useMemo(() => {
    if (mode === 'certificates') {
      return [
        { value: 'all' as Filter, label: 'All', count: stats?.category_counts.certificate },
        { value: 'verified' as Filter, label: 'Verified', count: stats?.status_counts.verified },
        { value: 'shared' as Filter, label: 'Shared', count: stats?.shared_count },
        { value: 'expiring' as Filter, label: 'Expiring', count: stats?.expiring_count },
      ]
    }
    return [
      { value: 'all' as Filter, label: 'All files' },
      { value: 'favorites' as Filter, label: 'Favorites' },
      { value: 'shared' as Filter, label: 'Shared', count: stats?.shared_count },
      { value: 'expiring' as Filter, label: 'Expiring', count: stats?.expiring_count },
    ]
  }, [mode, stats])

  const title = copy[mode]
  const selectedCount = selected.length

  const subTabs = useMemo(
    () => [
      { value: 'all', label: 'All personal', count: stats?.category_counts.personal },
      ...DOCUMENT_SUBCATEGORIES.map((item) => ({
        value: item.value,
        label: item.label,
        count: stats?.subcategory_counts[item.value] ?? 0,
      })),
    ],
    [stats],
  )

  return (
    <div className="space-y-4">
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: title.title }]}
        title={title.title}
        description={title.description}
        actions={
          <>
            {mode === 'certificates' && (
              <Button
                variant="secondary"
                loading={verifying}
                onClick={verifyAll}
                leftIcon={<ShieldCheck className="h-4 w-4" />}
              >
                Verify all
              </Button>
            )}
            <Button
              onClick={() =>
                navigate(
                  mode === 'certificates'
                    ? '/documents/new?category=certificate'
                    : mode === 'personal'
                      ? '/documents/new?category=personal'
                      : '/documents/new',
                )
              }
              leftIcon={<Plus className="h-4 w-4" />}
            >
              {title.newLabel}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ExplorerStat
          icon={mode === 'certificates' ? Award : mode === 'personal' ? UserRound : FolderOpen}
          label={
            mode === 'certificates'
              ? 'Certificates'
              : mode === 'personal'
                ? 'Personal files'
                : 'Total documents'
          }
          value={String(
            mode === 'certificates'
              ? (stats?.category_counts.certificate ?? 0)
              : mode === 'personal'
                ? (stats?.category_counts.personal ?? 0)
                : (stats?.total ?? 0),
          )}
          tone="brand"
        />
        <ExplorerStat
          icon={mode === 'certificates' ? ShieldCheck : mode === 'personal' ? Star : Link2}
          label={
            mode === 'certificates'
              ? 'Verified seals'
              : mode === 'personal'
                ? 'Favorites'
                : 'Shared links'
          }
          value={String(
            mode === 'certificates'
              ? (stats?.status_counts.verified ?? 0)
              : mode === 'personal'
                ? (stats?.favorite_count ?? 0)
                : (stats?.shared_count ?? 0),
          )}
          tone="success"
        />
        <ExplorerStat
          icon={CalendarClock}
          label="Expiring soon"
          value={String(stats?.expiring_count ?? 0)}
          tone="amber"
        />
        <ExplorerStat
          icon={HardDrive}
          label="Vault storage"
          value={formatBytes(stats?.total_size)}
          tone="violet"
        />
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
              placeholder="Search by name, issuer or number…"
              ariaLabel="Search documents"
              className="w-full sm:max-w-[290px]"
            />
            <FilterTabs tabs={filterTabs} value={filter} onChange={changeFilter} />
          </div>
          <div className="flex items-center gap-2">
            <Select
              options={sortOptions}
              value={sort}
              onChange={(event) => {
                setSort(event.target.value)
                setPage(1)
              }}
              aria-label="Sort documents"
              className="h-9 w-[148px] text-[12px]"
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

        {mode === 'personal' && (
          <div className="border-b border-line bg-slate-50/60 px-4 py-2.5">
            <FilterTabs
              tabs={subTabs}
              value={subcategory}
              onChange={(value) => {
                setSubcategory(value)
                setPage(1)
              }}
            />
          </div>
        )}

        <DocumentTable
          documents={documents}
          loading={loading}
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
                onClick={() => setConfirmBulk(true)}
                leftIcon={<Star className="h-3.5 w-3.5" />}
              >
                Move {selectedCount} to trash
              </Button>
            </>
          }
          onOpen={setDetails}
          onEdit={(document) => navigate(`/documents/${document.id}/edit`)}
          onShare={setSharing}
          onToggleFavorite={(document) => void toggleFavorite(document)}
          onTrash={setTrashTarget}
          onDownload={(document) => void download(document)}
          className="rounded-none border-0"
          emptyTitle={debouncedSearch ? 'No matching documents' : title.emptyTitle}
          emptyDescription={
            debouncedSearch
              ? 'Try a different search term or clear the filters to see more files.'
              : title.emptyDescription
          }
          emptyAction={
            <Button onClick={() => navigate('/documents/new')} leftIcon={<Plus className="h-4 w-4" />}>
              Upload document
            </Button>
          }
        />

        {failed && !data ? (
          <EmptyState
            icon={<ShieldAlert className="h-6 w-6" />}
            title="Documents unavailable"
            description={failed}
            action={
              <Button onClick={reload} leftIcon={<RefreshCw className="h-4 w-4" />}>
                Try again
              </Button>
            }
          />
        ) : null}

        {meta && meta.total > 0 && (
          <div className="border-t border-line px-4 py-3.5">
            <Pagination meta={meta} onPageChange={setPage} noun="documents" />
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
        onUpdated={patchDocument}
        onDeleted={(id) => {
          setSelected((current) => current.filter((item) => item !== id))
          reload()
        }}
      />

      <ShareDialog
        document={sharing}
        open={Boolean(sharing)}
        onClose={() => setSharing(null)}
        onUpdated={patchDocument}
      />

      <ConfirmDialog
        open={Boolean(trashTarget)}
        onClose={() => setTrashTarget(null)}
        onConfirm={moveToTrash}
        loading={working}
        title="Move to trash?"
        description={
          trashTarget
            ? `${trashTarget.name} will leave your vault and can be restored later from Trash.`
            : ''
        }
        confirmLabel="Move to trash"
      />

      <ConfirmDialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        onConfirm={bulkTrash}
        loading={working}
        title={`Move ${selectedCount} document${selectedCount === 1 ? '' : 's'} to trash?`}
        description="The selected files will leave your vault. You can restore them at any time from Trash."
        confirmLabel="Move to trash"
      />
    </div>
  )
}

function ExplorerStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof FolderOpen
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
        <p className="mt-0.5 truncate text-[20px] font-bold leading-none tracking-[-0.03em] text-ink">{value}</p>
      </div>
    </div>
  )
}

export function DocumentsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-56" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[70px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[520px] rounded-2xl" />
    </div>
  )
}

export type { DocumentStats }
