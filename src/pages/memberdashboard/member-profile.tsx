import { useAuth } from '@hooks/useAuth'
import { ProfileForm } from '@widgets/dashboardwidgets/profile/ProfileForm'
import { ChangePasswordForm } from '@widgets/dashboardwidgets/profile/ChangePasswordForm'

export function MemberProfile() {
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
        <h1 className="text-2xl font-bold">Member Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and session details.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Editing Form */}
        <div className="md:col-span-2">
          <ProfileForm />
        </div>

        {/* Change Password Form */}
        <div className="md:col-span-2">
          <ChangePasswordForm />
        </div>

        {/* Session Information */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Session Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user?.email || 'N/A'}</span>
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

      </div>
    </div>
  )
}

