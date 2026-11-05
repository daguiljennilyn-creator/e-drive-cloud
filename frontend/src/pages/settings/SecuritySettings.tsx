import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  MonitorSmartphone,
  RotateCcw,
  Save,
  ShieldCheck,
  TimerReset,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { settingsApi } from '../../lib/endpoints'
import { apiErrorMessage } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { Select } from '../../components/ui/Input'
import { Toggle } from '../../components/ui/Toggle'
import { cn } from '../../lib/cn'
import { useSettings } from './SettingsLayout'

const autoLockOptions = [
  { value: '1', label: 'After 1 minute' },
  { value: '5', label: 'After 5 minutes' },
  { value: '10', label: 'After 10 minutes' },
  { value: '15', label: 'After 15 minutes' },
  { value: '30', label: 'After 30 minutes' },
  { value: '60', label: 'After 60 minutes' },
]

export function SecuritySettings() {
  const { settings, updateUser } = useSettings()
  const { success, error } = useToast()
  const user = settings.user

  const [twoFactor, setTwoFactor] = useState(user.two_factor_enabled)
  const [biometric, setBiometric] = useState(user.biometric_enabled)
  const [autoLock, setAutoLock] = useState(user.auto_lock_enabled)
  const [autoLockMinutes, setAutoLockMinutes] = useState(String(user.auto_lock_minutes))
  const [loginAlerts, setLoginAlerts] = useState(user.login_alerts_enabled)
  const [saving, setSaving] = useState(false)

  const dirty =
    twoFactor !== user.two_factor_enabled ||
    biometric !== user.biometric_enabled ||
    autoLock !== user.auto_lock_enabled ||
    autoLockMinutes !== String(user.auto_lock_minutes) ||
    loginAlerts !== user.login_alerts_enabled

  const score = useMemo(() => {
    let value = 0
    if (twoFactor) value += 35
    if (biometric) value += 20
    if (autoLock) value += 25
    if (loginAlerts) value += 20
    return value
  }, [twoFactor, biometric, autoLock, loginAlerts])

  const posture =
    score >= 85
      ? { label: 'Excellent', tone: 'text-emerald-700', bar: 'bg-emerald-500', badge: 'success' as const }
      : score >= 60
        ? { label: 'Good', tone: 'text-brand-700', bar: 'bg-brand-500', badge: 'brand' as const }
        : score >= 35
          ? { label: 'Needs attention', tone: 'text-amber-700', bar: 'bg-warning', badge: 'warning' as const }
          : { label: 'At risk', tone: 'text-red-700', bar: 'bg-danger', badge: 'danger' as const }

  const reset = () => {
    setTwoFactor(user.two_factor_enabled)
    setBiometric(user.biometric_enabled)
    setAutoLock(user.auto_lock_enabled)
    setAutoLockMinutes(String(user.auto_lock_minutes))
    setLoginAlerts(user.login_alerts_enabled)
  }

  const save = async () => {
    setSaving(true)
    try {
      const response = await settingsApi.updateSecurity({
        two_factor_enabled: twoFactor,
        biometric_enabled: biometric,
        auto_lock_enabled: autoLock,
        auto_lock_minutes: Number(autoLockMinutes),
        login_alerts_enabled: loginAlerts,
      })
      updateUser(response.data.user)
      success('Security settings saved', response.data.message)
    } catch (caught) {
      error('Could not save security settings', apiErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card padded={false} className="overflow-hidden">
        <div className="relative overflow-hidden bg-navy px-5 py-5 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Vault protection score
              </p>
              <div className="mt-2 flex items-end gap-2">
                <p className="text-[38px] font-bold leading-none tracking-[-0.05em]">{score}</p>
                <span className="pb-1 text-[12px] font-semibold text-brand-200/70">/ 100</span>
              </div>
              <p className="mt-2 text-[11.5px] text-brand-100/70">
                {twoFactor
                  ? 'Strong authentication is enabled. Keep the remaining controls on for full protection.'
                  : 'Two-factor authentication is off. Enabling it is the single biggest improvement you can make.'}
              </p>
            </div>
            <Badge tone={posture.badge} className="self-start">
              {posture.label}
            </Badge>
          </div>
          <div className="relative mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className={cn('h-full rounded-full transition-all duration-500', posture.bar)}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {!twoFactor && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="text-[12px] font-bold text-amber-800">Your vault is missing a second factor</p>
            <p className="mt-0.5 text-[11.5px] leading-5 text-amber-800/75">
              Without two-factor authentication, a stolen password is enough to open your vault. Turn it
              on below and confirm with your authenticator app.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader
          title="Authentication"
          description="Control how your identity is verified before the vault unlocks."
        />
        <div className="mt-4 divide-y divide-line">
          <SettingToggle
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Two-factor authentication"
            description="Require a one-time code from your authenticator app at every new sign-in."
            checked={twoFactor}
            onChange={setTwoFactor}
            disabled={saving}
          />
          <SettingToggle
            icon={<Fingerprint className="h-4 w-4" />}
            title="Biometric vault lock"
            description="Use Face ID, Touch ID or Windows Hello to unlock this device."
            checked={biometric}
            onChange={setBiometric}
            disabled={saving}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Session protection"
          description="Limit how long an unattended session stays unlocked."
        />
        <div className="mt-4 divide-y divide-line">
          <SettingToggle
            icon={<TimerReset className="h-4 w-4" />}
            title="Automatic vault lock"
            description="Lock the vault after a period of inactivity on this device."
            checked={autoLock}
            onChange={setAutoLock}
            disabled={saving}
          />
          {autoLock && (
            <div className="py-4">
              <Select
                label="Lock after inactivity"
                options={autoLockOptions}
                value={autoLockMinutes}
                onChange={(event) => setAutoLockMinutes(event.target.value)}
                disabled={saving}
                hint="Choose a shorter interval for shared or portable devices."
                className="max-w-xs"
              />
            </div>
          )}
          <SettingToggle
            icon={<BellRing className="h-4 w-4" />}
            title="Login alerts"
            description="Send an email whenever a new device or location signs in to your vault."
            checked={loginAlerts}
            onChange={setLoginAlerts}
            disabled={saving}
          />
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/settings/devices"
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-600 transition hover:text-brand-700"
        >
          <MonitorSmartphone className="h-3.5 w-3.5" />
          Review active devices
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            onClick={reset}
            disabled={!dirty || saving}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Reset changes
          </Button>
          <Button
            onClick={() => void save()}
            loading={saving}
            disabled={!dirty}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save security settings
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader title="How your vault stays protected" />
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {[
            'Files are encrypted with AES-256 before they leave your device.',
            'Sessions rotate automatically and expire on sign-out.',
            'Every credential reveal and security change is recorded in your activity log.',
            'Changing your password signs out every other session immediately.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-[11.5px] leading-5 text-slate-600">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            <KeyRound className="h-3 w-3" />
            Change master password
          </Link>
          <Link
            to="/activity"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            <LockKeyhole className="h-3 w-3" />
            View security activity
          </Link>
        </div>
      </Card>
    </div>
  )
}

function SettingToggle({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: ReactNode
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-5 py-4 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          {icon}
        </span>
        <div>
          <p className="text-[13px] font-semibold text-ink">{title}</p>
          <p className="mt-0.5 max-w-lg text-[11.5px] leading-5 text-muted">{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} label={title} />
    </div>
  )
}
