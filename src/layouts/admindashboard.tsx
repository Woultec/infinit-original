// src/layouts/admindashboard.tsx
import { Outlet } from 'react-router-dom'
import { SideNav } from '@widgets/dashboardwidgets/layout/sidenav'
import { ADMIN_NAV_LINKS } from '@lib/constants'
import { DashboardNavbar } from '@widgets/dashboardwidgets/layout/navbar'
import { DashboardFooter } from '@widgets/dashboardwidgets/layout/footer'

export function AdminDashboardLayout() {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <SideNav links={ADMIN_NAV_LINKS} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
        <DashboardFooter />
      </div>
    </div>
  )
}
