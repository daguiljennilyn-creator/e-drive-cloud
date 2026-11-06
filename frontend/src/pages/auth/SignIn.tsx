import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, KeyRound, Mail } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { apiErrorMessage, apiFieldErrors, type ValidationErrors } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { AuthFormError, AuthShell } from './AuthShell'

type SignInState = {
  notice?: string
  from?: { pathname?: string; search?: string }
}

export function SignIn() {
  const { login } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as SignInState | null) ?? {}
  const redirectTo = state.from?.pathname
    ? `${state.from.pathname}${state.from.search ?? ''}`
    : '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(
    state.notice ? null : null,
  )
  const [errors, setErrors] = useState<ValidationErrors>({})

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setErrors({})

    if (!email.trim() || !password) {
      setFormError('Enter your email address and password to continue.')
      return
    }

    setLoading(true)
    try {
      const user = await login(email.trim(), password, remember)
      success('Welcome back', `${user.name.split(' ')[0]}, your vault is unlocked.`)
      navigate(redirectTo, { replace: true })
    } catch (caught) {
      setErrors(apiFieldErrors(caught))
      setFormError(apiErrorMessage(caught, 'Unable to sign in with those details.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Sign in to your vault"
      subtitle="Access your vaults, personal papers and shared workspaces."
      footer={
        <p className="text-center text-[12.5px] text-muted">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-semibold text-brand-600 transition hover:text-brand-700">
            Create one
          </Link>
        </p>
      }
    >
      {state.notice && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-[12px] font-medium text-emerald-700">
          {state.notice}
        </div>
      )}

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

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          leadingIcon={<KeyRound className="h-4 w-4" />}
          error={errors.password?.[0]}
          labelAction={
            <Link
              to="/forgot-password"
              className="text-[11.5px] font-semibold text-brand-600 transition hover:text-brand-700"
            >
              Forgot password?
            </Link>
          }
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

        <label className="flex items-center gap-2.5 text-[12px] text-slate-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 accent-brand-600"
          />
          Remember me on this device for 30 days
        </label>

        <Button type="submit" size="lg" className="w-full" loading={loading} rightIcon={<ArrowRight className="h-4 w-4" />}>
          Sign in to E-Drive
        </Button>
      </form>
    </AuthShell>
  )
}