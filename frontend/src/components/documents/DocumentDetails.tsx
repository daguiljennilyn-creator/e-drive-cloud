import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileQuestion,
  Fingerprint,
  KeyRound,
  Link2,
  Pencil,
  ShieldCheck,
  Star,
  Trash2,
  Undo2,
  XCircle,
} from 'lucide-react'
import type { Document } from '../../types'
import { documentsApi } from '../../lib/endpoints'
import { apiErrorMessage, downloadFile, fetchBlobUrl } from '../../lib/api'
import { formatDate, formatDateTime, daysUntil } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import { Badge, StatusBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { FileIcon } from '../ui/FileIcon'
import { Modal } from '../ui/Modal'
import { Spinner } from '../ui/Spinner'
import { ShareDialog } from './ShareDialog'

const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'])

export function DocumentDetails({
  document,
  open,
  onClose,
  onUpdated,
  onDeleted,
  onRestored,
  trashed = false,
}: {
  document: Document | null
  open: boolean
  onClose: () => void
  onUpdated?: (document: Document) => void
  onDeleted?: (id: number) => void
  onRestored?: (document: Document) => void
  trashed?: boolean
}) {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewState, setPreviewState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [shareOpen, setShareOpen] = useState(false)
  const [confirmingTrash, setConfirmingTrash] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [working, setWorking] = useState(false)

  const canPreview =
    document !== null &&
    document.file_exists &&
    (imageExtensions.has(document.extension) || document.extension === 'pdf' || document.extension === 'txt')

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null

    setPreviewUrl(null)
    setPreviewState('idle')

    if (open && document && canPreview) {
      setPreviewState('loading')
      fetchBlobUrl(document.preview_url)
        .then((url) => {
          if (!active) {
            URL.revokeObjectURL(url)
            return
          }
          objectUrl = url
          setPreviewUrl(url)
          setPreviewState('ready')
        })
        .catch(() => {
          if (active) setPreviewState('error')
        })
    }

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [open, document, canPreview])

  if (!document) return null

  const patchDocument = (next: Document) => onUpdated?.(next)

  const toggleFavorite = async () => {
    setWorking(true)
    try {
      const response = await documentsApi.favorite(document.id)
      patchDocument(response.data.document)
      success(
        response.data.document.is_favorite ? 'Added to favorites' : 'Removed from favorites',
        document.name,
      )
    } catch (caught) {
      error('Could not update favorite', apiErrorMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  const verify = async () => {
    setWorking(true)
    try {
      const response = await documentsApi.verify(document.id)
      patchDocument(response.data.document)
      success('Document verified', `${document.name} now carries a cryptographic seal.`)
    } catch (caught) {
      error('Verification failed', apiErrorMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  const download = async () => {
    try {
      await downloadFile(document.download_url, document.original_name)
      success('Download started', document.original_name)
    } catch (caught) {
      error('Download failed', apiErrorMessage(caught))
    }
  }

  const moveToTrash = async () => {
    setWorking(true)
    try {
      await documentsApi.remove(document.id)
      success('Moved to trash', `${document.name} can be restored for 30 days.`)
      setConfirmingTrash(false)
      onDeleted?.(document.id)
      onClose()
    } catch (caught) {
      error('Could not move to trash', apiErrorMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  const restore = async () => {
    setWorking(true)
    try {
      const response = await documentsApi.restore(document.id)
      success('Document restored', `${document.name} is back in your vault.`)
      onRestored?.(response.data.document)
      onClose()
    } catch (caught) {
      error('Could not restore document', apiErrorMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  const deleteForever = async () => {
    setWorking(true)
    try {
      await documentsApi.forceDelete(document.id)
      success('Permanently deleted', `${document.name} has been removed.`)
      setConfirmingDelete(false)
      onDeleted?.(document.id)
      onClose()
    } catch (caught) {
      error('Could not delete document', apiErrorMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  const expiryDays = daysUntil(document.expires_at)

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="xl"
        title={document.name}
        description={`${document.category_label} · Added ${formatDate(document.created_at)}`}
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={download}
                leftIcon={<Download className="h-3.5 w-3.5" />}
              >
                Download
              </Button>
              {!trashed && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/documents/${document.id}/edit`)}
                    leftIcon={<Pencil className="h-3.5 w-3.5" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShareOpen(true)}
                    leftIcon={<Link2 className="h-3.5 w-3.5" />}
                  >
                    Share
                  </Button>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {trashed ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={working}
                    onClick={restore}
                    leftIcon={<Undo2 className="h-3.5 w-3.5" />}
                  >
                    Restore
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmingDelete(true)}
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  >
                    Delete forever
                  </Button>
                </>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmingTrash(true)}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Move to trash
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <div className="flex min-h-[280px] items-center justify-center overflow-hidden rounded-2xl border border-line bg-slate-50/80">
              {!document.file_exists ? (
                <div className="px-6 py-12 text-center">
                  <FileQuestion className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-[12.5px] font-semibold text-slate-600">File unavailable</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    The stored file could not be found on this server.
                  </p>
                </div>
              ) : previewState === 'loading' ? (
                <Spinner label="Decrypting preview…" />
              ) : previewState === 'error' ? (
                <div className="px-6 py-12 text-center">
                  <FileQuestion className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-[12.5px] font-semibold text-slate-600">Preview unavailable</p>
                  <p className="mt-1 text-[11px] text-slate-400">Download the file to open it locally.</p>
                </div>
              ) : previewUrl && imageExtensions.has(document.extension) ? (
                <img
                  src={previewUrl}
                  alt={document.name}
                  className="max-h-[420px] w-full object-contain"
                />
              ) : previewUrl && (document.extension === 'pdf' || document.extension === 'txt') ? (
                <iframe
                  title={`Preview of ${document.name}`}
                  src={previewUrl}
                  className="h-[420px] w-full border-0 bg-white"
                />
              ) : (
                <div className="px-6 py-14 text-center">
                  <FileIcon extension={document.extension} category={document.category} size="lg" className="mx-auto" />
                  <p className="mt-4 text-[12.5px] font-semibold text-slate-600">
                    In-app preview isn&apos;t available for .{document.extension} files
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">Download the file to open it locally.</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={download}
                    leftIcon={<Download className="h-3.5 w-3.5" />}
                  >
                    Download {document.original_name}
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-3.5 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <FileIcon extension={document.extension} category={document.category} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[11.5px] font-semibold text-ink">{document.original_name}</p>
                  <p className="text-[10px] text-muted">
                    {document.human_size} · {document.extension.toUpperCase()}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                <ShieldCheck className="h-2.5 w-2.5" />
                AES-256
              </span>
            </div>

            {trashed && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5">
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <p className="text-[11px] leading-5 text-amber-800">
                  This item is in the trash. It still counts toward your storage until permanently
                  deleted.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={document.status} isExpired={document.is_expired} />
              {document.is_shared && (
                <Badge tone="brand" dot>
                  Shared
                </Badge>
              )}
              {document.is_favorite && (
                <Badge tone="warning">Favorite</Badge>
              )}
            </div>

            {document.description && (
              <p className="text-[12.5px] leading-6 text-slate-600">{document.description}</p>
            )}

            <dl className="divide-y divide-line rounded-xl border border-line">
              <DetailRow label="Category" value={document.category_label} />
              <DetailRow label="Issuer" value={document.issuer ?? '—'} />
              <DetailRow label="Document number" value={document.document_number ?? '—'} />
              <DetailRow label="Issued" value={formatDate(document.issued_at)} />
              <DetailRow
                label="Expires"
                value={
                  document.expires_at
                    ? `${formatDate(document.expires_at)}${
                        expiryDays !== null && expiryDays >= 0 ? ` · ${expiryDays}d left` : ''
                      }`
                    : 'No expiry'
                }
                tone={
                  document.is_expired
                    ? 'danger'
                    : expiryDays !== null && expiryDays <= 30
                      ? 'warning'
                      : 'default'
                }
              />
              <DetailRow label="File size" value={`${document.human_size}`} />
              <DetailRow label="Last modified" value={formatDateTime(document.last_modified_at)} />
            </dl>

            {document.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {document.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-brand-100 bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-line bg-slate-50/60 p-3.5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                <Fingerprint className="h-3 w-3" />
                Security &amp; cryptography
              </p>
              <dl className="mt-2.5 space-y-2">
                <SecurityRow label="Encryption" value="AES-256-GCM" />
                <SecurityRow label="Key derivation" value="Argon2id" />
                <SecurityRow
                  label="Checksum"
                  value={document.checksum ? `${document.checksum.slice(0, 12)}…` : '—'}
                />
                <SecurityRow label="Views" value={`${document.view_count}`} />
                <SecurityRow label="Last opened" value={formatDateTime(document.last_accessed_at)} />
              </dl>
            </div>

            {!trashed && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={working}
                  onClick={toggleFavorite}
                  leftIcon={
                    <Star
                      className={`h-3.5 w-3.5 ${document.is_favorite ? 'fill-amber-400 text-amber-500' : ''}`}
                    />
                  }
                >
                  {document.is_favorite ? 'Unfavorite' : 'Favorite'}
                </Button>
                {document.status !== 'verified' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={working}
                    onClick={verify}
                    leftIcon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  >
                    Verify seal
                  </Button>
                )}
                {document.is_shared && document.share_url && (
                  <a
                    href={document.share_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Public link
                  </a>
                )}
                <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[11.5px] font-medium text-slate-500">
                  <KeyRound className="h-3.5 w-3.5" />
                  Zero-knowledge
                </span>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ShareDialog
        document={document}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onUpdated={patchDocument}
      />

      <ConfirmDialog
        open={confirmingTrash}
        onClose={() => setConfirmingTrash(false)}
        onConfirm={moveToTrash}
        loading={working}
        title="Move to trash?"
        description={`${document.name} will be moved to the trash and can be restored for 30 days.`}
        confirmLabel="Move to trash"
      />

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={deleteForever}
        loading={working}
        title="Delete forever?"
        description={`${document.name} and its stored file will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete forever"
      />
    </>
  )
}

function DetailRow({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'warning' | 'danger'
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-2">
      <dt className="text-[11px] font-medium text-muted">{label}</dt>
      <dd
        className={`max-w-[62%] truncate text-right text-[11.5px] font-semibold ${
          tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-amber-600' : 'text-ink'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function SecurityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[10.5px] text-slate-500">{label}</dt>
      <dd className="text-[10.5px] font-semibold text-slate-700">{value}</dd>
    </div>
  )
}
