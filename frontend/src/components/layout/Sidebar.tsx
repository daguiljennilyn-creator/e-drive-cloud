import {
  ArrowUpRight,
  Award,
  Cloud,
  FolderOpen,
  Gauge,
  KeyRound,
  LockKeyhole,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatBytes } from '../../lib/format'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Logo } from './Logo'

const mainNav = [
  { label: 'Dashboard', to: '/dashboard', icon: Gauge },
  { label: 'My Documents', to: '/documents', icon: FolderOpen },
  { label: 'Certificates', to: '/certificates', icon: Award },
  { label: 'Personal Files', to: '/personal-files', icon: UserRound },
  { label: 'Credentials', to: '/credentials', icon: KeyRound },
  { label: 'Trash', to: '/trash', icon: Trash2 },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth()
  const { success, error } = useToast()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await logout()
      setConfirming(false)
      onClose()
      success('Signed out securely', 'Your vault remains encrypted on this device.')
      navigate('/signin', { replace: true })
    } catch {
      error('Sign out failed', 'Please try again.')
    } finally {
      setSigningOut(false)
    }
  }
  const used = user?.storage_used_bytes ?? 0
  const limit = user?.storage_limit_bytes ?? 1
  const percentage = Math.min(100, (used / limit) * 100)

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col overflow-hidden bg-navy text-white transition-transform duration-300 lg:z-30 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-24 h-56 w-56 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="absolute -right-16 bottom-32 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />
        </div>

        <div className="relative flex h-[76px] shrink-0 items-center justify-between px-5">
          <Logo light />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-brand-100 transition hover:bg-white/10 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative px-4">
          <Button
            variant="primary"
            size="md"
            className="w-full justify-start bg-brand-500/95 shadow-brand-950/40 hover:bg-brand-500"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              navigate('/documents/new')
              onClose()
            }}
          >
            New Document
          </Button>
        </div>

        <div className="scrollbar-thin relative mt-6 flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-brand-200/55">Workspace</p>
          <nav className="mt-2 space-y-0.5">
            {mainNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] font-medium transition',
                    isActive
                      ? 'bg-white/[0.11] text-white shadow-sm ring-1 ring-white/10'
                      : 'text-brand-100/75 hover:bg-white/[0.06] hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn('h-[17px] w-[17px]', isActive ? 'text-brand-200' : 'text-brand-200/60')}
                      strokeWidth={1.9}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.label === 'Trash' && (
                      <Trash2 className="h-3 w-3 text-brand-200/35" strokeWidth={1.8} />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="my-4 h-px bg-white/10" />
          <p className="px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-brand-200/55">Account</p>
          <nav className="mt-2 space-y-0.5">
            <NavLink
              to="/profile"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] font-medium transition',
                  isActive
                    ? 'bg-white/[0.11] text-white shadow-sm ring-1 ring-white/10'
                    : 'text-brand-100/75 hover:bg-white/[0.06] hover:text-white',
                )
              }
            >
              <WalletCards className="h-[17px] w-[17px] text-brand-200/60" strokeWidth={1.9} />
              Profile
            </NavLink>
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] font-medium transition',
                  isActive
                    ? 'bg-white/[0.11] text-white shadow-sm ring-1 ring-white/10'
                    : 'text-brand-100/75 hover:bg-white/[0.06] hover:text-white',
                )
              }
            >
              <Settings className="h-[17px] w-[17px] text-brand-200/60" strokeWidth={1.9} />
              Settings
            </NavLink>
          </nav>
        </div>

        <div className="relative shrink-0 border-t border-white/10 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-white">
                <Cloud className="h-3.5 w-3.5 text-brand-300" />
                Storage
              </span>
              <span className="text-[9.5px] font-semibold text-brand-200/70">{Math.round(percentage)}%</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="mt-2 text-[9.5px] text-brand-200/70">
              {formatBytes(used)} of {formatBytes(limit)}
            </p>
            <button
              type="button"
              onClick={() => {
                navigate('/upgrade')
                onClose()
              }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/[0.09] py-2 text-[10.5px] font-semibold text-white transition hover:bg-white/[0.15]"
            >
              <ArrowUpRight className="h-3 w-3" />
              Upgrade plan
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] font-medium text-brand-200/45">
            <LockKeyhole className="h-2.5 w-2.5" />
            Zero-knowledge encryption
            <ShieldCheck className="h-2.5 w-2.5 text-emerald-300/70" />
          </div>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] py-2.5 text-[12px] font-semibold text-red-200 transition hover:bg-red-500/15 lg:hidden"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleSignOut}
        loading={signingOut}
        title="Sign out of E-Drive?"
        description="Your encrypted files stay safe in your vault. You can sign back in at any time."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        tone="danger"
      />
    </>
  )
}
