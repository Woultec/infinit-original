import { useState } from 'react'
import { useAuth } from '@hooks/useAuth'
import { register } from '@services/auth'
import { SUPER_ADMIN_EMAIL, ROLES, type Role } from '@lib/constants'
import { Input } from '@components/ui/Input'
import { Button } from '@components/ui/Button'
import { UserPlus, Shield, User, AlertCircle, CheckCircle2 } from 'lucide-react'

export function AdminMember() {
  const { user } = useAuth()
  const [form, setForm] = useState({ 
    firstName: '', 
    lastName: '', 
    username: '', 
    phone: '',
    email: '', 
    password: '', 
    role: 'member' as Role 
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      // Role protection check
      if (form.role === 'admin' && !isSuperAdmin) {
        throw new Error('Only the super admin can create new admin accounts.')
      }

      await register(
        form.email, 
        form.password, 
        form.role, 
        form.firstName,
        form.lastName,
        form.username,
        form.phone
      )
      
      setStatus('success')
      setForm({ 
        firstName: '', 
        lastName: '', 
        username: '', 
        phone: '',
        email: '', 
        password: '', 
        role: 'member' 
      })
      setTimeout(() => setStatus('idle'), 5000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed')
      setStatus('error')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Manage Members</h1>
        <p className="text-muted-foreground">Register new members and administrators for the community.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">Register New User</h2>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name</label>
              <Input
                type="text"
                placeholder="Juan"
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name</label>
              <Input
                type="text"
                placeholder="Dela Cruz"
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                type="text"
                placeholder="juan_dc"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone / Contacts</label>
              <Input
                type="text"
                placeholder="+63 912 345 6789"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Assign Role</label>
            <div className="grid grid-cols-2 gap-4">
              {ROLES.map((role) => {
                const isDisabled = role === 'admin' && !isSuperAdmin
                return (
                  <button
                    key={role}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setForm({ ...form, role })}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                      form.role === role
                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                        : 'border-border bg-background hover:bg-accent'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                  >
                    {role === 'admin' ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    <div>
                      <div className="font-semibold capitalize">{role}</div>
                      <div className="text-xs text-muted-foreground">
                        {role === 'admin' ? 'Full system access' : 'Standard member access'}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            {!isSuperAdmin && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3" />
                Only {SUPER_ADMIN_EMAIL} can assign the Admin role.
              </p>
            )}
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {errorMsg}
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 rounded-lg bg-green-100 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              User registered successfully! A confirmation email has been sent.
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Registering...' : 'Create Account'}
          </Button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-6">
        <h3 className="text-sm font-semibold mb-2">Note for Admins</h3>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Newly registered users must verify their email via the link sent to them.</li>
          <li>Users will appear in the system after their first login.</li>
          <li>Passwords must be at least 6 characters long.</li>
        </ul>
      </div>
    </div>
  )
}
