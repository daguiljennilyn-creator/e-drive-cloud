import {
  ArrowUpRight,
  Check,
  ChevronRight,
  HardDrive,
  Info,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { Plan } from '../../types'
import { formatBytes, formatPrice } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/StatCard'
import { cn } from '../../lib/cn'
import { useSettings } from './SettingsLayout'

export function StorageSettings() {
  const { settings } = useSettings()
  const navigate = useNavigate()
  const user = settings.user
  const plans = settings.plans
  const remaining = Math.max(0, user.storage_limit_bytes - user.storage_used_bytes)

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Storage usage"
          description="Your encrypted files count toward the limit of your current plan."
          action={
            <Link
              to="/upgrade"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              <Sparkles className="h-3 w-3" />
              Compare plans
            </Link>
          }
        />

        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-line bg-slate-50/60 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {user.plan?.name ?? 'Starter'} plan
            </p>
            <p className="mt-1.5 text-[30px] font-bold leading-none tracking-[-0.045em] text-ink">
              {formatBytes(user.storage_used_bytes)}
            </p>
            <p className="mt-1.5 text-[11.5px] text-muted">
              of {formatBytes(user.storage_limit_bytes)} used · {formatBytes(remaining)} available
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p
              className={cn(
                'text-[24px] font-bold leading-none tracking-[-0.03em]',
                user.storage_percentage >= 95
                  ? 'text-danger'
                  : user.storage_percentage >= 80
                    ? 'text-amber-600'
                    : 'text-brand-600',
              )}
            >
              {user.storage_percentage}%
            </p>
            <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
              Vault utilisation
            </p>
          </div>
        </div>

        <ProgressBar
          value={user.storage_percentage}
          className="mt-4 h-2"
          barClassName={
            user.storage_percentage >= 95
              ? 'bg-danger'
              : user.storage_percentage >= 80
                ? 'bg-warning'
                : 'bg-brand-600'
          }
        />

        {user.storage_percentage >= 80 && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-[11.5px] leading-5 text-amber-800">
              You&apos;re using {user.storage_percentage}% of your plan. Emptying the trash permanently
              removes those files from your usage total, or you can move to a larger plan.
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/documents"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            <HardDrive className="h-3 w-3" />
            Review stored files
          </Link>
          <Link
            to="/trash"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            <Trash2 className="h-3 w-3" />
            Empty trash
          </Link>
        </div>
      </Card>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[14px] font-bold tracking-[-0.01em] text-ink">Your storage plans</h2>
            <p className="mt-1 text-[11.5px] text-muted">
              Change plans at any time. New limits apply immediately.
            </p>
          </div>
          <p className="text-[10.5px] font-medium text-slate-400">No payment is collected in this demo.</p>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              current={Boolean(user.plan && user.plan.id === plan.id)}
              tooSmall={plan.storage_bytes < user.storage_used_bytes}
              onSelect={() => navigate(`/upgrade?plan=${encodeURIComponent(plan.slug)}`)}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader title="How storage is calculated" />
        <ul className="mt-3 space-y-2.5">
          {[
            'Every file in My Documents counts toward your limit, including drafts.',
            'Files in Trash still count until you permanently delete them or empty the trash.',
            'Plan changes take effect immediately and are recorded in your activity log.',
            'You cannot move to a plan whose limit is smaller than the files you already store.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-[11.5px] leading-5 text-slate-600">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function PlanCard({
  plan,
  current,
  tooSmall,
  onSelect,
}: {
  plan: Plan
  current: boolean
  tooSmall: boolean
  onSelect: () => void
}) {
  const free = plan.price_cents === 0

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border bg-white p-4 shadow-[var(--shadow-card)] transition',
        current ? 'border-brand-300 ring-2 ring-brand-100' : 'border-line hover:border-brand-200',
      )}
    >
      {current && (
        <span className="absolute right-3 top-3">
          <Badge tone="brand">Current</Badge>
        </span>
      )}
      <p className="text-[13px] font-bold text-ink">{plan.name}</p>
      <div className="mt-1 flex items-end gap-1">
        <p className="text-[26px] font-bold leading-none tracking-[-0.04em] text-ink">
          {formatPrice(plan)}
        </p>
        {!free && <span className="pb-1 text-[10.5px] text-muted">/{plan.billing_period}</span>}
      </div>
      <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700">
        <HardDrive className="h-3 w-3" />
        {plan.storage_label}
      </p>

      <ul className="mt-3 flex-1 space-y-1.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-1.5 text-[11px] leading-5 text-slate-600">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        variant={current ? 'secondary' : 'primary'}
        size="sm"
        className="mt-4 w-full"
        disabled={current || tooSmall}
        onClick={onSelect}
        rightIcon={!current && !tooSmall ? <ChevronRight className="h-3.5 w-3.5" /> : undefined}
      >
        {current ? 'Current plan' : tooSmall ? 'Too small for your files' : free ? 'Switch to Starter' : 'Choose plan'}
      </Button>
      {!current && !tooSmall && (
        <Link
          to="/upgrade"
          className="mt-2 inline-flex items-center justify-center gap-0.5 text-[10.5px] font-semibold text-brand-600 transition hover:text-brand-700"
        >
          View full comparison
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}
