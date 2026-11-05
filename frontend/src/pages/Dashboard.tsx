import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  CalendarClock,
  Check,
  ChevronRight,
  Cloud,
  FolderOpen,
  HardDrive,
  KeyRound,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
} from 'lucide-react'
import type { DashboardResponse, Document } from '../types'
import { dashboardApi, documentsApi } from '../lib/endpoints'
import { apiErrorMessage, downloadFile } from '../lib/api'
import { daysUntil, formatBytes, formatDate, timeAgo } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ActivityIcon } from '../components/activity/ActivityIcon'
import { DocumentDetails } from '../components/documents/DocumentDetails'
import { DocumentTable } from '../components/documents/DocumentTable'
import { ShareDialog } from '../components/documents/ShareDialog'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Skeleton } from '../components/ui/Spinner'
import { ProgressBar, StatCard } from '../components/ui/StatCard'
import { EmptyState } from '../components/ui/EmptyState'

const breakdownColors = ['bg-brand-600', 'bg-brand-400', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-slate-400']

export function Dashboard() {
  const { user, setUnreadCount } = useAuth()
  const { success, error } = useToast()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState<string | null>(null)
  const [selected, setSelected] = useState<Document | null>(null)
  const [shareDocument, setShareDocument] = useState<Document | null>(null)

  const load = useCallback(async () => {
    try {
      setFailed(null)
      const response = await dashboardApi.get()
      setData(response.data)
      setUnreadCount(response.data.unread_notifications)
    } catch (caught) {
      setFailed(apiErrorMessage(caught, 'Your dashboard could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [setUnreadCount])

  useEffect(() => {
    void load()
  }, [load])

  const patchDocument = (next: Document) => {
    setData((current) => {
      if (!current) return current
      const replace = (items: Document[]) => items.map((item) => (item.id === next.id ? next : item))
      return {
        ...current,
        recent_documents: replace(current.recent_documents),
        expiring_documents: replace(current.expiring_documents),
      }
    })
    setSelected((current) => (current?.id === next.id ? next : current))
    setShareDocument((current) => (current?.id === next.id ? next : current))
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

  if (loading) return <DashboardSkeleton />

  if (failed || !data) {
    return (
      <Card className="mx-auto mt-10 max-w-lg text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-danger">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-base font-bold text-ink">Dashboard unavailable</h2>
        <p className="mt-1.5 text-[12.5px] leading-6 text-muted">{failed}</p>
        <Button className="mt-5" onClick={() => void load()} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Try again
        </Button>
      </Card>
    )
  }

  const { stats, storage, security } = data
  const firstName = user?.name.split(' ')[0] ?? 'there'
  const greeting =
    new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const topBreakdown = storage.breakdown.slice(0, 5)
  const maxBreakdownBytes = Math.max(...topBreakdown.map((item) => item.bytes), 1)

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description="Here is what is happening across your encrypted vault today."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => navigate('/activity')}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Activity
            </Button>
            <Button onClick={() => navigate('/documents/new')} leftIcon={<Plus className="h-4 w-4" />}>
              New document
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-2 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12px] font-semibold text-ink">
              Your vault is protected with zero-knowledge encryption
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              AES-256-GCM · {data.unread_notifications} unread notification
              {data.unread_notifications === 1 ? '' : 's'} · Security score {security.score}/100
            </p>
          </div>
        </div>
        <Link
          to="/settings/security"
          className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-semibold text-brand-700 transition hover:text-brand-800"
        >
          Review security
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total documents"
          value={stats.total_documents}
          meta={`${formatBytes(storage.used_bytes)} stored`}
          icon={FolderOpen}
          tone="brand"
          onClick={() => navigate('/documents')}
        />
        <StatCard
          label="Certificates"
          value={stats.certificates}
          meta={`${data.recent_documents.filter((item) => item.category === 'certificate').length} recently updated`}
          icon={Award}
          tone="violet"
          onClick={() => navigate('/certificates')}
        />
        <StatCard
          label="Personal files"
          value={stats.personal_files}
          meta={`${stats.favorites} favorites in your vault`}
          icon={UserRound}
          tone="success"
          onClick={() => navigate('/personal-files')}
        />
        <StatCard
          label="Credentials"
          value={stats.credentials}
          meta={`${stats.credentials_strong} strong secret${stats.credentials_strong === 1 ? '' : 's'}`}
          icon={KeyRound}
          tone="amber"
          onClick={() => navigate('/credentials')}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card padded={false} className="overflow-hidden">
          <div className="px-5 pb-3 pt-5">
            <SectionHeader title="Recent documents" actionLabel="View all" actionTo="/documents" />
          </div>
          <DocumentTable
            documents={data.recent_documents}
            onOpen={setSelected}
            onEdit={(document) => navigate(`/documents/${document.id}/edit`)}
            onShare={setShareDocument}
            onToggleFavorite={(document) => void toggleFavorite(document)}
            onDownload={(document) => void download(document)}
            compact
            className="rounded-none border-0 border-t border-line"
            emptyTitle="Your vault is waiting"
            emptyDescription="Upload your first document to start organising your encrypted drive."
            emptyAction={
              <Button onClick={() => navigate('/documents/new')} leftIcon={<Plus className="h-4 w-4" />}>
                Upload document
              </Button>
            }
          />
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Storage allocation"
              description={`${formatBytes(storage.used_bytes)} of ${formatBytes(storage.limit_bytes)} used`}
              action={
                <span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700">
                  {Math.round(storage.percentage)}%
                </span>
              }
            />
            <ProgressBar value={storage.percentage} className="mt-4 h-2" />
            <div className="mt-4 space-y-2.5">
              {topBreakdown.map((item, index) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[11.5px] font-medium text-slate-600">
                      <span className={`h-2 w-2 rounded-full ${breakdownColors[index % breakdownColors.length]}`} />
                      {item.label}
                    </span>
                    <span className="text-[10.5px] font-semibold text-slate-500">
                      {formatBytes(item.bytes)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${breakdownColors[index % breakdownColors.length]}`}
                      style={{ width: `${Math.max(3, (item.bytes / maxBreakdownBytes) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {topBreakdown.length === 0 && (
                <p className="text-[11.5px] text-muted">No documents stored yet.</p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-slate-50/70 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-600">
                  {formatBytes(storage.limit_bytes - storage.used_bytes)} available
                </span>
              </div>
              <Link to="/upgrade" className="text-[11px] font-semibold text-brand-600 hover:text-brand-700">
                Upgrade
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Security posture"
              description={`${security.label} · ${security.score} out of 100`}
              action={
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-[12px] font-bold ${
                    security.score >= 90
                      ? 'bg-emerald-50 text-emerald-700 ring-4 ring-emerald-100/70'
                      : security.score >= 75
                        ? 'bg-brand-50 text-brand-700 ring-4 ring-brand-100/70'
                        : 'bg-amber-50 text-amber-700 ring-4 ring-amber-100/70'
                  }`}
                >
                  {security.score}
                </span>
              }
            />
            <div className="mt-4 space-y-2">
              <SecurityCheck label="Two-factor authentication" active={security.two_factor_enabled} />
              <SecurityCheck label="Biometric / passcode lock" active={security.biometric_enabled} />
              <SecurityCheck label="Login alerts" active={security.login_alerts_enabled} />
              <SecurityCheck label="Auto-lock after inactivity" active={security.auto_lock_enabled} />
            </div>
            {security.recommendations.length > 0 ? (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-700">
                  <ShieldAlert className="h-3 w-3" />
                  Recommended
                </p>
                <p className="mt-1 text-[11px] leading-5 text-amber-800/80">
                  {security.recommendations[0]}
                </p>
                <Link
                  to="/settings/security"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-900"
                >
                  Fix now
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
                <p className="text-[11px] font-medium text-emerald-800">
                  All recommended protections are enabled.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent activity"
            description="Audit trail across your workspace"
            action={
              <Link to="/activity" className="text-[11.5px] font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          />
          {data.recent_activity.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="h-5 w-5" />}
              title="No activity yet"
              description="Your security and document events will appear here."
            />
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {data.recent_activity.map((activity) => (
                <li key={activity.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <ActivityIcon activity={activity} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium leading-5 text-slate-700">{activity.description}</p>
                    <p className="mt-0.5 text-[10.5px] text-muted">
                      {timeAgo(activity.created_at)}
                      {activity.ip_address ? ` · ${activity.ip_address}` : ''}
                    </p>
                  </div>
                  {activity.document && (
                    <Link
                      to={`/documents?q=${encodeURIComponent(activity.document.name)}`}
                      className="mt-0.5 shrink-0 rounded-md p-1 text-slate-300 transition hover:bg-slate-100 hover:text-brand-600"
                      aria-label={`Find ${activity.document.name}`}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Expiring soon"
            description="Documents that need your attention in the next 30 days"
            action={
              <Link to="/documents?expiring=1" className="text-[11.5px] font-semibold text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          />
          {data.expiring_documents.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="h-5 w-5" />}
              title="Nothing expiring soon"
              description="You have no documents expiring in the next 30 days."
            />
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {data.expiring_documents.map((document) => {
                const days = daysUntil(document.expires_at)
                return (
                  <li key={document.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(document)}
                      className="flex w-full items-center gap-3 py-3 text-left transition first:pt-0 hover:opacity-80 last:pb-0"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl text-[8px] font-bold uppercase leading-none ${
                          document.is_expired
                            ? 'bg-red-50 text-danger ring-1 ring-inset ring-red-100'
                            : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100'
                        }`}
                      >
                        <span className="text-[13px] leading-none">
                          {document.expires_at ? new Date(`${document.expires_at}T12:00:00`).getDate() : '—'}
                        </span>
                        <span className="mt-0.5">
                          {document.expires_at
                            ? new Date(`${document.expires_at}T12:00:00`).toLocaleString('en-US', {
                                month: 'short',
                              })
                            : ''}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-ink">{document.name}</p>
                        <p className="mt-0.5 text-[10.5px] text-muted">
                          {document.category_label} · Expires {formatDate(document.expires_at)}
                        </p>
                      </div>
                      <Badge tone={document.is_expired ? 'danger' : 'warning'}>
                        {document.is_expired
                          ? 'Expired'
                          : days !== null
                            ? `${Math.max(0, days)}d left`
                            : 'Soon'}
                      </Badge>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-slate-50/70 px-3 py-2.5">
            <Smartphone className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-[10.5px] text-slate-500">
              Reminders are sent to your notification centre and email.
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink
          icon={Cloud}
          title="Storage settings"
          description="Review usage and manage your plan."
          to="/settings/storage"
        />
        <QuickLink
          icon={LockKeyhole}
          title="Privacy controls"
          description="Manage sharing, analytics and exports."
          to="/settings/privacy"
        />
        <QuickLink
          icon={Sparkles}
          title="Upgrade your plan"
          description="Get more encrypted space for your vault."
          to="/upgrade"
        />
      </div>

      <DocumentDetails
        document={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onUpdated={patchDocument}
        onDeleted={(id) => {
          setData((current) =>
            current
              ? {
                  ...current,
                  recent_documents: current.recent_documents.filter((item) => item.id !== id),
                  expiring_documents: current.expiring_documents.filter((item) => item.id !== id),
                }
              : current,
          )
          void load()
        }}
      />

      <ShareDialog
        document={shareDocument}
        open={Boolean(shareDocument)}
        onClose={() => setShareDocument(null)}
        onUpdated={patchDocument}
      />
    </div>
  )
}

function SecurityCheck({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11.5px] text-slate-600">{label}</span>
      <span
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
          active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {active ? <Check className="h-2.5 w-2.5" /> : null}
        {active ? 'On' : 'Off'}
      </span>
    </div>
  )
}

function QuickLink({
  icon: Icon,
  title,
  description,
  to,
}: {
  icon: typeof Cloud
  title: string
  description: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-bold text-ink">{title}</span>
        <span className="mt-0.5 block text-[10.5px] leading-5 text-muted">{description}</span>
      </span>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-500" />
    </Link>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[132px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-[420px] rounded-2xl" />
        <div className="space-y-5">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
