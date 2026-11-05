import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { apiErrorMessage, apiFieldErrors, type ValidationErrors } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { AuthFormError, AuthShell } from './AuthShell'

export function SignUp() {
  const { register } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [errors, setErrors] = useState<ValidationErrors>({})

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setErrors({})

    if (name.trim().length < 2) {
      setFormError('Enter your full name to create your vault.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Enter a valid email address.')
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
    if (!agreed) {
      setFormError('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }

    setLoading(true)
    try {
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirmation,
      })
      success('Vault created', `Welcome to E-Drive, ${user.name.split(' ')[0]}.`)
      navigate('/dashboard', { replace: true })
    } catch (caught) {
      setErrors(apiFieldErrors(caught))
      setFormError(apiErrorMessage(caught, 'We could not create your account.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up your secure E-Drive in under a minute."
      footer={
        <p className="text-center text-[12.5px] text-muted">
          Already have an account?{' '}
          <Link to="/signin" className="font-semibold text-brand-600 transition hover:text-brand-700">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <AuthFormError message={formError} />

        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Your full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          leadingIcon={<UserRound className="h-4 w-4" />}
          error={errors.name?.[0]}
        />

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

        <Input
          label="Password"
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
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          leadingIcon={<KeyRound className="h-4 w-4" />}
          error={errors.password_confirmation?.[0]}
        />

        <label className="flex items-start gap-2.5 text-[11.5px] leading-5 text-slate-600">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-600"
          />
          <span>
            I agree to the{' '}
            <Link to="/terms" className="font-semibold text-brand-600 hover:text-brand-700">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-semibold text-brand-600 hover:text-brand-700">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={loading}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Create account
        </Button>
      </form>

      <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-[11px] leading-5 text-emerald-800/80">
          15 GB of encrypted storage is included with every account. Files are encrypted before they
          ever leave your device.
        </p>
      </div>
    </AuthShell>
  )
}
