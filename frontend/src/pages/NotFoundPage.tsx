import { ArrowLeft, Compass, FolderOpen, Gauge, KeyRound, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/layout/Logo'
import { Card } from '../components/ui/Card'

export function NotFoundPage() {
  const { user } = useAuth()

  const links = user
    ? [
        { label: 'Dashboard', to: '/dashboard', icon: Gauge },
        { label: 'My documents', to: '/documents', icon: FolderOpen },
        { label: 'Credentials', to: '/credentials', icon: KeyRound },
      ]
    : [
        { label: 'Sign in', to: '/signin', icon: Gauge },
        { label: 'Create account', to: '/signup', icon: KeyRound },
      ]

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-[72px] w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo to={user ? '/dashboard' : '/signin'} />
          <Link
            to={user ? '/dashboard' : '/signin'}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-600 transition hover:text-brand-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {user ? 'Back to dashboard' : 'Back to sign in'}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-12 sm:px-6">
        <div className="w-full">
          <Card className="overflow-hidden text-center">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-500 ring-1 ring-inset ring-brand-100">
              <span className="absolute inset-0 animate-ping rounded-3xl bg-brand-100/50" />
              <SearchX className="relative h-9 w-9" strokeWidth={1.7} />
            </div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-500">
              Error 404
            </p>
            <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-[-0.045em] text-ink">
              This page isn&apos;t in the vault
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[12.5px] leading-6 text-muted">
              The address may be mistyped, the page may have moved, or the link may have expired. Your
              documents and credentials are still safe.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                to={user ? '/dashboard' : '/signin'}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-[13px] font-semibold text-white shadow-[0_8px_18px_-10px_rgba(37,99,235,0.75)] transition hover:bg-brand-700"
              >
                <Compass className="h-4 w-4" />
                {user ? 'Go to dashboard' : 'Sign in to E-Drive'}
              </Link>
              {user && (
                <Link
                  to="/documents"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-[13px] font-semibold text-ink shadow-sm transition hover:bg-slate-50"
                >
                  Browse documents
                </Link>
              )}
            </div>

            <div className="mt-8 border-t border-line pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Popular destinations
              </p>
              <div className="mt-2.5 flex flex-wrap justify-center gap-2">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <link.icon className="h-3 w-3" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </Card>

          <div className="mt-4 flex flex-wrap justify-center gap-4 text-[10.5px] text-slate-400">
            <Link to="/terms" className="transition hover:text-brand-600">
              Terms of Service
            </Link>
            <Link to="/privacy" className="transition hover:text-brand-600">
              Privacy Policy
            </Link>
            <span>Need help? Contact support from your profile.</span>
          </div>
        </div>
      </main>
    </div>
  )
}
