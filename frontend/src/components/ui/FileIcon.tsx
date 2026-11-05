import {
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Presentation,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'

const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'])
const sheetExtensions = new Set(['xls', 'xlsx', 'csv'])
const archiveExtensions = new Set(['zip', 'rar', '7z'])
const presentationExtensions = new Set(['ppt', 'pptx'])

export function fileIconFor(extension: string, category?: string): LucideIcon {
  if (category === 'certificate' || category === 'credential') return ShieldCheck
  if (imageExtensions.has(extension)) return FileImage
  if (sheetExtensions.has(extension)) return FileSpreadsheet
  if (archiveExtensions.has(extension)) return FileArchive
  if (presentationExtensions.has(extension)) return Presentation
  return FileText
}

const sizes = {
  sm: { tile: 'h-8 w-8 rounded-lg', icon: 'h-3.5 w-3.5' },
  md: { tile: 'h-10 w-10 rounded-xl', icon: 'h-4.5 w-4.5' },
  lg: { tile: 'h-14 w-14 rounded-2xl', icon: 'h-6 w-6' },
}

export function FileIcon({
  extension,
  category,
  size = 'md',
  className,
}: {
  extension: string
  category?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const Icon = fileIconFor(extension, category)
  const palette = imageExtensions.has(extension)
    ? 'bg-violet-50 text-violet-600 ring-violet-100'
    : sheetExtensions.has(extension)
      ? 'bg-emerald-50 text-emerald-600 ring-emerald-100'
      : archiveExtensions.has(extension)
        ? 'bg-amber-50 text-amber-600 ring-amber-100'
        : presentationExtensions.has(extension)
          ? 'bg-orange-50 text-orange-600 ring-orange-100'
          : category === 'certificate' || category === 'credential'
            ? 'bg-brand-50 text-brand-600 ring-brand-100'
            : 'bg-red-50 text-red-500 ring-red-100'

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center ring-1 ring-inset',
        palette,
        sizes[size].tile,
        className,
      )}
    >
      <Icon className={sizes[size].icon} strokeWidth={1.8} />
    </span>
  )
}
