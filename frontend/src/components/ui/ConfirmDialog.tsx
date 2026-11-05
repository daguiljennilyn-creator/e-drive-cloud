import type { ReactNode } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center sm:text-left">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl sm:mx-0 ${
            tone === 'danger' ? 'bg-red-50 text-danger' : 'bg-brand-50 text-brand-600'
          }`}
        >
          {tone === 'danger' ? <Trash2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </div>
        <h2 className="mt-4 text-lg font-bold tracking-[-0.02em] text-ink">{title}</h2>
        <div className="mt-2 text-[13px] leading-6 text-muted">{description}</div>
        {children && <div className="mt-4 text-left">{children}</div>}
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={tone} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
