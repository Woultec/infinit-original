import { useDarkMode } from '@hooks/useDarkMode'
import { signOut } from '@services/auth'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Sun, Moon, LogOut, Bell, User } from 'lucide-react'

export function DashboardNavbar() {
  const { isDark, toggle } = useDarkMode()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isMember = pathname.startsWith('/member')
  const profilePath = isMember ? '/member/profile' : '/admin/profile'

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="flex h-16 items-center justify-end gap-3 border-b border-border bg-background px-6">
      <Link to={profilePath} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
        <User className="h-4 w-4" />
        Profile
      </Link>
      <button onClick={handleSignOut} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
      <button className="relative rounded-lg p-2 hover:bg-accent">
        <Bell className="h-4 w-4" />
      </button>
      <button onClick={toggle} className="rounded-lg p-2 hover:bg-accent" aria-label="Toggle theme">
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </header>
  )
}
