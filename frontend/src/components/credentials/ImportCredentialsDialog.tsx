import { useEffect, useRef, useState } from 'react'
import { FileJson, Upload } from 'lucide-react'
import type { CredentialPayload } from '../../lib/endpoints'
import { credentialsApi } from '../../lib/endpoints'
import { apiErrorMessage } from '../../lib/api'
import { CREDENTIAL_TYPES } from '../../lib/constants'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

const sample = `[
  {
    "name": "Google Workspace",
    "type": "password",
    "identifier": "sarah.j@example.com",
    "secret": "replace-with-real-secret",
    "url": "https://workspace.google.com"
  }
]`

const allowedTypes = CREDENTIAL_TYPES.map((item) => item.value)

export function ImportCredentialsDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean
  onClose: () => void
  onImported: () => void
}) {
  const { success, error } = useToast()
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [problems, setProblems] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setText('')
    setFileName(null)
    setProblems([])
  }, [open])

  const readFile = async (file: File) => {
    setProblems([])
    if (file.size > 512 * 1024) {
      setProblems(['The file is larger than 512 KB. Import fewer credentials at a time.'])
      return
    }
    try {
      const content = await file.text()
      setText(content)
      setFileName(file.name)
    } catch {
      setProblems(['That file could not be read. Choose a UTF-8 JSON file.'])
    }
  }

  const parse = (): CredentialPayload[] | null => {
    const found: string[] = []
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      setProblems(['The pasted text is not valid JSON.'])
      return null
    }

    const raw = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { credentials?: unknown }).credentials)
        ? (parsed as { credentials: unknown[] }).credentials
        : null

    if (!raw) {
      setProblems(['Expected a JSON array of credentials, or an object with a "credentials" array.'])
      return null
    }
    if (raw.length === 0) {
      setProblems(['The JSON array is empty.'])
      return null
    }
    if (raw.length > 100) {
      setProblems(['Import at most 100 credentials at a time.'])
      return null
    }

    const cleaned: CredentialPayload[] = []
    raw.forEach((item, index) => {
      if (typeof item !== 'object' || item === null) {
        found.push(`Item ${index + 1} is not an object.`)
        return
      }
      const record = item as Record<string, unknown>
      const name = typeof record.name === 'string' ? record.name.trim() : ''
      const type = typeof record.type === 'string' ? record.type : ''
      if (name.length < 2) found.push(`Item ${index + 1} needs a name of at least 2 characters.`)
      if (!allowedTypes.includes(type)) {
        found.push(`Item ${index + 1} has an unsupported type "${type}".`)
      }
      cleaned.push({
        name,
        type,
        identifier: typeof record.identifier === 'string' ? record.identifier : undefined,
        secret: typeof record.secret === 'string' ? record.secret : undefined,
        url: typeof record.url === 'string' ? record.url : undefined,
        notes: typeof record.notes === 'string' ? record.notes : undefined,
      })
    })

    setProblems(found)
    return found.length > 0 ? null : cleaned
  }

  const submit = async () => {
    const credentials = parse()
    if (!credentials) return
    setSaving(true)
    try {
      const response = await credentialsApi.import(credentials)
      success('Credentials imported', response.data.message)
      onImported()
      onClose()
    } catch (caught) {
      error('Import failed', apiErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import credentials"
      description="Add a JSON backup exported from another password manager."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            loading={saving}
            disabled={!text.trim()}
            leftIcon={<Upload className="h-4 w-4" />}
          >
            Import vault
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/70 px-3.5 py-3">
          <FileJson className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[11.5px] leading-5 text-amber-900/80">
            Only import files you trust. Plain-text secrets are encrypted at rest by the E-Drive API, and
            this browser does not keep a copy.
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label htmlFor="import-json" className="text-[12px] font-semibold text-slate-700">
              Credentials JSON
            </label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-600 transition hover:text-brand-700"
            >
              <Upload className="h-3 w-3" />
              {fileName ? fileName : 'Choose file'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void readFile(file)
                event.target.value = ''
              }}
            />
          </div>
          <textarea
            id="import-json"
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setFileName(null)
              setProblems([])
            }}
            rows={10}
            spellCheck={false}
            placeholder={sample}
            className="w-full resize-y rounded-xl border border-line bg-slate-50/50 p-3.5 font-mono text-[11.5px] leading-5 text-ink outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
          />
        </div>

        <details className="rounded-xl border border-line bg-white px-3.5 py-3">
          <summary className="cursor-pointer text-[11.5px] font-semibold text-slate-700">
            Accepted format
          </summary>
          <pre className="scrollbar-thin mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-[10.5px] leading-5 text-slate-600">
            {sample}
          </pre>
          <p className="mt-2 text-[10.5px] leading-5 text-muted">
            Supported types: {allowedTypes.join(', ')}. Up to 100 credentials per import.
          </p>
        </details>

        {problems.length > 0 && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3">
            <p className="text-[11.5px] font-semibold text-red-800">Fix these before importing</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] leading-5 text-red-700/90">
              {problems.slice(0, 5).map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}
