import { useEffect, useState } from 'react'
import { Check, Copy, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import type { Credential } from '../../types'
import { credentialsApi } from '../../lib/endpoints'
import { apiErrorMessage } from '../../lib/api'
import { copyToClipboard } from '../../lib/clipboard'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

export function RevealCredentialDialog({
  credential,
  open,
  onClose,
}: {
  credential: Credential | null
  open: boolean
  onClose: () => void
}) {
  const { success, error } = useToast()
  const [secret, setSecret] = useState<string | null>(null)
  const [identifier, setIdentifier] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const [copied, setCopied] = useState<'secret' | 'identifier' | null>(null)

  useEffect(() => {
    let active = true
    if (!open || !credential) return undefined

    setLoading(true)
    setFailed(null)
    setSecret(null)
    setIdentifier(null)
    setVisible(false)
    setCopied(null)

    credentialsApi
      .reveal(credential.id)
      .then((response) => {
        if (!active) return
        setSecret(response.data.secret)
        setIdentifier(response.data.identifier)
      })
      .catch((caught) => {
        if (active) setFailed(apiErrorMessage(caught, 'This secret could not be decrypted.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, credential])

  if (!credential) return null

  const copy = async (value: string | null, target: 'secret' | 'identifier') => {
    if (!value) return
    const ok = await copyToClipboard(value)
    if (ok) {
      setCopied(target)
      success('Copied to clipboard', target === 'secret' ? 'The secret is on your clipboard.' : 'Identifier copied.')
      window.setTimeout(() => setCopied(null), 2000)
    } else {
      error('Copy failed', 'Select the value and copy it manually.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reveal credential"
      description={`${credential.name} · ${credential.type_label}`}
      size="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/70 px-3.5 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[11.5px] leading-5 text-amber-900/80">
            This reveal has been written to your audit trail. Never share a secret over an unsecured
            channel.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-line py-10 text-[12px] text-muted">
            <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
            Decrypting secret…
          </div>
        ) : failed ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-6 text-center">
            <p className="text-[12.5px] font-semibold text-red-800">Unable to reveal</p>
            <p className="mt-1 text-[11.5px] leading-5 text-red-700/80">{failed}</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-line">
              <div className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2.5">
                <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-500">
                  <KeyRound className="h-3 w-3" />
                  Identifier
                </span>
                <button
                  type="button"
                  onClick={() => void copy(identifier, 'identifier')}
                  disabled={!identifier}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-semibold text-brand-600 transition hover:bg-brand-50 disabled:opacity-40"
                >
                  {copied === 'identifier' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === 'identifier' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="break-all px-3.5 py-3 text-[12.5px] font-medium text-ink">
                {identifier || 'No identifier stored'}
              </p>
            </div>

            <div className="rounded-xl border border-line">
              <div className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wide text-slate-500">Secret</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setVisible((value) => !value)}
                    disabled={!secret}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                  >
                    {visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {visible ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void copy(secret, 'secret')}
                    disabled={!secret}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-semibold text-brand-600 transition hover:bg-brand-50 disabled:opacity-40"
                  >
                    {copied === 'secret' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === 'secret' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <p className="break-all px-3.5 py-3 font-mono text-[12.5px] text-ink">
                {secret ? (visible ? secret : '•'.repeat(Math.min(32, Math.max(12, secret.length)))) : 'No secret stored'}
              </p>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
