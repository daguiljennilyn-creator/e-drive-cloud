import { useState } from 'react'
import {
  BarChart3,
  CheckCircle2,
  Download,
  Eye,
  FileJson,
  History,
  Lightbulb,
  LockKeyhole,
  RotateCcw,
  Save,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PrivacyPreferences } from '../../types'
import { profileApi, settingsApi } from '../../lib/endpoints'
import { apiErrorMessage } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { Toggle } from '../../components/ui/Toggle'
import { useSettings } from './SettingsLayout'

type PreferenceKey = keyof PrivacyPreferences

const items: {
  key: PreferenceKey
  title: string
  description: string
  icon: typeof Eye
  tone: string
}[] = [
  {
    key: 'profile_visible',
    title: 'Profile visibility',
    description: 'Show your name, initials and avatar to people opening a document you shared.',
    icon: Eye,
    tone: 'bg-brand-50 text-brand-600',
  },
  {
    key: 'activity_logging',
    title: 'Activity logging',
    description: 'Record document, credential, sharing and security events in your audit log.',
    icon: History,
    tone: 'bg-violet-50 text-violet-600',
  },
  {
    key: 'analytics',
    title: 'Usage analytics',
    description: 'Share anonymised feature usage so we can improve the E-Drive experience.',
    icon: BarChart3,
    tone: 'bg-sky-50 text-sky-600',
  },
  {
    key: 'personalized_tips',
    title: 'Personalised tips',
    description: 'Use my recent activity to suggest relevant organisation and security tips.',
    icon: Lightbulb,
    tone: 'bg-amber-50 text-amber-600',
  },
]

export function PrivacySettings() {
  const { settings, updateUser } = useSettings()
  const { success, error } = useToast()
  const user = settings.user

  const [preferences, setPreferences] = useState<PrivacyPreferences>(user.privacy_preferences)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  const dirty = (Object.keys(preferences) as PreferenceKey[]).some(
    (key) => preferences[key] !== user.privacy_preferences[key],
  )

  const update = (key: PreferenceKey, value: boolean) => {
    setPreferences((current) => ({ ...current, [key]: value }))
  }

  const reset = () => setPreferences(user.privacy_preferences)

  const save = async () => {
    setSaving(true)
    try {
      const response = await settingsApi.updatePrivacy(preferences)
      setPreferences(response.data.privacy_preferences)
      updateUser({ ...user, privacy_preferences: response.data.privacy_preferences })
      success('Privacy settings saved', response.data.message)
    } catch (caught) {
      error('Could not save privacy settings', apiErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const exportData = async () => {
    setExporting(true)
    try {
      const response = await profileApi.exportData()
      const blob = response.data as Blob
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `e-drive-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      success('Export ready', 'Your account data was downloaded as JSON.')
    } catch (caught) {
      error('Export failed', apiErrorMessage(caught))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Privacy controls"
          description="Decide what E-Drive records and what other people can see."
        />

        <div className="mt-4 divide-y divide-line rounded-xl border border-line">
          {items.map((item) => (
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
                  <p className="mt-0.5 max-w-lg text-[11px] leading-5 text-muted">{item.description}</p>
                  {item.key === 'activity_logging' && !preferences.activity_logging && (
                    <p className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-semibold text-amber-700">
                      <ShieldAlert className="h-3 w-3" />
                      Security-critical events may still be recorded to protect your account.
                    </p>
                  )}
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
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/privacy"
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-600 transition hover:text-brand-700"
        >
          <LockKeyhole className="h-3.5 w-3.5" />
          Read the privacy policy
        </Link>
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
            Save privacy settings
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Your data"
            description="Download a machine-readable copy of everything linked to your account."
          />
          <div className="mt-4 rounded-xl border border-line bg-slate-50/60 p-4">
            <div className="flex items-center gap-2">
              <FileJson className="h-4 w-4 text-brand-600" />
              <p className="text-[12.5px] font-bold text-ink">Account data export</p>
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-muted">
              Includes your profile, document metadata, credentials metadata, devices and recent
              activity. File contents and secrets are never included.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => void exportData()}
              loading={exporting}
              leftIcon={<Download className="h-3.5 w-3.5" />}
            >
              Download JSON export
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Retention & deletion"
            description="Understand what happens when data is removed."
          />
          <ul className="mt-3 space-y-2.5">
            {[
              'Documents move to Trash first and can be restored at any time.',
              'Permanently deleted files and credentials are removed immediately.',
              'Closing your account deletes documents, credentials, devices and notifications.',
              'Activity history is retained only for the life of your account.',
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-danger transition hover:bg-red-100"
            >
              <Trash2 className="h-3 w-3" />
              Delete my account
            </Link>
            <Link
              to="/trash"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              <Trash2 className="h-3 w-3" />
              Open trash
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
