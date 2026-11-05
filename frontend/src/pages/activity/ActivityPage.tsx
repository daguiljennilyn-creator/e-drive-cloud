import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  CalendarClock,
  History,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ActivitiesResponse, Activity } from '../../types'
import { activityApi } from '../../lib/endpoints'
import { apiErrorMessage } from '../../lib/api'
import { formatDateTime, timeAgo } from '../../lib/format'
import { useDebouncedValue } from '../../lib/useDebounce'
import { ActivityIcon } from '../../components/activity/ActivityIcon'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Spinner'
import { FilterTabs, SearchInput } from '../../components/ui/Toolbar'
import { cn } from '../../lib/cn'

type Group = 'all' | 'documents' | 'sharing' | 'security' | 'credentials' | 'account'

const groups: { value: Group; label: string }[] = [
  { value: 'all', label: 'All events' },
  { value: 'documents', label: 'Documents' },
  { value: 'sharing', label: 'Sharing' },
  { value: 'security', label: 'Security' },
  { value: 'credentials', label: 'Credentials' },
  { value: 'account', label: 'Account' },
]

export function ActivityPage() {
  const [group, setGroup] = useState<Group>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ActivitiesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => setReloadKey((value) => value + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setFailed(null)

    activityApi
      .list({
        group: group === 'all' ? undefined : group,
        q: debouncedSearch.trim() || undefined,
        page,
        per_page: 18,
      })
      .then((response) => {
        if (!active) return
        setData(response.data)
        if (response.data.meta.last_page < page && page > 1) {
          setPage(Math.max(1, response.data.meta.last_page))
        }
      })
      .catch((caught) => {
        if (active) setFailed(apiErrorMessage(caught, 'Your activity history could not be loaded.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [group, debouncedSearch, page, reloadKey])

  const activities = data?.data ?? []
  const meta = data?.meta

  const grouped = useMemo(() => {
    const buckets = new Map<string, Activity[]>()
    for (const activity of activities) {
      const date = activity.created_at ? new Date(activity.created_at) : null
      const key =
        date && !Number.isNaN(date.getTime())
          ? new Intl.DateTimeFormat('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }).format(date)
          : 'Earlier'
      buckets.set(key, [...(buckets.get(key) ?? []), activity])
    }
    return Array.from(buckets.entries())
  }, [activities])

  return (
    <div className="space-y-4">
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Activity' }]}
        title="Activity log"
        description="A tamper-evident audit trail of every action taken in your vault."
        actions={
          <Button variant="secondary" onClick={reload} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile
          icon={History}
          label="Events in this view"
          value={String(meta?.total ?? 0)}
          hint="Filtered audit records"
        />
        <SummaryTile
          icon={SlidersHorizontal}
          label="Showing"
          value={meta && meta.total > 0 ? `${meta.from ?? 0}–${meta.to ?? 0}` : '0'}
          hint="Records on this page"
        />
        <SummaryTile
          icon={ShieldCheck}
          label="Audit retention"
          value="12 months"
          hint="Encrypted and immutable"
        />
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 xl:flex-row xl:items-center xl:justify-between">
          <FilterTabs
            tabs={groups}
            value={group}
            onChange={(value) => {
              setGroup(value)
              setPage(1)
            }}
          />
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Search activity…"
            ariaLabel="Search activity"
            className="w-full xl:max-w-[260px]"
          />
        </div>

        {loading && !data ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-64 max-w-full" />
                  <Skeleton className="h-2.5 w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="h-6 w-6" />}
            title="No activity found"
            description={
              debouncedSearch
                ? 'Try another search term or switch to a different event group.'
                : 'Events will appear here as you upload, share and secure your documents.'
            }
            action={
              debouncedSearch ? (
                <Button variant="secondary" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="px-4 py-4 sm:px-5">
            {grouped.map(([date, items]) => (
              <div key={date} className="relative">
                <div className="sticky top-[68px] z-10 -mx-4 mb-1 bg-white/90 px-4 py-2 backdrop-blur sm:-mx-5 sm:px-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{date}</p>
                </div>
                <ul className="relative ml-[17px] border-l border-line">
                  {items.map((activity) => (
                    <li key={activity.id} className="relative pb-5 pl-5 last:pb-2">
                      <span className="absolute -left-[18px] top-0 flex h-9 w-9 items-center justify-center rounded-full bg-white ring-4 ring-white">
                        <ActivityIcon activity={activity} size="sm" />
                      </span>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-medium leading-5 text-slate-700">
                            {activity.description}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
                            <span title={formatDateTime(activity.created_at)}>
                              {timeAgo(activity.created_at)}
                            </span>
                            {activity.ip_address && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9.5px] text-slate-500">
                                {activity.ip_address}
                              </span>
                            )}
                            {activity.document && (
                              <Link
                                to={`/documents?q=${encodeURIComponent(activity.document.name)}`}
                                className="inline-flex items-center gap-0.5 font-semibold text-brand-600 transition hover:text-brand-700"
                              >
                                {activity.document.name}
                                <ArrowUpRight className="h-2.5 w-2.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                        <span
                          className={cn(
                            'mt-0.5 hidden shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide sm:inline-flex',
                            activity.action.includes('delete') || activity.action === 'trashed'
                              ? 'bg-red-50 text-red-600'
                              : activity.action.includes('verified') ||
                                  activity.action === 'restored' ||
                                  activity.action === 'uploaded'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500',
                          )}
                        >
                          {activity.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {failed && !data ? (
          <EmptyState
            icon={<ShieldAlert className="h-6 w-6" />}
            title="Activity unavailable"
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
            <Pagination meta={meta} onPageChange={setPage} noun="events" />
          </div>
        )}
      </Card>

      {failed && data ? (
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5 text-[11.5px] text-amber-800">
          {failed}
        </p>
      ) : null}
    </div>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof History
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-card)]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
        <Icon className="h-4 w-4" strokeWidth={1.9} />
      </span>
      <div>
        <p className="text-[10.5px] font-medium text-muted">{label}</p>
        <p className="mt-0.5 text-[19px] font-bold leading-none tracking-[-0.03em] text-ink">{value}</p>
        <p className="mt-1.5 text-[10px] text-slate-400">{hint}</p>
      </div>
    </div>
  )
}
