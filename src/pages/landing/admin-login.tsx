import { LoginForm } from '@components/forms/LoginForm'
import { SimpleFooter } from '@widgets/landingwidgets/layout/simple-footer'
import { Link } from 'react-router-dom'
import { APP_NAME } from '@lib/constants'

export function AdminLogin() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="text-2xl font-bold tracking-tight">{APP_NAME}</Link>
            <h1 className="mt-4 text-3xl font-bold">Admin Portal</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to manage the community</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <LoginForm role="admin" />
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Are you a member?{' '}
            <Link to="/member/login" className="font-medium text-primary hover:underline">
              Member Login →
            </Link>
          </p>
        </div>
      </main>
      <SimpleFooter />
    </div>
  )
}
