import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '../../lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
  leadingIcon?: ReactNode
  trailing?: ReactNode
  labelAction?: ReactNode
}

export function Input({
  label,
  error,
  hint,
  leadingIcon,
  trailing,
  labelAction,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="w-full">
      {(label || labelAction) && (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          {label && (
            <label htmlFor={inputId} className="text-[12px] font-semibold text-slate-700">
              {label}
            </label>
          )}
          {labelAction}
        </div>
      )}
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-10 w-full rounded-xl border bg-white px-3.5 text-[13px] text-ink shadow-[0_1px_1px_rgba(15,23,42,0.03)] transition placeholder:text-slate-400',
            'focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100',
            leadingIcon && 'pl-10',
            trailing && 'pr-11',
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-line',
            className,
          )}
          {...props}
        />
        {trailing && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{trailing}</span>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-[11px] font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="mb-1.5 block text-[12px] font-semibold text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        aria-invalid={Boolean(error)}
        className={cn(
          'min-h-24 w-full resize-y rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink shadow-[0_1px_1px_rgba(15,23,42,0.03)] transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-[11px] font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, hint, options, className, id, ...props }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-[12px] font-semibold text-slate-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'h-10 w-full appearance-none rounded-xl border border-line bg-white px-3.5 pr-9 text-[13px] text-ink shadow-[0_1px_1px_rgba(15,23,42,0.03)] transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1.5 text-[11px] font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}
