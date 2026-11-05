import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  FileUp,
  Info,
  Loader2,
  LockKeyhole,
  Save,
  ShieldCheck,
  Sparkles,
  Tag,
  UploadCloud,
  X,
} from 'lucide-react'
import type { Document } from '../../types'
import { documentsApi } from '../../lib/endpoints'
import { apiErrorMessage, apiFieldErrors, type ValidationErrors } from '../../lib/api'
import { formatBytes, formatDate, titleCase } from '../../lib/format'
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  DOCUMENT_SUBCATEGORIES,
  MAX_UPLOAD_BYTES,
} from '../../lib/constants'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { FileIcon } from '../../components/ui/FileIcon'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Skeleton } from '../../components/ui/Spinner'
import { cn } from '../../lib/cn'

export function DocumentFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const { success } = useToast()
  const editing = Boolean(id)

  const [existing, setExisting] = useState<Document | null>(null)
  const [loading, setLoading] = useState(editing)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState(searchParams.get('category') ?? 'personal')
  const [subcategory, setSubcategory] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState('')
  const [status, setStatus] = useState<Document['status']>('active')
  const [issuedAt, setIssuedAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [issuer, setIssuer] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')

  useEffect(() => {
    if (!editing || !id) return
    let active = true

    documentsApi
      .get(id)
      .then((response) => {
        if (!active) return
        const document = response.data.data
        setExisting(document)
        setName(document.name)
        setCategory(document.category)
        setSubcategory(document.subcategory ?? '')
        setDescription(document.description ?? '')
        setTags(document.tags)
        setStatus(document.status)
        setIssuedAt(document.issued_at ?? '')
        setExpiresAt(document.expires_at ?? '')
        setIssuer(document.issuer ?? '')
        setDocumentNumber(document.document_number ?? '')
      })
      .catch((caught) => {
        if (active) setLoadError(apiErrorMessage(caught, 'This document could not be loaded.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [editing, id])

  const statusOptions = useMemo(() => {
    const options = [...DOCUMENT_STATUSES]
    if (existing && !options.some((option) => option.value === existing.status)) {
      options.unshift({ value: existing.status, label: titleCase(existing.status) })
    }
    return options
  }, [existing])

  const chooseFile = (candidate: File) => {
    setFieldErrors((current) => ({ ...current, file: [] }))
    const extension = candidate.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_UPLOAD_EXTENSIONS.includes(extension)) {
      setFormError(
        `Files of type .${extension || 'unknown'} are not supported. Use ${ALLOWED_UPLOAD_EXTENSIONS.join(', ')}.`,
      )
      return
    }
    if (candidate.size > MAX_UPLOAD_BYTES) {
      setFormError(`This file is ${formatBytes(candidate.size)}. The maximum upload size is 25 MB.`)
      return
    }
    setFormError(null)
    setFile(candidate)
    if (!name || name === existing?.name) {
      setName(candidate.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim())
    }
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) chooseFile(dropped)
  }

  const addTag = () => {
    const clean = tagDraft.trim().replace(/^#/, '')
    if (!clean) return
    if (clean.length > 30) {
      setFormError('Tags can be at most 30 characters.')
      return
    }
    if (tags.length >= 10) {
      setFormError('You can attach up to 10 tags per document.')
      return
    }
    if (!tags.includes(clean)) setTags((current) => [...current, clean])
    setTagDraft('')
  }

  const submit = async (event?: FormEvent, forcedStatus?: Document['status']) => {
    event?.preventDefault()
    setFormError(null)
    setFieldErrors({})

    const nextStatus = forcedStatus ?? status

    if (name.trim().length < 2) {
      setFormError('Give your document a name with at least 2 characters.')
      return
    }
    if (!editing && !file) {
      setFormError('Choose a file to upload before saving.')
      return
    }
    if (issuedAt && expiresAt && new Date(expiresAt) < new Date(issuedAt)) {
      setFormError('The expiry date cannot be earlier than the issue date.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        file: file ?? undefined,
        name: name.trim(),
        category,
        subcategory: subcategory || undefined,
        description: description.trim() || undefined,
        tags,
        status: nextStatus,
        issued_at: issuedAt || undefined,
        expires_at: expiresAt || undefined,
        issuer: issuer.trim() || undefined,
        document_number: documentNumber.trim() || undefined,
      }

      if (editing && id) {
        const response = await documentsApi.update(id, payload)
        success('Document updated', response.data.message)
      } else {
        const response = await documentsApi.create(payload)
        success('Document secured', response.data.message)
      }

      await refreshUser()
      const destination =
        category === 'certificate'
          ? '/certificates'
          : category === 'personal'
            ? '/personal-files'
            : '/documents'
      navigate(destination)
    } catch (caught) {
      setFieldErrors(apiFieldErrors(caught))
      setFormError(apiErrorMessage(caught, 'We could not save this document.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <DocumentFormSkeleton />

  if (loadError) {
    return (
      <Card className="mx-auto mt-10 max-w-lg text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-danger">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-base font-bold text-ink">Document unavailable</h2>
        <p className="mt-1.5 text-[12.5px] leading-6 text-muted">{loadError}</p>
        <Button className="mt-5" onClick={() => navigate('/documents')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to documents
        </Button>
      </Card>
    )
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
      <PageHeader
        crumbs={[
          { label: 'Documents', to: '/documents' },
          { label: editing ? 'Edit document' : 'New document' },
        ]}
        title={editing ? `Edit ${existing?.name ?? 'document'}` : 'Add a new document'}
        description={
          editing
            ? 'Update the details or replace the encrypted file in your vault.'
            : 'Upload a file, add its details and store it securely in your encrypted vault.'
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => navigate(-1)}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={saving}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {editing ? 'Save changes' : 'Save document'}
            </Button>
          </>
        }
      />

      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-[12px] font-medium text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Encrypted file"
              description={
                editing
                  ? 'Leave the file unchanged, or upload a replacement. Replacing deletes the previous copy.'
                  : 'Drag and drop a file or browse your device. Uploads are encrypted at rest.'
              }
            />

            {file ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3.5">
                <FileIcon extension={file.name.split('.').pop() ?? ''} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-ink">{file.name}</p>
                  <p className="mt-0.5 text-[10.5px] text-muted">
                    {formatBytes(file.size)} · ready to secure
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-danger"
                  aria-label="Remove selected file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                  'mt-4 rounded-2xl border-2 border-dashed px-5 py-8 text-center transition',
                  dragging
                    ? 'border-brand-400 bg-brand-50/70'
                    : 'border-slate-200 bg-slate-50/50 hover:border-brand-200 hover:bg-brand-50/30',
                )}
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-inset ring-brand-100">
                  <UploadCloud className="h-5 w-5" />
                </span>
                <p className="mt-3 text-[13px] font-semibold text-ink">
                  {editing ? 'Drop a replacement file here' : 'Drop your file here'}
                </p>
                <p className="mt-1 text-[11px] text-muted">PDF, images, Word, text or spreadsheets · up to 25 MB</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => fileInput.current?.click()}
                  leftIcon={<FileUp className="h-3.5 w-3.5" />}
                >
                  Browse files
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  accept={ALLOWED_UPLOAD_EXTENSIONS.map((extension) => `.${extension}`).join(',')}
                  className="sr-only"
                  onChange={(event) => {
                    const chosen = event.target.files?.[0]
                    if (chosen) chooseFile(chosen)
                    event.target.value = ''
                  }}
                />
              </div>
            )}

            {fieldErrors.file?.[0] ? (
              <p className="mt-2 text-[11px] font-medium text-danger">{fieldErrors.file[0]}</p>
            ) : null}

            {existing && !file ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-slate-50/60 p-3">
                <FileIcon extension={existing.extension} category={existing.category} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-semibold text-ink">{existing.original_name}</p>
                  <p className="text-[10px] text-muted">
                    Current file · {existing.human_size} · {existing.extension.toUpperCase()}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  Sealed
                </span>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader title="Document details" description="These details power search, filters and reminders." />
            <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Document name"
                  placeholder="e.g. Passport renewal 2026"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  error={fieldErrors.name?.[0]}
                  required
                />
              </div>
              <Select
                label="Category"
                options={DOCUMENT_CATEGORIES}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                error={fieldErrors.category?.[0]}
              />
              <Select
                label="Subcategory (optional)"
                options={[{ value: '', label: 'No subcategory' }, ...DOCUMENT_SUBCATEGORIES]}
                value={subcategory}
                onChange={(event) => setSubcategory(event.target.value)}
                error={fieldErrors.subcategory?.[0]}
              />
              <Select
                label="Status"
                options={statusOptions}
                value={status}
                onChange={(event) => setStatus(event.target.value as Document['status'])}
                error={fieldErrors.status?.[0]}
              />
              <Input
                label="Document number (optional)"
                placeholder="e.g. US-2026-00184"
                value={documentNumber}
                onChange={(event) => setDocumentNumber(event.target.value)}
                error={fieldErrors.document_number?.[0]}
              />
              <Input
                label="Issuer (optional)"
                placeholder="e.g. California DMV"
                value={issuer}
                onChange={(event) => setIssuer(event.target.value)}
                error={fieldErrors.issuer?.[0]}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Issued"
                  type="date"
                  value={issuedAt}
                  onChange={(event) => setIssuedAt(event.target.value)}
                  error={fieldErrors.issued_at?.[0]}
                />
                <Input
                  label="Expires"
                  type="date"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  error={fieldErrors.expires_at?.[0]}
                />
              </div>
              <div className="sm:col-span-2">
                <Textarea
                  label="Description (optional)"
                  placeholder="Add context that will help you find this document later."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  error={fieldErrors.description?.[0]}
                  rows={3}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
                  Tags (optional)
                </label>
                <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 py-2 shadow-[0_1px_1px_rgba(15,23,42,0.03)] focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-brand-700"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setTags((current) => current.filter((item) => item !== tag))}
                        aria-label={`Remove tag ${tag}`}
                        className="text-brand-400 transition hover:text-brand-700"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ',') {
                        event.preventDefault()
                        addTag()
                      } else if (event.key === 'Backspace' && !tagDraft && tags.length > 0) {
                        setTags((current) => current.slice(0, -1))
                      }
                    }}
                    onBlur={addTag}
                    placeholder={tags.length === 0 ? 'Type a tag and press Enter' : 'Add another tag…'}
                    className="h-6 min-w-[10rem] flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-slate-400"
                    aria-label="Add tag"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Up to 10 tags, 30 characters each. Press Enter or comma to add.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Cancel
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              {status !== 'draft' && (
                <Button
                  type="button"
                  variant="secondary"
                  loading={saving}
                  onClick={() => void submit(undefined, 'draft')}
                  leftIcon={<FileCheck2 className="h-4 w-4" />}
                >
                  Save as draft
                </Button>
              )}
              <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>
                {editing ? 'Save changes' : 'Save document'}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-brand-50/80 via-white to-white">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                <LockKeyhole className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-[13px] font-bold text-ink">Zero-knowledge storage</p>
                <p className="mt-1 text-[11.5px] leading-5 text-muted">
                  Files are encrypted with AES-256-GCM before they are written to disk. Only your
                  account can decrypt them.
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {[
                'AES-256-GCM encryption at rest',
                'SHA-256 integrity checksum',
                'Authenticated previews and downloads',
                'Automatic metadata audit trail',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-[11.5px] text-slate-600">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Helpful tips" />
            <div className="mt-3 space-y-3">
              <Tip
                icon={Sparkles}
                title="Descriptive names"
                text="Include the year or issuer so documents are easy to find later."
              />
              <Tip
                icon={CalendarDays}
                title="Add an expiry date"
                text="We surface documents expiring within 30 days on your dashboard."
              />
              <Tip
                icon={Tag}
                title="Use tags"
                text="Tags make it fast to group related records across categories."
              />
              <Tip
                icon={Info}
                title="Drafts are private"
                text="A draft is stored securely but excluded from verified counts."
              />
            </div>
          </Card>

          {editing && existing ? (
            <Card>
              <CardHeader title="File information" />
              <dl className="mt-3 space-y-2.5">
                <InfoRow label="Original file" value={existing.original_name} />
                <InfoRow label="Type" value={existing.extension.toUpperCase()} />
                <InfoRow label="Size" value={existing.human_size} />
                <InfoRow label="Added" value={formatDate(existing.created_at)} />
                <InfoRow label="Last modified" value={formatDate(existing.last_modified_at)} />
              </dl>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[10.5px] text-slate-500">
                <LockKeyhole className="h-3 w-3 shrink-0" />
                The stored file cannot be viewed by E-Drive staff.
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader title="What happens next" />
              <ol className="mt-3 space-y-3">
                {[
                  'Your file is encrypted and stored in your private vault.',
                  'Metadata is indexed so search and filters work instantly.',
                  'A confirmation is added to your activity log.',
                ].map((step, index) => (
                  <li key={step} className="flex items-start gap-2.5 text-[11.5px] leading-5 text-slate-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <Link
                to="/settings/security"
                className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand-600 hover:text-brand-700"
              >
                Review security settings
              </Link>
            </Card>
          )}
        </div>
      </div>
    </form>
  )
}

function Tip({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Sparkles
  title: string
  text: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-3 w-3" />
      </span>
      <div>
        <p className="text-[11.5px] font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-[10.5px] leading-5 text-muted">{text}</p>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="max-w-[62%] truncate text-right text-[11px] font-semibold text-slate-700">{value}</dd>
    </div>
  )
}

function DocumentFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

export function DocumentFormLoading() {
  return (
    <div className="flex min-h-96 items-center justify-center">
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
        Loading document…
      </div>
    </div>
  )
}
