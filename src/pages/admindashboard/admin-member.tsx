import { useState, useEffect } from 'react'
import { useAuth } from '@hooks/useAuth'
import { register } from '@services/auth'
import { getAllProfiles, Profile } from '@services/profileService'
import { SUPER_ADMIN_EMAIL, ROLES, type Role } from '@lib/constants'
import { Input } from '@components/ui/Input'
import { Button } from '@components/ui/Button'
import { UserPlus, Shield, User, AlertCircle, CheckCircle2, Users, Loader2 } from 'lucide-react'

export function AdminMember() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'members' | 'register'>('members')
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

  const [members, setMembers] = useState<Profile[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  useEffect(() => {
    async function loadMembers() {
      try {
        const data = await getAllProfiles()
        setMembers(data)
      } catch (err) {
        console.error('Failed to load members:', err)
      } finally {
        setIsLoadingMembers(false)
      }
    }
    loadMembers()
  }, [])

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
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Manage Members</h1>
        <p className="text-muted-foreground">Register new members and view the community directory.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {[
          { id: 'members', label: 'System Members' },
          { id: 'register', label: 'Register New User' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'members' | 'register')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'register' && (
          <div className="max-w-2xl space-y-8">
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
                    <label className="text-sm font-medium">Contacts</label>
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
                          className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                            form.role === role
                              ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                              : 'border-border bg-background hover:bg-accent'
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                        >
                          {role === 'admin' ? <Shield className="h-4 w-4 shrink-0" /> : <User className="h-4 w-4 shrink-0" />}
                          <div>
                            <div className="font-semibold capitalize text-sm">{role}</div>
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
                    User registered successfully!
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
                <li>Newly registered users must verify their email.</li>
                <li>Users will appear in the system after their first login.</li>
                <li>Passwords must be at least 6 characters long.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col h-full max-h-[800px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">System Members</h2>
              </div>
              <div className="text-sm text-muted-foreground font-medium bg-muted px-3 py-1 rounded-full">
                {members.length} Total
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-lg border border-border relative">
              {isLoadingMembers ? (
                <div className="flex h-full items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : members.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground font-medium">No members found.</p>
                  <p className="text-sm text-muted-foreground mt-1">Users will appear here after they set up their profiles.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                    <tr>
                      <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Contact</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Role</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted flex items-center justify-center shrink-0">
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <User className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">
                                {member.first_name} {member.last_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                @{member.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-foreground">{member.email}</div>
                          <div className="text-xs text-muted-foreground">{member.contacts}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                            member.role === 'admin' 
                              ? 'bg-primary/10 text-primary border border-primary/20' 
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
