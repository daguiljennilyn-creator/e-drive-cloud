import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  Laptop,
  MapPin,
  Monitor,
  MonitorSmartphone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Tablet,
  Trash2,
  Wifi,
} from 'lucide-react'
import type { Device } from '../../types'
import { settingsApi } from '../../lib/endpoints'
import { apiErrorMessage } from '../../lib/api'
import { formatDateTime, timeAgo } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Spinner'
import { useSettings } from './SettingsLayout'

export function DevicesSettings() {
  const { settings } = useSettings()
  const { success, error } = useToast()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState<string | null>(null)
  const [target, setTarget] = useState<Device | null>(null)
  const [revokeAllOpen, setRevokeAllOpen] = useState(false)
  const [working, setWorking] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(null)
    try {
      const response = await settingsApi.devices()
      setDevices(response.data.devices)
    } catch (caught) {
      setFailed(apiErrorMessage(caught, 'Your active devices could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const revoke = async () => {
    if (!target) return
    setWorking(true)
    try {
      const response = await settingsApi.revokeDevice(target.id)
      setDevices((current) => current.filter((device) => device.id !== target.id))
      success('Device signed out', response.data.message)
      setTarget(null)
    } catch (caught) {
      error('Could not revoke device', apiErrorMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  const revokeAll = async () => {
    setWorking(true)
    try {
      const response = await settingsApi.revokeOtherDevices()
      setDevices((current) => current.filter((device) => device.is_current))
      success('Other devices signed out', response.data.message)
      setRevokeAllOpen(false)
    } catch (caught) {
      error('Could not sign out devices', apiErrorMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  const currentDevice = devices.find((device) => device.is_current) ?? null
  const otherDevices = devices.filter((device) => !device.is_current)

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Active devices"
          description="Every device with a signed-in session for your vault."
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void load()}
                loading={loading}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Refresh
              </Button>
              {otherDevices.length > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setRevokeAllOpen(true)}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Sign out others
                </Button>
              )}
            </div>
          }
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <DeviceStat label="Total sessions" value={String(devices.length)} />
          <DeviceStat label="This device" value={currentDevice ? 'Active' : 'Not identified'} />
          <DeviceStat label="Other devices" value={String(otherDevices.length)} />
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : failed ? (
        <Card className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-danger">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-base font-bold text-ink">Devices unavailable</h2>
          <p className="mt-1.5 text-[12.5px] leading-6 text-muted">{failed}</p>
          <Button className="mt-5" onClick={() => void load()}>
            Try again
          </Button>
        </Card>
      ) : devices.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MonitorSmartphone className="h-6 w-6" />}
            title="No active devices"
            description="Devices appear here after you sign in. Your current session will be recorded automatically."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => (
            <Card key={device.id} padded={false} className="overflow-hidden">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                  <DeviceIcon type={device.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-bold text-ink">{device.name}</p>
                    {device.is_current && (
                      <Badge tone="success" dot>
                        This device
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[11.5px] text-slate-600">
                    {[device.os, device.browser].filter(Boolean).join(' · ') || 'Unknown platform'}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-muted">
                    {device.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {device.location}
                      </span>
                    )}
                    {device.ip_address && (
                      <span className="inline-flex items-center gap-1">
                        <Wifi className="h-3 w-3 text-slate-400" />
                        {device.ip_address}
                      </span>
                    )}
                    <span>
                      Last active {timeAgo(device.last_active_at, formatDateTime(device.last_active_at))}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:pl-3">
                  {device.is_current ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      <ShieldCheck className="h-3 w-3" />
                      Current session
                    </span>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setTarget(device)}
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-amber-100 bg-amber-50/50">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-warning shadow-sm">
            <AlertCircle className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12.5px] font-bold text-amber-900">Not sure about a session?</p>
            <p className="mt-1 text-[11.5px] leading-5 text-amber-900/75">
              Revoke it immediately and change your master password from your profile. Signing out of a
              device takes effect the next time it makes a request. Your current session stays active.
            </p>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={() => void revoke()}
        loading={working}
        title={`Revoke ${target?.name ?? 'this device'}?`}
        description={
          <>
            This device will lose access to your vault immediately. You can sign in again from it later
            with your master password.
          </>
        }
        confirmLabel="Revoke access"
        cancelLabel="Keep signed in"
        tone="danger"
      />

      <ConfirmDialog
        open={revokeAllOpen}
        onClose={() => setRevokeAllOpen(false)}
        onConfirm={() => void revokeAll()}
        loading={working}
        title="Sign out every other device?"
        description={`${otherDevices.length} other ${
          otherDevices.length === 1 ? 'session' : 'sessions'
        } will be ended. Your current device, ${currentDevice?.name ?? 'this browser'}, will stay signed in.`}
        confirmLabel="Sign out others"
        cancelLabel="Cancel"
        tone="danger"
      />

      <p className="text-center text-[10.5px] text-slate-400">
        Signed in as {settings.user.email}. Device activity is recorded in your audit log.
      </p>
    </div>
  )
}

function DeviceIcon({ type }: { type: string }) {
  if (type === 'mobile') return <Smartphone className="h-5 w-5" strokeWidth={1.9} />
  if (type === 'tablet') return <Tablet className="h-5 w-5" strokeWidth={1.9} />
  if (type === 'desktop') return <Monitor className="h-5 w-5" strokeWidth={1.9} />
  return <Laptop className="h-5 w-5" strokeWidth={1.9} />
}

function DeviceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-slate-50/60 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-1 text-[13px] font-bold text-ink">{value}</p>
    </div>
  )
}
