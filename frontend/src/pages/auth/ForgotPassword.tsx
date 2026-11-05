import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ExternalLink, Mail, MailCheck, Send } from 'lucide-react'
import { authApi } from '../../lib/endpoints'
import { apiErrorMessage, apiFieldErrors, type ValidationErrors } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { AuthFormError, AuthShell } from './AuthShell'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [resetUrl, setResetUrl] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setErrors({})

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Enter the email address linked to your account.')
      return
    }

    setLoading(true)
    try {
      const response = await authApi.forgotPassword(email.trim())
      setSentTo(email.trim())
      setResetUrl(response.data.reset_url ?? null)
      setNotice(response.data.message)
    } catch (caught) {
      setErrors(apiFieldErrors(caught))
      setFormError(apiErrorMessage(caught, 'We could not send a reset link right now.'))
    } finally {
      setLoading(false)
    }
  }

  if (sentTo) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`We've sent a password reset link to ${sentTo}.`}
        tabs={false}
        backTo={{ label: 'Back to sign in', to: '/signin' }}
      >
        <div className="space-y-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-600">
            <MailCheck className="h-6 w-6" />
          </div>

          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-[12.5px] font-semibold text-ink">The link expires in 15 minutes</p>
            <ol className="mt-3 space-y-2.5">
              {['Open the email from E-Drive', 'Click the secure reset link', 'Create a new master password'].map(
                (step, index) => (
                  <li key={step} className="flex items-center gap-2.5 text-[12px] text-slate-600">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ),
              )}
            </ol>
          </div>

          {resetUrl && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5">
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Local development shortcut
              </p>
              <p className="mt-1 text-[11px] leading-5 text-emerald-800/75">
                Mail is written to the Laravel log in this environment. Use the secure link below to
                continue.
              </p>
              <Link
                to={resetUrl.replace(/^https?:\/\/[^/]+/, '')}
                className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Open reset link
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {notice && <p className="text-[11.5px] leading-5 text-muted">{notice}</p>}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setSentTo(null)
                setResetUrl(null)
              }}
              leftIcon={<Send className="h-3.5 w-3.5" />}
            >
              Use another email
            </Button>
            <Link to="/signin" className="flex-1">
              <Button className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Back to sign in
              </Button>
            </Link>
          </div>

          <p className="text-center text-[11px] text-slate-400">
            Didn&apos;t get the email? Check your spam folder, or try again in a few minutes.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email linked to your account and we'll send you a secure link to reset it."
      tabs={false}
      backTo={{ label: 'Back to sign in', to: '/signin' }}
      footer={
        <p className="text-center text-[12.5px] text-muted">
          Remembered your password?{' '}
          <Link to="/signin" className="font-semibold text-brand-600 transition hover:text-brand-700">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <AuthFormError message={formError} />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@organization.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          leadingIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.[0]}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={loading}
          rightIcon={<Send className="h-4 w-4" />}
        >
          Send reset link
        </Button>
      </form>

      <div className="mt-5 rounded-xl border border-line bg-slate-50/70 px-3.5 py-3 text-[11px] leading-5 text-slate-500">
        Your files stay encrypted throughout the reset. E-Drive never has access to your master
        password or vault key.
      </div>
    </AuthShell>
  )
}
