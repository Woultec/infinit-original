import { useState } from 'react'
import { updatePassword } from '@services/auth'
import { KeyRound, Loader2, Save } from 'lucide-react'
import { Input } from '@components/ui/Input'
import { Button } from '@components/ui/Button'

export function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await updatePassword(password)
      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-6">Change Password</h2>
      
      {error && (
        <div className="mb-6 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
          Password updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm New Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button type="submit" disabled={isSaving || !password || !confirmPassword} className="min-w-[120px]">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Password
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
