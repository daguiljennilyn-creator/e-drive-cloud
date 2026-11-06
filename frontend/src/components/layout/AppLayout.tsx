import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  BellRing,
  ChevronRight,
  HardDrive,
  LockKeyhole,
  MonitorSmartphone,
  Settings2,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import type { SettingsResponse, User } from '../../types'
import { settingsApi } from '../../lib/endpoints'
import { apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageLoader } from '../../components/ui/Spinner'
import { cn } from '../../lib/cn'

type SettingsContextValue = {
  settings: SettingsResponse
  refresh: () => Promise<void>
  updateUser: (user: User) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

const sections = [
  {
    label: 'General',
    description: 'Account overview',
    to: '/settings',
    icon: Settings2,
    end: true,
  },
  {
    label: 'Security',
    description: 'Vault protection',
    to: '/settings/security',
    icon: ShieldCheck,
  },
  {
    label: 'Notifications',
    description: 'Alerts & digests',
    to: '/settings/notifications',
    icon: BellRing,
  },
  {
    label: 'Devices',
    description: 'Active sessions',
    to: '/settings/devices',
    icon: MonitorSmartphone,
  },
  {
    label: 'Storage & plan',
    description: 'Usage and limits',
    to: '/settings/storage',
    icon: HardDrive,
  },
  {
    label: 'Privacy',
    description: 'Data & visibility',
    to: '/settings/privacy',
    icon: LockKeyhole,
  },
]

export function SettingsLayout() {
  const { setUser } = useAuth()
  const [settings, setSettings] = useState<SettingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(null)
    try {
      const response = await settingsApi.get()
      setSettings(response.data)
      setUser(response.data.user)
    } catch (caught) {
      setFailed(apiErrorMessage(caught, 'Your workspace settings could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [setUser])

  useEffect(() => {
    void load()
  }, [load])

  const updateUser = useCallback(
    (user: User) => {
      setSettings((current) => (current ? { ...current, user } : current))
      setUser(user)
    },
    [setUser],
  )

  const value = useMemo<SettingsContextValue | null>(
    () => (settings ? { settings, refresh: load, updateUser } : null),
    [settings, load, updateUser],
  )

  if (loading && !settings) {
    return (
      <div className="space-y-5">
        <PageHeader
          crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Settings' }]}
          title="Workspace settings"
          description="Manage your account, vault security, notifications and storage."
        />
        <PageLoader label="Loading your workspace settings…" />
      </div>
    )
  }

  if (!settings || !value) {
    return (
      <div className="space-y-5">
        <PageHeader
          crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Settings' }]}
          title="Workspace settings"
        />
        <Card className="mx-auto mt-6 max-w-lg text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-danger">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-base font-bold text-ink">Settings unavailable</h2>
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

  return (
    <SettingsContext.Provider value={value}>
      <div className="space-y-5">
        <PageHeader
          crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Settings' }]}
          title="Workspace settings"
          description="Manage your account, vault security, notifications and storage."
          actions={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              <ShieldCheck className="h-3 w-3" />
              Encrypted workspace
            </span>
          }
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[236px_minmax(0,1fr)]">
          <SettingsNav />
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </SettingsContext.Provider>
  )
}

function SettingsNav() {
  return (
    <nav aria-label="Settings sections" className="min-w-0 lg:sticky lg:top-5 lg:self-start">
      <Card padded={false} className="overflow-hidden">
        <div className="flex gap-1 overflow-x-auto p-1.5 lg:flex-col lg:overflow-visible">
          {sections.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              end={section.end}
              className={({ isActive }) =>
                cn(
                  'group flex min-w-max items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition lg:min-w-0',
                  isActive
                    ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition',
                      isActive
                        ? 'bg-white text-brand-600 shadow-sm'
                        : 'bg-slate-100 text-slate-400 group-hover:text-slate-600',
                    )}
                  >
                    <section.icon className="h-4 w-4" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold">{section.label}</span>
                    <span className="mt-0.5 hidden text-[10px] text-muted lg:block">
                      {section.description}
                    </span>
                  </span>
                  <ChevronRight className="hidden h-3.5 w-3.5 text-slate-300 lg:block" />
                </>
              )}
            </NavLink>
          ))}
        </div>
      </Card>

      <div className="mt-3 hidden rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-card)] lg:block">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-brand-500" />
          <p className="text-[11.5px] font-bold text-ink">Personal profile</p>
        </div>
        <p className="mt-1.5 text-[10.5px] leading-5 text-muted">
          Update your name, photo and contact details from your profile page.
        </p>
        <NavLink
          to="/profile"
          className="mt-2.5 inline-flex items-center gap-0.5 text-[11px] font-semibold text-brand-600 transition hover:text-brand-700"
        >
          Open profile
          <ChevronRight className="h-3 w-3" />
        </NavLink>
      </div>
    </nav>
  )
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within SettingsLayout')
  return context
}

export function SettingRow({
  icon,
  title,
  description,
  children,
}: {
  icon?: ReactNode
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line py-4 last:border-b-0 last:pb-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-ink">{title}</p>
          {description && <p className="mt-0.5 text-[11.5px] leading-5 text-muted">{description}</p>}
        </div>
      </div>
      <div className="shrink-0 sm:pl-4">{children}</div>
    </div>
  )
}
