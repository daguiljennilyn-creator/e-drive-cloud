import { useState } from 'react'
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  HardDrive,
  Link2,
  Mail,
  RotateCcw,
  Save,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { NotificationPreferences } from '../../types'
import { settingsApi } from '../../lib/endpoints'
import { apiErrorMessage } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { Toggle } from '../../components/ui/Toggle'
import { useSettings } from './SettingsLayout'

type PreferenceKey = keyof NotificationPreferences

const groups: {
  title: string
  description: string
  items: {
    key: PreferenceKey
    title: string
    description: string
    icon: typeof BellRing
    tone: string
  }[]
}[] = [
  {
    title: 'Vault activity',
    description: 'Updates about documents and shares in your workspace.',
    items: [
      {
        key: 'expiry_reminders',
        title: 'Expiry reminders',
        description: 'Email me 30 days before a document in my vault expires.',
        icon: CalendarClock,
        tone: 'bg-amber-50 text-amber-600',
      },
      {
        key: 'sharing_activity',
        title: 'Sharing activity',
        description: 'Let me know when someone views or downloads a document I shared.',
        icon: Link2,
        tone: 'bg-brand-50 text-brand-600',
      },
      {
        key: 'storage_alerts',
        title: 'Storage alerts',
        description: 'Warn me when my vault reaches 80% and 95% of its plan limit.',
        icon: HardDrive,
        tone: 'bg-violet-50 text-violet-600',
      },
    ],
  },
  {
    title: 'Security & account',
    description: 'Important account events and product news.',
    items: [
      {
        key: 'security_alerts',
        title: 'Security alerts',
        description: 'New sign-ins, password changes and unusual vault activity.',
        icon: ShieldAlert,
        tone: 'bg-red-50 text-red-600',
      },
      {
        key: 'weekly_digest',
        title: 'Weekly digest',
        description: 'A Monday summary of new files, expiring documents and recent activity.',
        icon: Mail,
        tone: 'bg-emerald-50 text-emerald-600',
      },
      {
        key: 'product_updates',
        title: 'Product updates',
        description: 'Occasional announcements about new E-Drive features and improvements.',
        icon: Sparkles,
        tone: 'bg-sky-50 text-sky-600',
      },
    ],
  },
]

export function NotificationSettings() {
  const { settings, updateUser } = useSettings()
  const { success, error } = useToast()
  const user = settings.user

  const [preferences, setPreferences] = useState<NotificationPreferences>(
    user.notification_preferences,
  )
  const [saving, setSaving] = useState(false)

  const dirty = (Object.keys(preferences) as PreferenceKey[]).some(
    (key) => preferences[key] !== user.notification_preferences[key],
  )

  const update = (key: PreferenceKey, value: boolean) => {
    setPreferences((current) => ({ ...current, [key]: value }))
  }

  const reset = () => setPreferences(user.notification_preferences)

  const save = async () => {
    setSaving(true)
    try {
      const response = await settingsApi.updateNotifications(preferences)
      setPreferences(response.data.notification_preferences)
      updateUser({ ...user, notification_preferences: response.data.notification_preferences })
      success('Notification preferences saved', response.data.message)
    } catch (caught) {
      error('Could not save preferences', apiErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Notification preferences"
          description="Choose what reaches your inbox. In-app notifications stay available in your notification centre."
          action={
            <Link
              to="/notifications"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <BellRing className="h-3 w-3" />
              Notification centre
            </Link>
          }
        />

        <div className="mt-5 space-y-6">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[12.5px] font-bold text-ink">{group.title}</h3>
                  <p className="mt-0.5 text-[11px] text-muted">{group.description}</p>
                </div>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Email
                </span>
              </div>

              <div className="mt-2 divide-y divide-line rounded-xl border border-line">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-5 px-3.5 py-3.5 first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.tone}`}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[12.5px] font-semibold text-ink">{item.title}</p>
                        <p className="mt-0.5 max-w-lg text-[11px] leading-5 text-muted">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <Toggle
                      checked={preferences[item.key]}
                      onChange={(value) => update(item.key, value)}
                      disabled={saving}
                      label={item.title}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-muted">
          Critical security alerts about account compromise are always delivered.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            onClick={reset}
            disabled={!dirty || saving}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Reset
          </Button>
          <Button
            onClick={() => void save()}
            loading={saving}
            disabled={!dirty}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save preferences
          </Button>
        </div>
      </div>

      <Card className="border-brand-100 bg-brand-50/50">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12.5px] font-bold text-ink">Delivery is under your control</p>
            <p className="mt-1 text-[11.5px] leading-5 text-slate-600">
              Turning a preference off stops those emails immediately, but never hides security events
              from your activity log. You can still review every event in{' '}
              <Link to="/activity" className="font-semibold text-brand-700 hover:text-brand-800">
                account activity
              </Link>
              .
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
