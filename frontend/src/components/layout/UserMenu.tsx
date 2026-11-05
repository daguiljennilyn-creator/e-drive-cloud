import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, Settings, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Avatar } from '../ui/Avatar'
import { ConfirmDialog } from '../ui/ConfirmDialog'

export function UserMenu() {
  const { user, logout } = useAuth()
  const { success, error } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return undefined
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await logout()
      setConfirming(false)
      success('Signed out securely', 'Your vault remains encrypted on this device.')
      navigate('/signin', { replace: true })
    } catch {
      error('Sign out failed', 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-slate-100"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Avatar name={user.name} initials={user.initials} src={user.avatar_url} size="sm" />
          <span className="hidden text-left xl:block">
            <span className="block text-[11.5px] font-semibold leading-tight text-ink">{user.name}</span>
            <span className="mt-0.5 block text-[9.5px] leading-tight text-muted">
              {user.job_title ?? user.role ?? 'Member'}
            </span>
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] w-64 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] animate-in"
          >
            <div className="border-b border-line bg-slate-50/70 px-4 py-3.5">
              <p className="text-[12.5px] font-bold text-ink">{user.name}</p>
              <p className="mt-0.5 truncate text-[10.5px] text-muted">{user.email}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                <ShieldCheck className="h-2.5 w-2.5" />
                {user.plan?.name ?? 'Starter'} plan
              </span>
            </div>
            <div className="p-1.5">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-ink"
                role="menuitem"
              >
                <UserRound className="h-4 w-4 text-slate-400" />
                My profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-ink"
                role="menuitem"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setConfirming(true)
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-danger transition hover:bg-red-50"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleSignOut}
        loading={loading}
        title="Sign out of E-Drive?"
        description="Your encrypted files stay safe in your vault. You can sign back in at any time."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        tone="danger"
      />
    </>
  )
}
