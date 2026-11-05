import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '../lib/cn'

type ToastTone = 'success' | 'error' | 'info'

type Toast = {
  id: number
  tone: ToastTone
  title: string
  message?: string
}

type ToastContextValue = {
  toast: (tone: ToastTone, title: string, message?: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (tone: ToastTone, title: string, message?: string) => {
      counter.current += 1
      const id = counter.current
      setToasts((current) => [...current.slice(-3), { id, tone, title, message }])
      window.setTimeout(() => remove(id), 4600)
    },
    [remove],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, message) => toast('success', title, message),
      error: (title, message) => toast('error', title, message),
      info: (title, message) => toast('info', title, message),
    }),
    [toast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[360px]">
          {toasts.map((item) => (
            <div
              key={item.id}
              className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)] animate-in"
            >
              <span
                className={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  item.tone === 'success' && 'bg-emerald-50 text-emerald-600',
                  item.tone === 'error' && 'bg-red-50 text-danger',
                  item.tone === 'info' && 'bg-brand-50 text-brand-600',
                )}
              >
                {item.tone === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {item.tone === 'error' && <AlertCircle className="h-4 w-4" />}
                {item.tone === 'info' && <Info className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-ink">{item.title}</p>
                {item.message && <p className="mt-0.5 text-[11.5px] leading-5 text-muted">{item.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
