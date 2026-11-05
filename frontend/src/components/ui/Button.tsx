import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'dark'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-[0_8px_18px_-10px_rgba(37,99,235,0.75)] hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300',
  secondary:
    'border border-line bg-white text-ink shadow-sm hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-ink disabled:text-slate-400',
  danger:
    'bg-danger text-white shadow-[0_8px_18px_-10px_rgba(220,38,38,0.6)] hover:bg-red-700 active:bg-red-800 disabled:bg-red-300',
  outline:
    'border border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-300 hover:bg-brand-100 active:bg-brand-200 disabled:text-brand-300',
  dark: 'bg-navy text-white shadow-sm hover:bg-[#0f1b3d] active:bg-[#0b142e] disabled:bg-slate-400',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-[13px]',
  lg: 'h-12 gap-2.5 rounded-xl px-5 text-sm',
  icon: 'h-9 w-9 rounded-lg',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold transition-all duration-150 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}
