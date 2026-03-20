import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Users, TrendingUp, Eye, EyeOff } from 'lucide-react'
import { z } from 'zod'
import { supabase } from '@services/supabase'

const loginSchema = z.object({
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const perks = [
  { icon: Shield,     text: 'Secure & verified member access' },
  { icon: Users,      text: 'Connect with 8,000 exclusive members' },
  { icon: TrendingUp, text: 'Track your investments & portfolio' },
]

export function MemberLogin() {
  const navigate = useNavigate()

  const [form,        setForm]        = useState({ email: '', password: '' })
  const [errors,      setErrors]      = useState<{ email?: string; password?: string }>({})
  const [serverError, setServerError] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [showPass,    setShowPass]    = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: '' }))
    setServerError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = loginSchema.safeParse(form)
    if (!result.success) {
      const fe: { email?: string; password?: string } = {}
      result.error.errors.forEach(err => {
        const f = err.path[0] as 'email' | 'password'
        fe[f] = err.message
      })
      setErrors(fe)
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email:    form.email,
        password: form.password,
      })
      if (error) throw error
      navigate('/member/dashboard')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#f4faf0', fontFamily: 'Sora, sans-serif' }}>

      {/* ══ LEFT PANEL — visible only lg+ ══ */}
      <div style={{
        display: 'none',
        width: '50%',
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        background: 'linear-gradient(135deg, #2d7a0f 0%, #4aa027 55%, #c9a010 100%)',
      }}
        className="lg-panel">

        {/* Decorative rings */}
        <div style={{ position: 'absolute', top: '-96px', left: '-96px', width: '384px', height: '384px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-128px', right: '-128px', width: '500px', height: '500px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '25%', right: '64px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f5c518', opacity: 0.6 }} />
        <div style={{ position: 'absolute', bottom: '33%', left: '80px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f5c518', opacity: 0.4 }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px', fontFamily: 'Playfair Display, serif' }}>∞</span>
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px', lineHeight: '1.3' }}>
              Infinity<br /><span style={{ color: '#f5c518' }}>8000 Corp.</span>
            </span>
          </Link>
        </div>

        {/* Center content */}
        <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', padding: '6px 16px', marginBottom: '24px', width: 'fit-content' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f5c518', display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 500, letterSpacing: '0.05em' }}>Member Portal</span>
          </div>

          <h1 style={{ fontSize: '40px', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: '16px', fontFamily: 'Playfair Display, serif' }}>
            Welcome Back<br />to the <span style={{ color: '#f5c518' }}>Circle.</span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: 1.7, marginBottom: '40px', maxWidth: '340px' }}>
            Your exclusive community of 8,000 visionary investors is waiting. Sign in to access your dashboard.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {perks.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color="#f5c518" />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', fontStyle: 'italic' }}>
            "The best investment you can make is in yourself and the right community."
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '4px' }}>— Infinity 8000 Corporation</p>
        </div>
      </div>

      {/* ══ RIGHT PANEL — always visible ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 24px' }}>

        {/* Back link */}
        <div style={{ width: '100%', maxWidth: '440px', marginBottom: '32px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#4a6040', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {/* Mobile logo */}
        <div style={{ width: '100%', maxWidth: '440px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #2d7a0f 0%, #4aa027 55%, #c9a010 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'Playfair Display, serif' }}>∞</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '14px', lineHeight: '1.3', color: '#1a1a1a' }}>
            Infinity<br /><span style={{ color: '#4aa027' }}>8000 Corp.</span>
          </span>
        </div>

        {/* Heading */}
        <div style={{ width: '100%', maxWidth: '440px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', fontFamily: 'Playfair Display, serif', margin: 0 }}>
            Member Sign In
          </h2>
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#4a6040' }}>
            Enter your credentials to access your member dashboard.
          </p>
        </div>

        {/* Form card */}
        <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #c8e0be', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="email" style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
                Email Address
              </label>
              <input
                id="email" name="email" type="email"
                placeholder="you@example.com"
                value={form.email} onChange={handleChange}
                autoComplete="email"
                style={{
                  height: '44px', borderRadius: '12px',
                  border: `1.5px solid ${errors.email ? '#e63946' : '#c8e0be'}`,
                  backgroundColor: '#f4faf0', padding: '0 16px',
                  fontSize: '14px', color: '#1a1a1a', outline: 'none', width: '100%',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = '#4aa027'; e.target.style.boxShadow = '0 0 0 3px rgba(74,160,39,0.15)' }}
                onBlur={e => { e.target.style.borderColor = errors.email ? '#e63946' : '#c8e0be'; e.target.style.boxShadow = 'none' }}
              />
              {errors.email && <span style={{ fontSize: '12px', color: '#e63946' }}>{errors.email}</span>}
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="password" style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password" name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password} onChange={handleChange}
                  autoComplete="current-password"
                  style={{
                    height: '44px', borderRadius: '12px',
                    border: `1.5px solid ${errors.password ? '#e63946' : '#c8e0be'}`,
                    backgroundColor: '#f4faf0', padding: '0 44px 0 16px',
                    fontSize: '14px', color: '#1a1a1a', outline: 'none', width: '100%',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#4aa027'; e.target.style.boxShadow = '0 0 0 3px rgba(74,160,39,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = errors.password ? '#e63946' : '#c8e0be'; e.target.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8ab87a', padding: '4px', display: 'flex', alignItems: 'center' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span style={{ fontSize: '12px', color: '#e63946' }}>{errors.password}</span>}
            </div>

            {/* Server error */}
            {serverError && (
              <div style={{ borderRadius: '10px', padding: '12px 16px', fontSize: '14px', backgroundColor: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)', color: '#e63946' }}>
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                height: '48px', borderRadius: '12px', border: 'none',
                backgroundColor: loading ? '#8ab87a' : '#4aa027',
                color: '#ffffff', fontWeight: 700, fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 14px rgba(74,160,39,0.35)',
                transition: 'background-color 0.2s',
                width: '100%',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#2d7a0f' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#4aa027' }}>
              {loading
                ? <span style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                : 'Sign In to Member Portal'}
            </button>
          </form>
        </div>

        {/* Support */}
        <div style={{ width: '100%', maxWidth: '440px', marginTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#8ab87a', margin: 0 }}>
            Having trouble?{' '}
            <a href="/#contact" style={{ color: '#4aa027', fontWeight: 600, textDecoration: 'none' }}>
              Contact support
            </a>
          </p>
        </div>

        {/* Not a member */}
        <div style={{ width: '100%', maxWidth: '440px', marginTop: '12px', backgroundColor: 'rgba(74,160,39,0.06)', border: '1px solid rgba(74,160,39,0.2)', borderRadius: '12px', padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#4a6040', margin: 0 }}>
            Not a member yet?{' '}
            <a href="/#contact" style={{ color: '#4aa027', fontWeight: 700, textDecoration: 'none' }}>
              Apply for membership →
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg-panel { display: flex !important; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}