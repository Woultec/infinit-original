import { Outlet } from 'react-router-dom'
import { Navbar } from '@widgets/landingwidgets/layout/navbar'
import { Footer } from '@widgets/landingwidgets/layout/footer'

export function LandingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
