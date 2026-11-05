export function formatBytes(bytes: number | null | undefined): string {
  const value = Number(bytes ?? 0)
  if (!Number.isFinite(value) || value <= 0) return '0 B'
  if (value >= 1024 ** 4) return `${trim(value / 1024 ** 4)} TB`
  if (value >= 1024 ** 3) return `${trim(value / 1024 ** 3)} GB`
  if (value >= 1024 ** 2) return `${trim(value / 1024 ** 2)} MB`
  if (value >= 1024) return `${trim(value / 1024)} KB`
  return `${Math.round(value)} B`
}

function trim(value: number): string {
  return value.toFixed(value >= 10 ? 0 : 1).replace(/\.0$/, '')
}

export function formatDate(value: string | null | undefined, fallback = '—'): string {
  if (!value) return fallback
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatShortDate(value: string | null | undefined, fallback = '—'): string {
  if (!value) return fallback
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date)
}

export function formatDateTime(value: string | null | undefined, fallback = '—'): string {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function timeAgo(value: string | null | undefined, fallback = '—'): string {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const ranges: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ]
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, unitSeconds] of ranges) {
    if (Math.abs(seconds) >= unitSeconds || unit === 'second') {
      return formatter.format(Math.round(seconds / unitSeconds), unit)
    }
  }
  return fallback
}

export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value)
  if (Number.isNaN(date.getTime())) return null
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000)
}

export function formatPrice(plan: { price: string; price_cents: number; slug: string }): string {
  if (plan.slug === 'free' || plan.price_cents === 0) return 'Free'
  return `$${Number(plan.price).toFixed(0)}`
}

export function percent(value: number, total: number): number {
  if (!total) return 0
  return Math.min(100, Math.max(0, (value / total) * 100))
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function fileTypeLabel(extension: string | null | undefined): string {
  if (!extension) return 'FILE'
  return extension.toUpperCase()
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
