import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Clock3,
  Download,
  ExternalLink,
  FileQuestion,
  Link2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import type { ShareDocument } from '../../types'
import { shareApi } from '../../lib/endpoints'
import { apiErrorMessage, publicFileUrl } from '../../lib/api'
import { daysUntil, formatBytes, formatDate, formatDateTime, titleCase } from '../../lib/format'
import { Logo } from '../../components/layout/Logo'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { FileIcon } from '../../components/ui/FileIcon'
import { PageLoader } from '../../components/ui/Spinner'

type Failure = {
  title: string
  message: string
  tone: 'invalid' | 'expired'
}

export function PublicSharePage() {
  const { token = '' } = useParams()
  const [document, setDocument] = useState<ShareDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState<Failure | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setFailure(null)

    if (!token) {
      setFailure({
        title: 'Share link missing',
        message: 'This address does not include a share token. Ask the owner for a new link.',
        tone: 'invalid',
      })
      setLoading(false)
      return () => {
        active = false
      }
    }

    shareApi
      .get(token)
      .then((response) => {
        if (active) setDocument(response.data.document)
      })
      .catch((caught) => {
        if (!active) return
        const status = axios.isAxiosError(caught) ? caught.response?.status : undefined
        if (status === 410) {
          setFailure({
            title: 'This link has expired',
            message:
              'The owner set an expiry date for this share. Ask them to create a new link if you still need access.',
            tone: 'expired',
          })
        } else if (status === 404) {
          setFailure({
            title: 'This link is no longer available',
            message:
              'The share may have been revoked or the document moved to the owner’s trash. Ask the owner for a new link.',
            tone: 'invalid',
          })
        } else {
          setFailure({
            title: 'We could not open this share',
            message: apiErrorMessage(caught, 'Check your connection and try again.'),
            tone: 'invalid',
          })
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  const preview = useMemo(() => {
    if (!document) return { kind: 'none' as const, url: '' }
    const url = publicFileUrl(document.file_url)
    const mime = document.mime_type
    if (mime.startsWith('image/')) return { kind: 'image' as const, url }
    if (mime === 'application/pdf') return { kind: 'pdf' as const, url }
    if (mime.startsWith('text/')) return { kind: 'text' as const, url }
    return { kind: 'none' as const, url }
  }, [document])

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo to="/signin" />
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 sm:inline-flex">
              <LockKeyhole className="h-3 w-3" />
              Secure share
            </span>
            <Link
              to="/signin"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Open E-Drive
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {loading ? (
          <PageLoader label="Opening the shared document…" />
        ) : failure ? (
          <FailureState failure={failure} />
        ) : document ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <FileIcon extension={document.extension} category={document.category} size="lg" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="break-words text-[24px] font-bold leading-tight tracking-[-0.035em] text-ink">
                      {document.name}
                    </h1>
                    <Badge tone="success" dot>
                      Shared securely
                    </Badge>
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <UserRound className="h-3 w-3" />
                      Shared by {document.owner ?? 'the vault owner'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />
                      {formatDate(document.shared_at)}
                    </span>
                    <span>{formatBytes(document.size)}</span>
                  </p>
                </div>
              </div>

              <a
                href={publicFileUrl(document.download_url)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-[13px] font-semibold text-white shadow-[0_8px_18px_-10px_rgba(37,99,235,0.75)] transition hover:bg-brand-700"
              >
                <Download className="h-4 w-4" />
                Download file
              </a>
            </div>

            {document.share_expires_at && (
              <ShareExpiryNotice expiresAt={document.share_expires_at} />
            )}

            <Card padded={false} className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-slate-50/70 px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-600">
                  <FileQuestion className="h-3.5 w-3.5 text-slate-400" />
                  Document preview
                </span>
                <span className="rounded-md bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400 ring-1 ring-inset ring-line">
                  {titleCase(document.extension)}
                </span>
              </div>

              {preview.kind === 'image' ? (
                <div className="flex max-h-[620px] items-center justify-center bg-slate-100/60 p-4">
                  <img
                    src={preview.url}
                    alt={document.name}
                    className="max-h-[580px] w-auto max-w-full rounded-lg object-contain shadow-sm"
                  />
                </div>
              ) : preview.kind === 'pdf' || preview.kind === 'text' ? (
                <iframe
                  src={preview.url}
                  title={`Preview of ${document.name}`}
                  className="h-[620px] w-full border-0 bg-white"
                />
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <FileIcon extension={document.extension} category={document.category} size="lg" />
                  <h2 className="mt-4 text-sm font-bold text-ink">Preview not available</h2>
                  <p className="mt-1.5 max-w-sm text-[12px] leading-6 text-muted">
                    This file type cannot be displayed in the browser. Download it to open with the
                    appropriate application.
                  </p>
                  <a
                    href={publicFileUrl(document.download_url)}
                    className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[11.5px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download {document.original_name}
                  </a>
                </div>
              )}
            </Card>

            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_300px]">
              <Card>
                <h2 className="text-[13px] font-bold text-ink">About this document</h2>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Detail label="Category" value={titleCase(document.category)} />
                  <Detail label="File size" value={formatBytes(document.size)} />
                  <Detail label="Owner" value={document.owner ?? 'Vault owner'} />
                  <Detail label="Shared on" value={formatDateTime(document.shared_at)} />
                  {document.issuer && <Detail label="Issuer" value={document.issuer} />}
                  {document.expires_at && (
                    <Detail label="Document expires" value={formatDate(document.expires_at)} />
                  )}
                </dl>
                {document.description && (
                  <div className="mt-3 border-t border-line pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      Description
                    </p>
                    <p className="mt-1 text-[12px] leading-6 text-slate-600">{document.description}</p>
                  </div>
                )}
              </Card>

              <Card className="border-brand-100 bg-brand-50/40">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <h2 className="text-[12.5px] font-bold text-ink">Protected by E-Drive</h2>
                </div>
                <p className="mt-2.5 text-[11px] leading-5 text-slate-600">
                  This document was shared through an encrypted E-Drive vault. The owner can revoke
                  access at any time, and every view is recorded.
                </p>
                <div className="mt-3 space-y-1.5 text-[10.5px] text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <Link2 className="h-3 w-3" />
                    Token-protected link
                  </p>
                  <p className="flex items-center gap-1.5">
                    <LockKeyhole className="h-3 w-3" />
                    TLS 1.3 · AES-256 at rest
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock3 className="h-3 w-3" />
                    {document.share_expires_at
                      ? `Expires ${formatDate(document.share_expires_at)}`
                      : 'No expiry set'}
                  </p>
                </div>
                <Link
                  to="/signup"
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white py-2 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-50"
                >
                  Create your own secure vault
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Card>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-2 px-4 py-5 text-[10.5px] text-slate-400 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} E-Drive Cloud. Encrypted document vault.</p>
          <div className="flex items-center gap-3">
            <Link to="/terms" className="font-medium transition hover:text-brand-600">
              Terms
            </Link>
            <Link to="/privacy" className="font-medium transition hover:text-brand-600">
              Privacy
            </Link>
            <span className="inline-flex items-center gap-1">
              <LockKeyhole className="h-3 w-3" />
              Secure connection
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ShareExpiryNotice({ expiresAt }: { expiresAt: string }) {
  const days = daysUntil(expiresAt)
  const urgent = days !== null && days <= 2
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 ${
        urgent ? 'border-amber-100 bg-amber-50' : 'border-line bg-white'
      }`}
    >
      {urgent ? (
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
      ) : (
        <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
      )}
      <p className={`text-[11px] leading-5 ${urgent ? 'text-amber-800' : 'text-slate-500'}`}>
        {urgent
          ? `This link expires ${formatDate(expiresAt)}. Download the file before then.`
          : `The owner set this link to expire on ${formatDate(expiresAt)}.`}
      </p>
    </div>
  )
}

function FailureState({ failure }: { failure: Failure }) {
  return (
    <Card className="mx-auto mt-6 max-w-md text-center">
      <div
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
          failure.tone === 'expired' ? 'bg-amber-50 text-warning' : 'bg-red-50 text-danger'
        }`}
      >
        {failure.tone === 'expired' ? (
          <Clock3 className="h-6 w-6" />
        ) : (
          <AlertTriangle className="h-6 w-6" />
        )}
      </div>
      <h1 className="mt-4 text-lg font-bold tracking-[-0.02em] text-ink">{failure.title}</h1>
      <p className="mt-2 text-[12.5px] leading-6 text-muted">{failure.message}</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          to="/signin"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-[13px] font-semibold text-white shadow-[0_8px_18px_-10px_rgba(37,99,235,0.75)] transition hover:bg-brand-700"
        >
          <LockKeyhole className="h-4 w-4" />
          Sign in to E-Drive
        </Link>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
      <p className="mt-4 text-[10.5px] text-slate-400">
        Share links are unique and can be revoked by the document owner at any time.
      </p>
    </Card>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</dt>
      <dd className="mt-0.5 truncate text-[12px] font-semibold text-ink">{value}</dd>
    </div>
  )
}
