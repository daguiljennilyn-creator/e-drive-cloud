import { useEffect, useState } from 'react'
import { Check, Copy, RefreshCw, ShieldCheck } from 'lucide-react'
import type { Credential } from '../../types'
import { credentialsApi } from '../../lib/endpoints'
import { apiErrorMessage } from '../../lib/api'
import { copyToClipboard } from '../../lib/clipboard'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { generateSecret } from './CredentialFormDialog'

export function RotateCredentialDialog({
  credential,
  open,
  onClose,
  onRotated,
}: {
  credential: Credential | null
  open: boolean
  onClose: () => void
  onRotated: (credential: Credential) => void
}) {
  const { success, error } = useToast()
  const [secret, setSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    setSecret(generateSecret())
    setCopied(false)
  }, [open, credential])

  if (!credential) return null

  const rotate = async () => {
    setSaving(true)
    try {
      const response = await credentialsApi.rotate(credential.id, secret.trim() || undefined)
      success('Secret rotated', `${credential.name} now has a fresh secret and is marked strong.`)
      onRotated(response.data.credential)
      onClose()
    } catch (caught) {
      error('Could not rotate secret', apiErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const copy = async () => {
    const ok = await copyToClipboard(secret)
    if (ok) {
      setCopied(true)
      success('New secret copied', 'Store it before closing this dialog.')
      window.setTimeout(() => setCopied(false), 2000)
    } else {
      error('Copy failed', 'Select the value and copy it manually.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rotate secret"
      description={`${credential.name} · Last rotated ${credential.last_rotated_human ?? 'never'}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => void rotate()}
            loading={saving}
            disabled={!secret.trim()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Rotate secret
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p className="text-[11.5px] leading-5 text-brand-900/70">
            Rotating marks the credential strong and resets the rotation clock. Save the new secret in
            the account before you close this dialog.
          </p>
        </div>

        <div>
          <label htmlFor="rotated-secret" className="mb-1.5 block text-[12px] font-semibold text-slate-700">
            New secret
          </label>
          <div className="flex gap-2">
            <Input
              id="rotated-secret"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              autoComplete="off"
              className="font-mono"
            />
            <Button
              variant="secondary"
              className="h-10 shrink-0"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => setSecret(generateSecret())}
            >
              Regenerate
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => void copy()}
              aria-label="Copy new secret"
              title={copied ? 'Copied' : 'Copy new secret'}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Generated locally with the Web Crypto API. You can also paste a secret from your provider.
          </p>
        </div>
      </div>
    </Modal>
  )
}
