import { useCallback, useEffect, useState } from 'react'
import {
  Award,
  Bell,
  CalendarClock,
  Check,
  CheckCheck,
  ChevronRight,
  FilePlus2,
  HardDrive,
  KeyRound,
  Link2,
  Mail,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AppNotification, NotificationsResponse } from '../../types'
import { notificationsApi } from '../../lib/endpoints'
import { apiErrorMessage } from '../../lib/api'
import { formatDateTime, timeAgo } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { ActionMenu } from '../../components/ui/Menu'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Spinner'
import { FilterTabs } from '../../components/ui/Toolbar'
import { cn } from '../../lib/cn'

type ReadFilter = 'all' | 'unread'
type Category = 'all' | 'documents' | 'security' | 'sharing' | 'storage' | 'system'

const typeIcons: Record<string, { icon: LucideIcon; tone: string }> = {
  expiry: { icon: CalendarClock, tone: 'bg-amber-50 text-amber-600 ring-amber-100' },
  certificate: { icon: Award, tone: 'bg-brand-50 text-brand-600 ring-brand-100' },
  document_uploaded: { icon: FilePlus2, tone: 'bg-brand-50 text-brand-600 ring-brand-100' },
  security: { icon: ShieldAlert, tone: 'bg-red-50 text-danger ring-red-100' },
  credential: { icon: KeyRound, tone: 'bg-amber-50 text-amber-600 ring-amber-100' },
  credential_rotated: { icon: RefreshCw, tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  share: { icon: Link2, tone: 'bg-brand-50 text-brand-600 ring-brand-100' },
  storage: { icon: HardDrive, tone: 'bg-violet-50 text-violet-600 ring-violet-100' },
  plan_changed: { icon: WalletCards, tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  digest: { icon: Mail, tone: 'bg-slate-100 text-slate-500 ring-slate-200' },
  welcome: { icon: Sparkles, tone: 'bg-brand-50 text-brand-600 ring-brand-100' },
  system: { icon: Bell, tone: 'bg-slate-100 text-slate-500 ring-slate-200' },
}

const categories: { value: Category; label: string }[] = [
  { value: 'all', label: 'All categories' },
  { value: 'documents', label: 'Documents' },
  { value: 'security', label: 'Security' },
  { value: 'sharing', label: 'Sharing' },
  { value: 'storage', label: 'Storage' },
  { value: 'system', label: 'System' },
]

export function NotificationsPage() {
  const { setUnreadCount } = useAuth()
  const { success, error } = useToast()
  const navigate = useNavigate()
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')
  const [category, setCategory] = useState<Category>('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<NotificationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  const reload = useCallback(() => setReloadKey((value) => value + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setFailed(null)

    notificationsApi
      .list({
        filter: readFilter === 'unread' ? 'unread' : undefined,
        category: category === 'all' ? undefined : category,
        page,
        per_page: 12,
      })
      .then((response) => {
        if (!active) return
        setData(response.data)
        setUnreadCount(response.data.meta.unread_count)
        if (response.data.meta.last_page < page && page > 1) {
          setPage(Math.max(1, response.data.meta.last_page))
        }
      })
      .catch((caught) => {
        if (active) setFailed(apiErrorMessage(caught, 'Notifications could not be loaded.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [readFilter, category, page, reloadKey, setUnreadCount])

  const notifications = data?.data ?? []
  const meta = data?.meta
  const unreadCount = meta?.unread_count ?? 0

  const markRead = async (notification: AppNotification) => {
    if (notification.is_read) return
    setWorkingId(notification.id)
    try {
      const response = await notificationsApi.markRead(notification.id)
      setData((current) =>
        current
          ? {
              ...current,
              data: current.data.map((item) => (item.id === notification.id ? response.data.notification : item)),
              meta: { ...current.meta, unread_count: response.data.unread_count },
            }
          : current,
      )
      setUnreadCount(response.data.unread_count)
    } catch (caught) {
      error('Could not mark as read', apiErrorMessage(caught))
    } finally {
      setWorkingId(null)
    }
  }

  const openNotification = async (notification: AppNotification) => {
    await markRead(notification)
    if (!notification.action_url) return
    if (/^https?:\/\//.test(notification.action_url)) {
      window.open(notification.action_url, '_blank', 'noopener,noreferrer')
    } else {
      navigate(notification.action_url)
    }
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    try {
      const response = await notificationsApi.markAllRead()
      success('All caught up', response.data.message)
      setUnreadCount(0)
      reload()
    } catch (caught) {
      error('Could not mark all as read', apiErrorMessage(caught))
    } finally {
      setMarkingAll(false)
    }
  }

  const remove = async (notification: AppNotification) => {
    setWorkingId(notification.id)
    try {
      const response = await notificationsApi.remove(notification.id)
      success('Notification deleted', notification.title)
      setUnreadCount(response.data.unread_count)
      setData((current) =>
        current
          ? {
              ...current,
              data: current.data.filter((item) => item.id !== notification.id),
              meta: {
                ...current.meta,
                total: Math.max(0, current.meta.total - 1),
                unread_count: response.data.unread_count,
              },
            }
          : current,
      )
      reload()
    } catch (caught) {
      error('Could not delete notification', apiErrorMessage(caught))
    } finally {
      setWorkingId(null)
    }
  }

  const clearRead = async () => {
    setClearing(true)
    try {
      const response = await notificationsApi.clearRead()
      success('Read notifications cleared', response.data.message)
      setConfirmClear(false)
      setPage(1)
      reload()
    } catch (caught) {
      error('Could not clear notifications', apiErrorMessage(caught))
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Notifications' }]}
        title="Notification centre"
        description={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'} across your vault.`
            : 'You are all caught up. Security and document events will appear here.'
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmClear(true)}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Clear read
            </Button>
            <Button
              onClick={markAllRead}
              loading={markingAll}
              disabled={unreadCount === 0}
              leftIcon={<CheckCheck className="h-4 w-4" />}
            >
              Mark all read
            </Button>
          </>
        }
      />

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 xl:flex-row xl:items-center xl:justify-between">
          <div className="inline-flex w-fit rounded-xl border border-line bg-slate-50 p-0.5">
            {(['all', 'unread'] as ReadFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setReadFilter(value)
                  setPage(1)
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[11.5px] font-semibold capitalize transition',
                  readFilter === value
                    ? 'bg-white text-ink shadow-sm ring-1 ring-line'
                    : 'text-slate-500 hover:text-ink',
                )}
              >
                {value === 'all' ? 'All notifications' : 'Unread'}
                {value === 'unread' && unreadCount > 0 && (
                  <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <FilterTabs
            tabs={categories}
            value={category}
            onChange={(value) => {
              setCategory(value)
              setPage(1)
            }}
          />
        </div>

        {loading && !data ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3 rounded-xl border border-line p-3.5">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-44" />
                  <Skeleton className="h-2.5 w-full max-w-md" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title={readFilter === 'unread' ? 'Nothing unread' : 'No notifications here'}
            description={
              readFilter === 'unread'
                ? 'You have read every notification in this category.'
                : 'When documents expire, links are viewed or security events occur, you will see them here.'
            }
            action={
              readFilter === 'unread' ? (
                <Button variant="secondary" onClick={() => setReadFilter('all')}>
                  View all notifications
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {notifications.map((notification) => {
              const visual = typeIcons[notification.type] ?? typeIcons.system
              const Icon = visual.icon
              return (
                <li
                  key={notification.id}
                  className={cn(
                    'group relative transition hover:bg-slate-50/70',
                    !notification.is_read && 'bg-brand-50/25',
                  )}
                >
                  <div className="flex items-start gap-3 px-4 py-4">
                    <span
                      className={cn(
                        'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
                        visual.tone,
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.9} />
                    </span>

                    <button
                      type="button"
                      onClick={() => void openNotification(notification)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[12.5px] font-semibold text-ink">{notification.title}</span>
                        {!notification.is_read && <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />}
                      </span>
                      <span className="mt-1 block text-[11.5px] leading-5 text-slate-600">
                        {notification.message}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
                        <span title={formatDateTime(notification.created_at)}>
                          {timeAgo(notification.created_at)}
                        </span>
                        {notification.action_url && (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-brand-600">
                            View
                            <ChevronRight className="h-3 w-3" />
                          </span>
                        )}
                      </span>
                    </button>

                    <div className="flex shrink-0 items-center gap-0.5">
                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={() => void markRead(notification)}
                          disabled={workingId === notification.id}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                          aria-label={`Mark ${notification.title} as read`}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <ActionMenu
                        items={[
                          ...(!notification.is_read
                            ? [
                                {
                                  label: 'Mark as read',
                                  icon: Check,
                                  onSelect: () => void markRead(notification),
                                },
                              ]
                            : []),
                          ...(notification.action_url
                            ? [
                                {
                                  label: 'Open destination',
                                  icon: ChevronRight,
                                  onSelect: () => void openNotification(notification),
                                },
                              ]
                            : []),
                          {
                            label: 'Delete notification',
                            icon: Trash2,
                            tone: 'danger',
                            onSelect: () => void remove(notification),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {failed && !data ? (
          <EmptyState
            icon={<ShieldAlert className="h-6 w-6" />}
            title="Notifications unavailable"
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
            <Pagination meta={meta} onPageChange={setPage} noun="notifications" />
          </div>
        )}
      </Card>

      {failed && data ? (
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5 text-[11.5px] text-amber-800">
          {failed}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearRead}
        loading={clearing}
        title="Clear read notifications?"
        description="Every notification you have already opened will be permanently removed. Unread notifications stay in your centre."
        confirmLabel="Clear read"
      />
    </div>
  )
}
