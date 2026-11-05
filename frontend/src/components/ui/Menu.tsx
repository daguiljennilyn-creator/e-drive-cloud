import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

export type MenuItem = {
  label: string
  icon?: LucideIcon
  onSelect: () => void
  tone?: 'default' | 'danger'
  disabled?: boolean
}

export function ActionMenu({
  items,
  label = 'Open actions',
  align = 'end',
}: {
  items: MenuItem[]
  label?: string
  align?: 'start' | 'end'
}) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!position) return undefined
    const close = () => setPosition(null)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [position])

  const open = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = 208
    const left = align === 'end' ? Math.max(12, rect.right - width) : Math.min(window.innerWidth - width - 12, rect.left)
    const top = Math.min(rect.bottom + 6, window.innerHeight - 260)
    setPosition({ top: Math.max(12, top), left })
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (position ? setPosition(null) : open())}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {position &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[75]" onClick={() => setPosition(null)} aria-hidden />
            <div
              role="menu"
              style={{ top: position.top, left: position.left }}
              className="fixed z-[76] w-52 overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-[0_20px_48px_-16px_rgba(15,23,42,0.35)] animate-in"
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setPosition(null)
                    item.onSelect()
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40',
                    item.tone === 'danger'
                      ? 'text-danger hover:bg-red-50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-ink',
                  )}
                >
                  {item.icon && <item.icon className="h-3.5 w-3.5 shrink-0" />}
                  {item.label}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  )
}

export function InlineAction({
  children,
  onClick,
  tone = 'brand',
  disabled,
  title,
}: {
  children: ReactNode
  onClick: () => void
  tone?: 'brand' | 'danger' | 'muted'
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'rounded-md px-1.5 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40',
        tone === 'brand' && 'text-brand-600 hover:bg-brand-50',
        tone === 'danger' && 'text-danger hover:bg-red-50',
        tone === 'muted' && 'text-slate-500 hover:bg-slate-100',
      )}
    >
      {children}
    </button>
  )
}
