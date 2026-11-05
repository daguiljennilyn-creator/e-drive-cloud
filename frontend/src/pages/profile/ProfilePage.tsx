import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Award,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  Check,
  Download,
  FileText,
  Heart,
  KeyRound,
  Link2,
  Mail,
  MapPin,
  PenLine,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { ProfileResponse } from '../../types'
import { profileApi } from '../../lib/endpoints'
import { apiErrorMessage, apiFieldErrors, type ValidationErrors } from '../../lib/api'
import { formatBytes, formatDate } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { Input, Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Skeleton } from '../../components/ui/Spinner'

export function ProfilePage() {
  const { user, setUser, logout } = useAuth()
  const { success, error } = useToast()
  const navigate = useNavigate()
  const [data, setData] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [profileErrors, setProfileErrors] = useState<ValidationErrors>({})
  const [savingProfile, setSavingProfile] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<ValidationErrors>({})
  const [savingPassword, setSavingPassword] = useState(false)

  const [exporting, setExporting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deletePhrase, setDeletePhrase] = useState('')
  const [deleteErrors, setDeleteErrors] = useState<ValidationErrors>({})
  const [deleting, setDeleting] = useState(false)

  const hydrate = useCallback((profile: ProfileResponse) => {
    setData(profile)
    setName(profile.user.name)
    setEmail(profile.user.email)
    setPhone(profile.user.phone ?? '')
    setJobTitle(profile.user.job_title ?? '')
    setCompany(profile.user.company ?? '')
    setBio(profile.user.bio ?? '')
    setAvatarFile(null)
    setRemoveAvatar(false)
  }, [])

  const load = useCallback(async () => {
    try {
      setFailed(null)
      const response = await profileApi.get()
      hydrate(response.data)
      setUser(response.data.user)
    } catch (caught) {
      setFailed(apiErrorMessage(caught, 'Your profile could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [hydrate, setUser])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null)
      return undefined
    }
    const url = URL.createObjectURL(avatarFile)
    setAvatarPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  const saveProfile = async () => {
    setSavingProfile(true)
    setProfileErrors({})
    const form = new FormData()
    form.append('name', name.trim())
    form.append('email', email.trim())
    form.append('phone', phone.trim())
    form.append('job_title', jobTitle.trim())
    form.append('company', company.trim())
    form.append('bio', bio.trim())
    if (avatarFile) form.append('avatar', avatarFile)
    if (removeAvatar) form.append('remove_avatar', '1')

    try {
      const response = await profileApi.update(form)
      success('Profile updated', response.data.message)
      setUser(response.data.user)
      await load()
    } catch (caught) {
      setProfileErrors(apiFieldErrors(caught))
      error('Could not save profile', apiErrorMessage(caught))
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async () => {
    setSavingPassword(true)
    setPasswordErrors({})
    try {
      const response = await profileApi.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })
      success('Password updated', response.data.message)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (caught) {
      setPasswordErrors(apiFieldErrors(caught))
      error('Could not update password', apiErrorMessage(caught))
    } finally {
      setSavingPassword(false)
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

  const deleteAccount = async () => {
    setDeleting(true)
    setDeleteErrors({})
    try {
      await profileApi.remove(deletePassword, deletePhrase.trim())
      await logout()
      success('Account deleted', 'Your vault and all encrypted files have been removed.')
      navigate('/signin', { replace: true })
    } catch (caught) {
      setDeleteErrors(apiFieldErrors(caught))
      error('Could not delete account', apiErrorMessage(caught))
    } finally {
      setDeleting(false)
    }
  }

  const closeDelete = () => {
    setDeleteOpen(false)
    setDeletePassword('')
    setDeletePhrase('')
    setDeleteErrors({})
  }

  if (loading) return <ProfileSkeleton />

  if (failed || !data || !user) {
    return (
      <Card className="mx-auto mt-10 max-w-lg text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-danger">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-base font-bold text-ink">Profile unavailable</h2>
        <p className="mt-1.5 text-[12.5px] leading-6 text-muted">{failed ?? 'Please try again.'}</p>
        <Button className="mt-5" onClick={() => void load()}>
          Try again
        </Button>
      </Card>
    )
  }

  const stats = data.stats
  const displayAvatar =
    avatarPreview ??
    (removeAvatar ? null : (data.user.avatar_url ?? user.avatar_url ?? null))

  return (
    <div className="space-y-5">
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Profile' }]}
        title="My profile"
        description="Manage your identity, sign-in credentials and personal data."
        actions={
          <Link
            to="/settings"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-[13px] font-semibold text-ink shadow-sm transition hover:bg-slate-50"
          >
            <PenLine className="h-4 w-4" />
            Workspace settings
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Card padded={false} className="overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-400" />

            <div className="px-5 pb-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="-mt-10 flex items-end gap-3">
                  <div className="rounded-full border-4 border-white bg-white shadow-sm">
                    <Avatar
                      name={data.user.name}
                      initials={data.user.initials}
                      src={displayAvatar}
                      size="xl"
                    />
                  </div>
                  <div className="pb-1">
                    <h2 className="text-lg font-bold tracking-[-0.02em] text-ink">{data.user.name}</h2>
                    <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted">
                      <Mail className="h-3 w-3" />
                      {data.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pb-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => avatarRef.current?.click()}
                    leftIcon={<Camera className="h-3.5 w-3.5" />}
                  >
                    Change photo
                  </Button>
                  <input
                    ref={avatarRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                        error('Unsupported image', 'Choose a JPG, PNG or WebP image.')
                        return
                      }
                      if (file.size > 2 * 1024 * 1024) {
                        error('Image too large', 'Profile photos must be 2 MB or smaller.')
                        return
                      }
                      setAvatarFile(file)
                      setRemoveAvatar(false)
                    }}
                  />
                  {(data.user.avatar_url || avatarFile) && !removeAvatar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAvatarFile(null)
                        setRemoveAvatar(true)
                      }}
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{data.user.plan?.name ?? 'Starter'} plan</Badge>
                {data.user.job_title && (
                  <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-600">
                    <Briefcase className="h-3 w-3 text-slate-400" />
                    {data.user.job_title}
                  </span>
                )}
                {data.user.company && (
                  <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-600">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    {data.user.company}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-600">
                  <CalendarDays className="h-3 w-3 text-slate-400" />
                  Member since {stats.member_since ?? formatDate(data.user.created_at)}
                </span>
              </div>

              {data.user.bio && (
                <p className="mt-3 max-w-2xl text-[12px] leading-6 text-slate-600">{data.user.bio}</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Personal information"
              description="This information appears on your profile and shared documents."
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                error={profileErrors.name?.[0]}
                maxLength={100}
              />
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={profileErrors.email?.[0]}
                leadingIcon={<Mail className="h-3.5 w-3.5" />}
              />
              <Input
                label="Phone number"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                error={profileErrors.phone?.[0]}
                leadingIcon={<Phone className="h-3.5 w-3.5" />}
                placeholder="+1 (555) 000-0000"
              />
              <Input
                label="Job title"
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                error={profileErrors.job_title?.[0]}
                leadingIcon={<Briefcase className="h-3.5 w-3.5" />}
              />
              <Input
                label="Company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                error={profileErrors.company?.[0]}
                leadingIcon={<Building2 className="h-3.5 w-3.5" />}
              />
              <div className="sm:col-span-1">
                <p className="mb-1.5 text-[12px] font-semibold text-slate-700">Account role</p>
                <div className="flex h-10 items-center rounded-xl border border-line bg-slate-50 px-3.5 text-[12.5px] text-slate-500">
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  {data.user.role ?? 'Vault owner'}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Textarea
                  label="Bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  error={profileErrors.bio?.[0]}
                  maxLength={500}
                  rows={3}
                  placeholder="A short description for your profile."
                  hint={`${bio.length}/500 characters`}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => hydrate(data)} disabled={savingProfile}>
                Reset
              </Button>
              <Button
                onClick={() => void saveProfile()}
                loading={savingProfile}
                disabled={!name.trim() || !email.trim()}
                leftIcon={<Check className="h-4 w-4" />}
              >
                Save changes
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Change password"
              description="Updating your password signs out every other active session."
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Input
                label="Current password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                error={passwordErrors.current_password?.[0]}
                autoComplete="current-password"
              />
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                error={passwordErrors.password?.[0]}
                hint="At least 8 characters with letters and numbers."
                autoComplete="new-password"
              />
              <Input
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={passwordErrors.password_confirmation?.[0]}
                autoComplete="new-password"
              />
            </div>
            <div className="mt-4 flex justify-end border-t border-line pt-4">
              <Button
                onClick={() => void changePassword()}
                loading={savingPassword}
                disabled={!currentPassword || !newPassword || !confirmPassword}
                leftIcon={<KeyRound className="h-4 w-4" />}
              >
                Update password
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Data & account"
              description="Download a copy of your data or permanently close your account."
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line p-4">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-brand-600" />
                  <p className="text-[12.5px] font-bold text-ink">Export your data</p>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-5 text-muted">
                  Download your profile, document metadata and recent activity as JSON.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  loading={exporting}
                  onClick={() => void exportData()}
                >
                  Download export
                </Button>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-danger" />
                  <p className="text-[12.5px] font-bold text-red-800">Delete account</p>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-5 text-red-700/80">
                  Permanently removes every document, credential, activity and notification.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  className="mt-3"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete my account
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Your vault at a glance" />
            <dl className="mt-3 divide-y divide-line">
              <ProfileStat icon={FileText} label="Documents" value={String(stats.documents)} />
              <ProfileStat icon={Link2} label="Shared documents" value={String(stats.shared)} />
              <ProfileStat icon={Star} label="Favorites" value={String(stats.favorites)} />
              <ProfileStat icon={Heart} label="Activity events" value={String(stats.activities)} />
              <ProfileStat icon={Award} label="Current plan" value={data.user.plan?.name ?? 'Starter'} />
              <ProfileStat icon={MapPin} label="Storage used" value={formatBytes(stats.storage_used_bytes)} />
            </dl>
            <div className="mt-4 rounded-xl border border-line bg-slate-50/70 px-3.5 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-600">Plan storage</span>
                <span className="text-[11px] font-bold text-ink">{formatBytes(data.user.storage_limit_bytes)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${Math.min(100, data.user.storage_percentage)}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-muted">
                {data.user.storage_percentage}% used ·{' '}
                <Link to="/upgrade" className="font-semibold text-brand-600 hover:text-brand-700">
                  Upgrade plan
                </Link>
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Account safety" />
            <div className="mt-3 space-y-2.5">
              <SafetyRow label="Two-factor authentication" active={data.user.two_factor_enabled} />
              <SafetyRow label="Biometric vault lock" active={data.user.biometric_enabled} />
              <SafetyRow label="Login alerts" active={data.user.login_alerts_enabled} />
              <SafetyRow label="Auto-lock" active={data.user.auto_lock_enabled} />
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
      </div>

      <Modal
        open={deleteOpen}
        onClose={closeDelete}
        title="Delete your account"
        description="This action is permanent and cannot be undone."
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeDelete}
              disabled={deleting}
            >
              Keep my account
            </Button>
            <Button
              variant="danger"
              onClick={() => void deleteAccount()}
              loading={deleting}
              disabled={!deletePassword || deletePhrase.trim() !== 'DELETE'}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Delete forever
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="text-[11.5px] leading-5 text-red-800">
              Your documents, credentials, share links, devices and activity history will be deleted
              immediately. There is no recovery.
            </p>
          </div>
          <Input
            label="Current password"
            type="password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            error={deleteErrors.password?.[0]}
            autoComplete="current-password"
          />
          <Input
            label='Type "DELETE" to confirm'
            value={deletePhrase}
            onChange={(event) => setDeletePhrase(event.target.value)}
            error={deleteErrors.confirmation?.[0]}
            placeholder="DELETE"
          />
        </div>
      </Modal>
    </div>
  )
}

function ProfileStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="flex items-center gap-2 text-[11.5px] text-slate-600">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </dt>
      <dd className="text-[12px] font-bold text-ink">{value}</dd>
    </div>
  )
}

function SafetyRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11.5px] text-slate-600">{label}</span>
      <span
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
          active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {active && <Check className="h-2.5 w-2.5" />}
        {active ? 'On' : 'Off'}
      </span>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-64 rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  )
}
