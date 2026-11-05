import { useEffect, useState } from 'react'
import { RefreshCw, ShieldCheck } from 'lucide-react'
import type { Credential, CredentialHealth } from '../../types'
import { credentialsApi, type CredentialPayload } from '../../lib/endpoints'
import { apiErrorMessage, apiFieldErrors, type ValidationErrors } from '../../lib/api'
import { CREDENTIAL_HEALTH, CREDENTIAL_TYPES } from '../../lib/constants'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { Input, Select, Textarea } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Toggle } from '../ui/Toggle'

export function generateSecret(length = 24): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+'
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('')
}

export function CredentialFormDialog({
  open,
  credential,
  onClose,
  onSaved,
}: {
  open: boolean
  credential: Credential | null
  onClose: () => void
  onSaved: (credential: Credential) => void
}) {
  const { success, error } = useToast()
  const [name, setName] = useState('')
  const [type, setType] = useState('password')
  const [identifier, setIdentifier] = useState('')
  const [secret, setSecret] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [health, setHealth] = useState<CredentialHealth>('strong')
  const [twoFactor, setTwoFactor] = useState(false)
  const [favorite, setFavorite] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(credential?.name ?? '')
    setType(credential?.type ?? 'password')
    setIdentifier(credential?.identifier ?? '')
    setSecret('')
    setUrl(credential?.url ?? '')
    setNotes(credential?.notes ?? '')
    setHealth(credential?.health ?? 'strong')
    setTwoFactor(credential?.two_factor_enabled ?? false)
    setFavorite(credential?.is_favorite ?? false)
    setExpiresAt(credential?.expires_at ?? '')
    setErrors({})
  }, [open, credential])

  const submit = async () => {
    setSaving(true)
    setErrors({})
    const payload: CredentialPayload = {
      name: name.trim(),
      type,
      identifier: identifier.trim() || undefined,
      secret: secret || undefined,
      url: url.trim() || undefined,
      notes: notes.trim() || undefined,
      health,
      two_factor_enabled: twoFactor,
      is_favorite: favorite,
      expires_at: expiresAt || undefined,
    }

    try {
      const response = credential
        ? await credentialsApi.update(credential.id, payload)
        : await credentialsApi.create(payload)
      success(
        credential ? 'Credential updated' : 'Credential encrypted & saved',
        `${response.data.credential.name} is protected in your vault.`,
      )
      onSaved(response.data.credential)
      onClose()
    } catch (caught) {
      setErrors(apiFieldErrors(caught))
      error(credential ? 'Could not update credential' : 'Could not add credential', apiErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={credential ? 'Edit credential' : 'Add credential'}
      description={
        credential
          ? 'Update the details stored for this credential.'
          : 'Secrets are encrypted before they reach the database.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={saving} disabled={!name.trim()}>
            {credential ? 'Save changes' : 'Save credential'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p className="text-[11.5px] leading-5 text-brand-900/70">
            E-Drive never exposes stored secrets in list views. Reveal is an explicit, audited action.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Google Workspace"
            error={errors.name?.[0]}
            maxLength={120}
            autoFocus
          />
          <Select
            label="Type"
            options={CREDENTIAL_TYPES}
            value={type}
            onChange={(event) => setType(event.target.value)}
            error={errors.type?.[0]}
          />
        </div>

        <Input
          label="Username or identifier"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="sarah.j@example.com"
          error={errors.identifier?.[0]}
          hint="Shown masked in the vault list."
        />

        <div>
          <label htmlFor="credential-secret" className="mb-1.5 block text-[12px] font-semibold text-slate-700">
            {credential ? 'New secret' : 'Secret'}
          </label>
          <div className="flex gap-2">
            <Input
              id="credential-secret"
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder={credential ? 'Leave blank to keep the current secret' : 'Password, key or token'}
              error={errors.secret?.[0]}
              autoComplete="new-password"
            />
            <Button
              variant="secondary"
              className="h-10 shrink-0"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => setSecret(generateSecret())}
            >
              Generate
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {credential
              ? 'Only enter a value when you want to replace the stored secret.'
              : 'Generate a strong, unique secret instead of reusing another password.'}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Website URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://workspace.google.com"
            error={errors.url?.[0]}
            type="url"
          />
          <Input
            label="Expires on"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            type="date"
            error={errors.expires_at?.[0]}
            hint="Optional. Helps surface credentials that need attention."
          />
        </div>

        <Select
          label="Health"
          options={CREDENTIAL_HEALTH}
          value={health}
          onChange={(event) => setHealth(event.target.value as CredentialHealth)}
          error={errors.health?.[0]}
          hint="Mark keys that are weak or due for rotation."
        />

        <Textarea
          label="Notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Recovery hints, account owner, or rotation instructions."
          error={errors.notes?.[0]}
          maxLength={2000}
          rows={3}
        />

        <div className="space-y-3 rounded-xl border border-line bg-slate-50/60 p-3.5">
          <Toggle
            checked={twoFactor}
            onChange={setTwoFactor}
            label="Two-factor enabled"
            description="Track whether this account has a second factor configured."
          />
          <div className="h-px bg-line" />
          <Toggle
            checked={favorite}
            onChange={setFavorite}
            label="Pin to favorites"
            description="Keep this credential at the top of your vault."
          />
        </div>
      </div>
    </Modal>
  )
}
