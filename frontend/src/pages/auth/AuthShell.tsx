import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Cloud,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import { Logo } from '../../components/layout/Logo'
import { cn } from '../../lib/cn'

const highlights = [
  { icon: Cloud, text: '15 GB of encrypted storage included' },
  { icon: ShieldCheck, text: 'Zero-knowledge AES-256 encryption' },
  { icon: Smartphone, text: 'Instant sync across every device' },
]

export function AuthShell({
  title,
  subtitle,
  children,
  tabs = true,
  backTo,
  footer,
  wide = false,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  tabs?: boolean
  backTo?: { label: string; to: string }
  footer?: ReactNode
  wide?: boolean
}) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1.02fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-navy lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
          <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
        </div>

        <div className="relative px-12 py-10 xl:px-16">
          <Logo light to="/signin" />
        </div>

        <div className="relative px-12 pb-8 xl:px-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-200">
            <Sparkles className="h-3 w-3" />
            Enterprise vault
          </span>
          <h1 className="mt-6 max-w-md text-balance text-[44px] font-bold leading-[1.08] tracking-[-0.045em] text-white">
            Your documents.
            <br />
            One secure drive.
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-7 text-brand-100/75">
            A unified workspace for fast retrieval, effortless collaboration and full control over where
            your data lives.
          </p>

          <ul className="mt-9 space-y-3.5">
            {highlights.map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-[13.5px] text-white/85">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.08] ring-1 ring-inset ring-white/10">
                  <item.icon className="h-4 w-4 text-brand-200" strokeWidth={1.9} />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative border-t border-white/10 px-12 py-5 xl:px-16">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11.5px] font-medium text-brand-200/65">
            <span className="inline-flex items-center gap-1.5">
              <LockKeyhole className="h-3.5 w-3.5" />
              TLS 1.3 · AES-256
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Fingerprint className="h-3.5 w-3.5" />
              Biometric ready
            </span>
            <span className="inline-flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              Zero-knowledge
            </span>
          </div>
          <p className="mt-3 text-[10.5px] text-brand-200/40">
            Node US-EAST-09 secured · Enterprise v4.1.2
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 py-5 lg:hidden">
          <Logo to="/signin" />
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
            <ShieldCheck className="h-3 w-3" />
            Encrypted
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-4 sm:px-10 lg:px-12">
          <div className={cn('w-full', wide ? 'max-w-[560px]' : 'max-w-[416px]')}>
            {tabs && <AuthTabs />}
            {backTo && (
              <Link
                to={backTo.to}
                className="mb-6 inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-600 transition hover:text-brand-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {backTo.label}
              </Link>
            )}

            <h2 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-ink">{title}</h2>
            {subtitle && <p className="mt-2 text-[13px] leading-6 text-muted">{subtitle}</p>}

            <div className="mt-7">{children}</div>

            {footer && <div className="mt-7">{footer}</div>}

            <div className="mt-8 flex items-center justify-center gap-2 text-[10.5px] text-slate-400">
              <LockKeyhole className="h-3 w-3" />
              TLS 1.3 · AES-256 client-side encryption · Zero-knowledge
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthTabs() {
  return (
    <div className="mb-7 flex items-center gap-6 border-b border-line">
      <span className="relative -mb-px border-b-2 border-brand-600 pb-2.5 text-[13px] font-semibold text-brand-700">
        <Link to="/signin">Sign in</Link>
      </span>
      <Link
        to="/signup"
        className="-mb-px border-b-2 border-transparent pb-2.5 text-[13px] font-medium text-slate-500 transition hover:text-ink"
      >
        Create account
      </Link>
    </div>
  )
}

export function AuthFormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-[12px] font-medium text-red-700"
    >
      {message}
    </div>
  )
}
