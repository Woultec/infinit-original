// src/widgets/dashboardwidgets/layout/sidenav.tsx
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@lib/utils'
import { APP_NAME } from '@lib/constants'

type NavLink = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export function SideNav({ links }: { links: NavLink[] }) {
  const { pathname } = useLocation()

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-sm font-bold tracking-tight">{APP_NAME}</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            aria-current={pathname === href ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
