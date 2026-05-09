import { useAuth } from '@hooks/useAuth'

export function AdminProfile() {
  const { user, role, verified, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading session details...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Profile</h1>
        <p className="text-muted-foreground">Verification and session details for your account.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Session Information */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Session Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Full Name:</span>
              <span className="font-medium">{user?.user_metadata?.full_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-medium">@{user?.user_metadata?.username || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contacts:</span>
              <span className="font-medium">{user?.user_metadata?.contacts || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary uppercase">
                {role || 'No role'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verified:</span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {verified ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Technical Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID:</span>
              <span className="font-mono text-[10px] truncate max-w-[200px]">{user?.id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Sign In:</span>
              <span className="text-xs">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auth Provider:</span>
              <span className="text-xs capitalize">{user?.app_metadata?.provider || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Data (For Debugging) */}
      <div className="rounded-xl border border-border bg-muted/30 p-6 overflow-hidden">
        <h2 className="text-sm font-semibold mb-2">Raw User Metadata</h2>
        <pre className="text-[10px] bg-card p-4 rounded border border-border overflow-x-auto">
          {JSON.stringify(user?.user_metadata || {}, null, 2)}
        </pre>
      </div>
    </div>
  )
}
