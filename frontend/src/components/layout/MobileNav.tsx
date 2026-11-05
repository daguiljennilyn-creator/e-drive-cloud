import { Gauge, FolderOpen, KeyRound, Plus, Settings } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/cn'

const items = [
  { label: 'Home', to: '/dashboard', icon: Gauge },
  { label: 'Files', to: '/documents', icon: FolderOpen },
  { label: 'Vault', to: '/credentials', icon: KeyRound },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export function MobileNav() {
  const navigate = useNavigate()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="relative mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        <button
          type="button"
          onClick={() => navigate('/documents/new')}
          className="absolute -top-5 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/35 ring-4 ring-white transition active:scale-95"
          aria-label="Upload a new document"
        >
          <Plus className="h-5 w-5" />
        </button>
        {items.slice(0, 2).map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
        <span className="w-12" />
        {items.slice(2).map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </nav>
  )
}

function NavItem({
  label,
  to,
  icon: Icon,
}: {
  label: string
  to: string
  icon: typeof Gauge
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex w-16 flex-col items-center gap-1 rounded-lg py-1.5 text-[9px] font-semibold transition',
          isActive ? 'text-brand-600' : 'text-slate-400',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
          {label}
        </>
      )}
    </NavLink>
  )
}
