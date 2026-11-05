import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, Link2, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import type { Document } from '../../types'
import { documentsApi } from '../../lib/endpoints'
import { apiErrorMessage } from '../../lib/api'
import { copyToClipboard } from '../../lib/clipboard'
import { formatDateTime } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Input'

const expiryOptions = [
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
]

export function ShareDialog({
  document,
  open,
  onClose,
  onUpdated,
}: {
  document: Document | null
  open: boolean
  onClose: () => void
  onUpdated: (document: Document) => void
}) {
  const { success, error } = useToast()
  const [days, setDays] = useState('7')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [current, setCurrent] = useState<Document | null>(document)

  useEffect(() => {
    setCurrent(document)
    setCopied(false)
  }, [document])

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  if (!current) return null

  const createLink = async () => {
    setLoading(true)
    try {
      const response = await documentsApi.share(current.id, Number(days))
      setCurrent(response.data.document)
      onUpdated(response.data.document)
      success('Secure link created', 'Only people with the link can open this document.')
    } catch (caught) {
      error('Could not create link', apiErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  const revoke = async () => {
    setLoading(true)
    try {
      const response = await documentsApi.unshare(current.id)
      setCurrent(response.data.document)
      onUpdated(response.data.document)
      success('Share link revoked', 'The public link no longer works.')
    } catch (caught) {
      error('Could not revoke link', apiErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!current.share_url) return
    const copiedOk = await copyToClipboard(current.share_url)
    if (copiedOk) {
      setCopied(true)
      success('Link copied', 'The secure share link is on your clipboard.')
      window.setTimeout(() => setCopied(false), 2200)
    } else {
      error('Copy failed', 'Select the link and copy it manually.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share document"
      description={current.name}
      size="md"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p className="text-[11.5px] leading-5 text-brand-900/70">
            Share links are read-only and expire automatically. Revoke a link at any time to cut off
            access instantly.
          </p>
        </div>

        {current.is_shared && current.share_url ? (
          <>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
                Secure link
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    readOnly
                    value={current.share_url}
                    onFocus={(event) => event.currentTarget.select()}
                    className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-[12px] text-slate-600 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  />
                </div>
                <Button
                  variant="outline"
                  leftIcon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  onClick={copy}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <p className="mt-2 text-[10.5px] text-muted">
                Expires {formatDateTime(current.share_expires_at)} · {current.view_count} view
                {current.view_count === 1 ? '' : 's'}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <a
                href={current.share_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open link
              </a>
              <Button
                variant="secondary"
                loading={loading}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                onClick={createLink}
              >
                Regenerate
              </Button>
              <Button
                variant="ghost"
                loading={loading}
                className="text-danger hover:bg-red-50 hover:text-danger"
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={revoke}
              >
                Revoke link
              </Button>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5">
              <span className="text-[11.5px] text-muted">New link lifetime</span>
              <Select
                options={expiryOptions}
                value={days}
                onChange={(event) => setDays(event.target.value)}
                aria-label="Share link lifetime"
                className="h-8 w-32 text-[11.5px]"
              />
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-line p-4">
              <p className="text-[12.5px] font-semibold text-ink">Create a read-only link</p>
              <p className="mt-1 text-[11.5px] leading-5 text-muted">
                Anyone with the link can preview and download this file until it expires. No E-Drive
                account is required.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Select
                  options={expiryOptions}
                  value={days}
                  onChange={(event) => setDays(event.target.value)}
                  aria-label="Share link lifetime"
                  className="sm:w-36"
                />
                <Button
                  className="flex-1"
                  loading={loading}
                  leftIcon={<Link2 className="h-4 w-4" />}
                  onClick={createLink}
                >
                  Create secure link
                </Button>
              </div>
            </div>
            <p className="text-[10.5px] leading-5 text-slate-400">
              Access is logged in your audit trail. You can revoke the link at any time from this
              document or from Settings → Privacy.
            </p>
          </>
        )}
      </div>
    </Modal>
  )
}
