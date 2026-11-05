import {
  ArrowUpRight,
  BadgeCheck,
  BellRing,
  CalendarDays,
  ChevronRight,
  HardDrive,
  KeyRound,
  Mail,
  MonitorSmartphone,
  PencilLine,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatBytes, formatDate } from '../../lib/format'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Card, CardHeader } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/StatCard'
import { useSettings } from './SettingsLayout'

const quickActions = [
  {
    to: '/settings/security',
    icon: ShieldCheck,
    title: 'Review security',
    description: 'Two-factor authentication, vault lock and login alerts.',
  },
  {
    to: '/settings/devices',
    icon: MonitorSmartphone,
    title: 'Manage devices',
    description: 'See every device signed in to your vault and revoke access.',
  },
  {
    to: '/settings/notifications',
    icon: BellRing,
    title: 'Alert preferences',
    description: 'Choose which expiry, sharing and security emails you receive.',
  },
]

export function GeneralSettings() {
  const { settings } = useSettings()
  const user = settings.user
  const plan = user.plan

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Account overview"
          description="The details linked to your E-Drive workspace."
          action={
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <PencilLine className="h-3 w-3" />
              Edit profile
            </Link>
          }
        />

        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-line bg-slate-50/60 p-4 sm:flex-row sm:items-center">
          <Avatar name={user.name} initials={user.initials} src={user.avatar_url} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-bold tracking-[-0.01em] text-ink">{user.name}</p>
              <Badge tone={user.two_factor_enabled ? 'success' : 'warning'} dot>
                {user.two_factor_enabled ? '2FA on' : '2FA off'}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted">
              <Mail className="h-3 w-3" />
              {user.email}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted">
              <CalendarDays className="h-3 w-3" />
              Member since {formatDate(user.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/profile"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit details
            </Link>
            <Link
              to="/activity"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              View activity
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <InfoTile
            icon={BadgeCheck}
            label="Account role"
            value={user.role ?? 'Vault owner'}
          />
          <InfoTile
            icon={KeyRound}
            label="Workspace plan"
            value={plan?.name ?? 'Starter'}
          />
          <InfoTile
            icon={MonitorSmartphone}
            label="Active devices"
            value={`${settings.devices_count} ${settings.devices_count === 1 ? 'device' : 'devices'}`}
          />
        </dl>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader
            title="Storage"
            description="Your current allocation and how much of it is in use."
            action={
              <Link
                to="/settings/storage"
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-brand-600 transition hover:text-brand-700"
              >
                Manage plan
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="mt-4 rounded-xl border border-line p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {plan?.name ?? 'Starter'} plan
                </p>
                <p className="mt-1 text-[22px] font-bold leading-none tracking-[-0.03em] text-ink">
                  {formatBytes(user.storage_used_bytes)}
                </p>
              </div>
              <p className="text-[11.5px] font-semibold text-muted">
                of {formatBytes(user.storage_limit_bytes)}
              </p>
            </div>
            <ProgressBar
              value={user.storage_percentage}
              className="mt-4 h-2"
              barClassName={
                user.storage_percentage >= 85
                  ? 'bg-danger'
                  : user.storage_percentage >= 70
                    ? 'bg-warning'
                    : 'bg-brand-600'
              }
            />
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-muted">{user.storage_percentage}% of storage used</p>
              <Link
                to="/settings/storage"
                className="text-[11px] font-semibold text-brand-600 transition hover:text-brand-700"
              >
                Compare plans
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/documents"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              <HardDrive className="h-3 w-3" />
              Browse documents
            </Link>
            <Link
              to="/trash"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              Empty trash to free space
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader title="Security posture" />
          <div className="mt-4 space-y-2.5">
            <PostureRow label="Two-factor authentication" active={user.two_factor_enabled} />
            <PostureRow label="Biometric vault lock" active={user.biometric_enabled} />
            <PostureRow label="Auto-lock" active={user.auto_lock_enabled} />
            <PostureRow label="Login alerts" active={user.login_alerts_enabled} />
          </div>
          <Link
            to="/settings/security"
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-100 bg-brand-50 py-2 text-[11.5px] font-semibold text-brand-700 transition hover:bg-brand-100"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Review security settings
          </Link>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-[13px] font-bold text-ink">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                <action.icon className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <p className="mt-3 flex items-center gap-1 text-[12.5px] font-bold text-ink">
                {action.title}
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-brand-500" />
              </p>
              <p className="mt-1 text-[11px] leading-5 text-muted">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-line p-3.5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-1.5 truncate text-[12.5px] font-bold text-ink">{value}</p>
    </div>
  )
}

function PostureRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50/80 px-3 py-2">
      <span className="text-[11.5px] text-slate-600">{label}</span>
      <span
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
          active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200/70 text-slate-500'
        }`}
      >
        {active ? 'On' : 'Off'}
      </span>
    </div>
  )
}
