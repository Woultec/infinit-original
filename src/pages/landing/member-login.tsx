import { LoginForm } from '@components/forms/LoginForm'
import { SimpleFooter } from '@widgets/landingwidgets/layout/simple-footer'
import { Link } from 'react-router-dom'
import { APP_NAME } from '@lib/constants'

export function MemberLogin() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="text-2xl font-bold tracking-tight">{APP_NAME}</Link>
            <h1 className="mt-4 text-3xl font-bold">Member Portal</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to access your community</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <LoginForm role="member" />
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Are you an admin?{' '}
            <Link to="/admin/login" className="font-medium text-primary hover:underline">
              Admin Login →
            </Link>
          </p>
        </div>
      </main>
      <SimpleFooter />
    </div>
  )
}
