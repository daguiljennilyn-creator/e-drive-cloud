import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { authApi } from '../../lib/endpoints'
import { apiErrorMessage, apiFieldErrors, type ValidationErrors } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { AuthFormError, AuthShell } from './AuthShell'

export function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { success } = useToast()

  const token = params.get('token') ?? ''
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [errors, setErrors] = useState<ValidationErrors>({})

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setErrors({})

    if (!token) {
      setFormError('This reset link is missing its secure token. Request a new link.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Enter the email address linked to your account.')
      return
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setFormError('Use at least 8 characters with both letters and numbers.')
      return
    }
    if (password !== confirmation) {
      setFormError('The two passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const response = await authApi.resetPassword({
        token,
        email: email.trim(),
        password,
        password_confirmation: confirmation,
      })
      success('Password reset', response.data.message)
      navigate('/signin', {
        replace: true,
        state: { notice: 'Your password was reset. Sign in with your new password.' },
      })
    } catch (caught) {
      setErrors(apiFieldErrors(caught))
      setFormError(apiErrorMessage(caught, 'We could not reset your password.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create a new password"
      subtitle="Choose a strong master password. You'll use it to unlock your vault from now on."
      tabs={false}
      backTo={{ label: 'Back to sign in', to: '/signin' }}
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
          readOnly={Boolean(params.get('email'))}
        />

        <Input
          label="New password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          leadingIcon={<KeyRound className="h-4 w-4" />}
          hint="Use 8+ characters with letters and numbers."
          error={errors.password?.[0]}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="rounded p-1 text-slate-400 transition hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <Input
          label="Confirm new password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          leadingIcon={<KeyRound className="h-4 w-4" />}
          error={errors.password_confirmation?.[0]}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={loading}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Reset password
        </Button>
      </form>

      <div className="mt-5 flex items-start gap-2 rounded-xl border border-line bg-slate-50/70 px-3.5 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-[11px] leading-5 text-slate-500">
          Resetting your password signs out every other device. Your encrypted files remain untouched.
        </p>
      </div>

      <p className="mt-5 text-center text-[12px] text-muted">
        Need a new link?{' '}
        <Link to="/forgot-password" className="font-semibold text-brand-600 hover:text-brand-700">
          Request another
        </Link>
      </p>
    </AuthShell>
  )
}
