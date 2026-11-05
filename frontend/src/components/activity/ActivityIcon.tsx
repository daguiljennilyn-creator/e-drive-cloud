import {
  Award,
  BadgeCheck,
  Download,
  FilePlus2,
  KeyRound,
  Link2,
  LockKeyhole,
  LogIn,
  Pencil,
  Share2,
  ShieldCheck,
  Trash2,
  Undo2,
  UserRound,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import type { Activity } from '../../types'
import { cn } from '../../lib/cn'

const actionIcons: Record<string, LucideIcon> = {
  uploaded: FilePlus2,
  updated: Pencil,
  trashed: Trash2,
  restored: Undo2,
  deleted: Trash2,
  shared: Share2,
  share_revoked: Link2,
  verified: BadgeCheck,
  certificate_verified: Award,
  certificates_verified: Award,
  credential_created: KeyRound,
  credential_updated: KeyRound,
  credential_deleted: KeyRound,
  credential_revealed: KeyRound,
  credential_rotated: KeyRound,
  credentials_imported: KeyRound,
  security_updated: ShieldCheck,
  password_changed: LockKeyhole,
  login: LogIn,
  logout: LogIn,
  device_revoked: ShieldCheck,
  devices_revoked: ShieldCheck,
  profile_updated: UserRound,
  plan_changed: WalletCards,
  data_exported: Download,
  account_created: UserRound,
}

export function ActivityIcon({
  activity,
  size = 'md',
  className,
}: {
  activity: Pick<Activity, 'action'>
  size?: 'sm' | 'md'
  className?: string
}) {
  const Icon = actionIcons[activity.action] ?? ShieldCheck
  const danger = ['trashed', 'deleted', 'credential_deleted', 'device_revoked', 'devices_revoked'].includes(
    activity.action,
  )
  const success = [
    'verified',
    'certificate_verified',
    'certificates_verified',
    'restored',
    'uploaded',
    'credential_rotated',
  ].includes(activity.action)
  const info = ['shared', 'share_revoked', 'login', 'logout', 'credential_revealed'].includes(activity.action)

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
        size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
        danger
          ? 'bg-red-50 text-danger ring-red-100'
          : success
            ? 'bg-emerald-50 text-emerald-600 ring-emerald-100'
            : info
              ? 'bg-brand-50 text-brand-600 ring-brand-100'
              : 'bg-slate-100 text-slate-500 ring-slate-200',
        className,
      )}
    >
      <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={1.9} />
    </span>
  )
}
