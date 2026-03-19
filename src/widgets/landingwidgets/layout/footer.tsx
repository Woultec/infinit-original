import { APP_NAME } from '@lib/constants'

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </div>
    </footer>
  )
}
