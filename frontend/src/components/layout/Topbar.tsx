import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bell, Menu, Search, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/Avatar'
import { UserMenu } from './UserMenu'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, unreadCount } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/documents?q=${encodeURIComponent(trimmed)}` : '/documents')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur-xl">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenu}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <form onSubmit={submit} className="relative hidden max-w-md flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search in E-Drive…"
            aria-label="Search documents"
            className="h-9 w-full rounded-xl border border-line bg-slate-50/70 pl-9 pr-16 text-[12px] text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-line bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
            Ctrl K
          </span>
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/upgrade')}
            className="hidden items-center gap-1 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700 transition hover:bg-brand-100 md:inline-flex"
          >
            <Sparkles className="h-3 w-3" />
            {user?.plan?.storage_label ?? '15 GB'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-slate-500 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[8.5px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="hidden h-6 w-px bg-line sm:block" />

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="rounded-full transition hover:ring-2 hover:ring-brand-100 sm:hidden"
            aria-label="Open profile"
          >
            {user && <Avatar name={user.name} initials={user.initials} src={user.avatar_url} size="sm" />}
          </button>

          <div className="hidden sm:block">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
