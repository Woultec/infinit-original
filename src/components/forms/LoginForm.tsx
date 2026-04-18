import { useState, useEffect } from 'react'
import { signIn, signOut, sendConfirmationCode, verifyConfirmationCode, getUserRole } from '@services/auth'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import type { Role } from '@lib/constants'
import { Input } from '@components/ui/Input'
import { Button } from '@components/ui/Button'

interface Props {
  role: Role
}

export function LoginForm({ role: expectedRole }: Props) {
  const navigate = useNavigate()
  const { user, verified, role: currentRole, loading: authLoading } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'login' | 'verify'>('login')
  const [userId, setUserId] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // If already logged in but not verified, jump to verify step
  useEffect(() => {
    if (user && !verified && currentRole === expectedRole && step === 'login') {
      setUserId(user.id)
      setForm(prev => ({ ...prev, email: user.email || '' }))
      setStep('verify')
    } else if (user && verified && currentRole === expectedRole) {
      navigate(expectedRole === 'admin' ? '/admin' : '/member', { replace: true })
    }
  }, [user, verified, currentRole, expectedRole, step, navigate])

  if (authLoading) return <div className="text-center py-4 text-muted-foreground italic">Checking session...</div>

  // Step 1 — sign in + send code
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const data = await signIn(form.email, form.password)
      const userRole = getUserRole(data.user)

      if (userRole !== expectedRole) {
        await signOut()
        throw new Error(`This portal is for ${expectedRole}s only.`)
      }

      await sendConfirmationCode(data.user.id, data.user.email!)
      setUserId(data.user.id)
      setStep('verify')
      setStatus('idle')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Login failed')
      setStatus('error')
    }
  }

  // Step 2 — verify code + redirect
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      await verifyConfirmationCode(userId, code)
      navigate(expectedRole === 'admin' ? '/admin' : '/member', { replace: true })
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid or expired code')
      setStatus('error')
    }
  }

  const handleResend = async () => {
    setStatus('loading')
    setErrorMsg('')
    try {
      const data = await signIn(form.email, form.password)
      await sendConfirmationCode(data.user.id, data.user.email!)
      setStatus('idle')
    } catch {
      setErrorMsg('Failed to resend code')
      setStatus('error')
    }
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Check your email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent an 8-digit code to <strong>{form.email}</strong>
          </p>
        </div>

        <Input
          type="text"
          maxLength={8}
          placeholder="00000000"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          className="text-center text-2xl tracking-widest"
          autoFocus
          required
        />

        {status === 'error' && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}

        <Button type="submit" className="w-full" disabled={status === 'loading' || code.length < 8}>
          {status === 'loading' ? 'Verifying...' : 'Confirm'}
        </Button>

        <button
          type="button"
          onClick={handleResend}
          disabled={status === 'loading'}
          className="w-full text-sm text-muted-foreground hover:text-primary"
        >
          Didn't receive it? Resend code
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
        required
      />

      {status === 'error' && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      <Button type="submit" className="w-full" disabled={status === 'loading'}>
        {status === 'loading' ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}