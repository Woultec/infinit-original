import { Link, useLocation } from 'react-router-dom'
import { cn } from '@lib/utils'
import { ROUTES, APP_NAME } from '@lib/constants'
import type { Role } from '@lib/constants'
import {
  LayoutDashboard, Package, Users, User,
  MessageSquare, Phone, FileText, Newspaper,
} from 'lucide-react'

const adminLinks = [
  { label: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
  { label: 'Posts', href: ROUTES.ADMIN_POST, icon: FileText },
  { label: 'Products', href: ROUTES.ADMIN_PRODUCT, icon: Package },
  { label: 'Members', href: ROUTES.ADMIN_MEMBER, icon: Users },
  { label: 'Messages', href: ROUTES.ADMIN_MESSAGE, icon: MessageSquare },
  { label: 'Contacts', href: ROUTES.ADMIN_CONTACT, icon: Phone },
  { label: 'Profile', href: ROUTES.ADMIN_PROFILE, icon: User },
]

const memberLinks = [
  { label: 'Dashboard', href: ROUTES.MEMBER_DASHBOARD, icon: LayoutDashboard },
  { label: 'Products', href: ROUTES.MEMBER_PRODUCT, icon: Package },
  { label: 'News', href: ROUTES.MEMBER_NEWS, icon: Newspaper },
  { label: 'Messages', href: ROUTES.MEMBER_MESSAGE, icon: MessageSquare },
  { label: 'Profile', href: ROUTES.MEMBER_PROFILE, icon: User },
]

export function SideNav({ role }: { role: Role }) {
  const { pathname } = useLocation()
  const links = role === 'admin' ? adminLinks : memberLinks

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
