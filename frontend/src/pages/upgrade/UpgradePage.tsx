import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  HardDrive,
  Infinity as InfinityIcon,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import type { Plan, PlansResponse } from '../../types'
import { plansApi } from '../../lib/endpoints'
import { apiErrorMessage } from '../../lib/api'
import { formatBytes, formatPrice } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageLoader } from '../../components/ui/Spinner'
import { cn } from '../../lib/cn'

const included = [
  {
    icon: ShieldCheck,
    title: 'Zero-knowledge encryption',
    description: 'Every plan includes AES-256 encryption and a private vault only you can unlock.',
  },
  {
    icon: Zap,
    title: 'Instant plan changes',
    description: 'Limits update immediately, with no waiting for a billing cycle to roll over.',
  },
  {
    icon: Users,
    title: 'Secure sharing',
    description: 'Expiring share links with revocable access are available on every plan.',
  },
  {
    icon: InfinityIcon,
    title: 'No lock-in',
    description: 'Move between plans whenever you need more space, or switch back to Starter.',
  },
]

export function UpgradePage() {
  const { setUser } = useAuth()
  const { success, error } = useToast()
  const [searchParams] = useSearchParams()
  const autoOpened = useRef(false)

  const [data, setData] = useState<PlansResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState<string | null>(null)
  const [selected, setSelected] = useState<Plan | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(null)
    try {
      const response = await plansApi.list()
      setData(response.data)
    } catch (caught) {
      setFailed(apiErrorMessage(caught, 'Your storage plans could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!data || autoOpened.current) return
    const requested = searchParams.get('plan')
    if (!requested) return
    const match = data.plans.find((plan) => plan.slug === requested)
    if (!match || (data.current_plan && match.id === data.current_plan.id)) return
    if (match.storage_bytes < data.storage_used_bytes) return
    autoOpened.current = true
    setSelected(match)
    setConfirmOpen(true)
  }, [data, searchParams])

  const choose = (plan: Plan) => {
    setSelected(plan)
    setConfirmOpen(true)
  }

  const confirmUpgrade = async () => {
    if (!selected) return
    setUpgrading(true)
    try {
      const response = await plansApi.upgrade(selected.id)
      setUser(response.data.user)
      setData((current) =>
        current
          ? {
              ...current,
              current_plan: response.data.plan,
              storage_limit_bytes: response.data.plan?.storage_bytes ?? current.storage_limit_bytes,
            }
          : current,
      )
      success('Plan updated', response.data.message)
      setConfirmOpen(false)
      setSelected(null)
    } catch (caught) {
      error('Could not change plan', apiErrorMessage(caught))
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader
          crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Plans' }]}
          title="Storage & plans"
          description="Choose the encrypted storage that fits your vault."
        />
        <PageLoader label="Loading storage plans…" />
      </div>
    )
  }

  if (!data || failed) {
    return (
      <div className="space-y-5">
        <PageHeader
          crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Plans' }]}
          title="Storage & plans"
        />
        <Card className="mx-auto mt-6 max-w-lg text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-danger">
            <HardDrive className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-base font-bold text-ink">Plans unavailable</h2>
          <p className="mt-1.5 text-[12.5px] leading-6 text-muted">
            {failed ?? 'Please try again in a moment.'}
          </p>
          <Button className="mt-5" onClick={() => void load()}>
            Try again
          </Button>
        </Card>
      </div>
    )
  }

  const currentPlan = data.current_plan
  const used = data.storage_used_bytes
  const limit = Math.max(1, data.storage_limit_bytes)
  const percentage = Math.round(Math.min(100, (used / limit) * 100) * 10) / 10

  return (
    <div className="space-y-5">
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Storage' }, { label: 'Plans' }]}
        title="Storage & plans"
        description="Choose the encrypted storage that fits your vault. Change or cancel at any time."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <Sparkles className="h-3 w-3 text-brand-500" />
            Demo billing · no payment collected
          </span>
        }
      />

      <Card padded={false} className="overflow-hidden">
        <div className="relative overflow-hidden bg-navy px-5 py-5 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-200">
                Current plan
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <p className="text-[26px] font-bold leading-none tracking-[-0.04em]">
                  {currentPlan?.name ?? 'Starter'}
                </p>
                {currentPlan && currentPlan.slug !== 'free' && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-brand-100">
                    {formatPrice(currentPlan)}/{currentPlan.billing_period}
                  </span>
                )}
              </div>
              <p className="mt-2 text-[12px] text-brand-100/70">
                {formatBytes(used)} used of {formatBytes(data.storage_limit_bytes)}
              </p>
            </div>
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-between text-[10.5px] font-semibold text-brand-100/70">
                <span>{percentage}% used</span>
                <span>{formatBytes(Math.max(0, data.storage_limit_bytes - used))} free</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    percentage >= 90 ? 'bg-red-400' : percentage >= 75 ? 'bg-amber-300' : 'bg-brand-300',
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {data.plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            current={Boolean(currentPlan && currentPlan.id === plan.id)}
            tooSmall={plan.storage_bytes < used}
            onChoose={() => choose(plan)}
          />
        ))}
      </div>

      <Card>
        <CardHeader
          title="Included with every plan"
          description="Security is never an add-on at E-Drive."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {included.map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-xl border border-line p-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                <item.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[12px] font-bold text-ink">{item.title}</p>
                <p className="mt-0.5 text-[11px] leading-5 text-muted">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Faq
          question="Can I switch back to Starter?"
          answer="Yes. You can move to any plan whose storage limit fits the files already in your vault."
        />
        <Faq
          question="When does a change take effect?"
          answer="Immediately. Your new limit and plan badge update across the whole workspace."
        />
        <Faq
          question="Is my data moved?"
          answer="No. Your files remain in the same encrypted vault, region and storage directory."
        />
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (upgrading) return
          setConfirmOpen(false)
          setSelected(null)
        }}
        title={selected ? `Switch to ${selected.name}?` : 'Change plan'}
        description="Review the change before it is applied to your vault."
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmOpen(false)
                setSelected(null)
              }}
              disabled={upgrading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void confirmUpgrade()}
              loading={upgrading}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              {selected
                ? selected.storage_bytes > data.storage_limit_bytes
                  ? `Upgrade to ${selected.name}`
                  : `Switch to ${selected.name}`
                : 'Confirm change'}
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-600">
                    {selected.name} plan
                  </p>
                  <p className="mt-1 text-[24px] font-bold leading-none tracking-[-0.04em] text-ink">
                    {formatPrice(selected)}
                    {selected.price_cents > 0 && (
                      <span className="ml-1 text-[11px] font-medium text-muted">
                        /{selected.billing_period}
                      </span>
                    )}
                  </p>
                </div>
                <Badge tone="brand">{selected.storage_label}</Badge>
              </div>
              <ul className="mt-3 space-y-1.5">
                {selected.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-1.5 text-[11px] leading-5 text-slate-600"
                  >
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <dl className="rounded-xl border border-line px-3.5 py-3">
              <div className="flex items-center justify-between gap-3 py-1">
                <dt className="text-[11px] text-muted">Current plan</dt>
                <dd className="text-[11.5px] font-semibold text-ink">
                  {currentPlan?.name ?? 'Starter'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-1">
                <dt className="text-[11px] text-muted">New storage limit</dt>
                <dd className="text-[11.5px] font-semibold text-ink">{selected.storage_label}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-1">
                <dt className="text-[11px] text-muted">Files already stored</dt>
                <dd className="text-[11.5px] font-semibold text-ink">{formatBytes(used)}</dd>
              </div>
            </dl>

            <p className="text-[11px] leading-5 text-slate-500">
              This is a demo workspace, so no card is charged. Your plan and storage limit change as soon
              as you confirm, and the event is added to your activity log.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

function PlanCard({
  plan,
  current,
  tooSmall,
  onChoose,
}: {
  plan: Plan
  current: boolean
  tooSmall: boolean
  onChoose: () => void
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border bg-white p-5 shadow-[var(--shadow-card)] transition',
        current
          ? 'border-brand-300 ring-2 ring-brand-100'
          : plan.slug === 'pro'
            ? 'border-brand-200'
            : 'border-line',
      )}
    >
      {plan.slug === 'pro' && !current && (
        <span className="absolute right-4 top-4">
          <Badge tone="brand">Most popular</Badge>
        </span>
      )}
      {current && (
        <span className="absolute right-4 top-4">
          <Badge tone="success" dot>
            Current
          </Badge>
        </span>
      )}

      <p className="text-[14px] font-bold text-ink">{plan.name}</p>
      <p className="mt-1 text-[11px] text-muted">
        {plan.slug === 'free'
          ? 'Everyday personal storage'
          : plan.slug === 'pro'
            ? 'For power users and freelancers'
            : 'For teams and growing businesses'}
      </p>

      <div className="mt-4 flex items-end gap-1">
        <p className="text-[36px] font-bold leading-none tracking-[-0.05em] text-ink">
          {formatPrice(plan)}
        </p>
        {plan.price_cents > 0 && (
          <span className="pb-1 text-[11px] text-muted">/{plan.billing_period}</span>
        )}
      </div>
      <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-700">
        <HardDrive className="h-3.5 w-3.5" />
        {plan.storage_label} encrypted storage
      </p>

      <ul className="mt-4 flex-1 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-[11.5px] leading-5 text-slate-600">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        className="mt-5 w-full"
        variant={current ? 'secondary' : 'primary'}
        disabled={current || tooSmall}
        onClick={onChoose}
        rightIcon={!current && !tooSmall ? <ArrowRight className="h-4 w-4" /> : undefined}
      >
        {current ? 'Current plan' : tooSmall ? 'Exceeds your current storage' : `Choose ${plan.name}`}
      </Button>
      {!current && tooSmall && (
        <p className="mt-2 text-center text-[10px] font-medium text-danger">
          This plan is smaller than your stored files.
        </p>
      )}
    </div>
  )
}

function Faq({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-card)]">
      <p className="text-[11.5px] font-bold text-ink">{question}</p>
      <p className="mt-1.5 text-[10.5px] leading-5 text-muted">{answer}</p>
    </div>
  )
}
