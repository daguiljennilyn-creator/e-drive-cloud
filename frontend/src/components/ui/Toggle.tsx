import { cn } from '../../lib/cn'

export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  className,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
  className?: string
}) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-brand-600' : 'bg-slate-200',
      )}
    >
      <span
        className={cn(
          'inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  )

  if (!label) return <span className={className}>{control}</span>

  return (
    <div className={cn('flex items-start justify-between gap-6', className)}>
      <div>
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        {description && <p className="mt-0.5 text-[11.5px] leading-5 text-muted">{description}</p>}
      </div>
      {control}
    </div>
  )
}
