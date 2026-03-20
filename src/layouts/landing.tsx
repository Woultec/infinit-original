import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from '@widgets/landingwidgets/layout/navbar'
import { Footer } from '@widgets/landingwidgets/layout/footer'
import { AboutSection } from '@pages/landing/about-us'
import { ContactSection } from '@pages/landing/contacts'

/**
 * LandingLayout:
 * - On "/" → renders Navbar + HomeSection (via Outlet) + AboutSection + ContactSection + Footer
 * - On "/member/login" or "/admin/login" → renders ONLY the page (no navbar, no footer, no extra sections)
 *   (those routes are outside this layout in landingroutes.tsx)
 *
 * This layout is only mounted for the "/" route so it's always the full landing page.
 */
export function LandingLayout() {
  const { pathname } = useLocation()

  // Safety guard: if somehow an auth page ends up inside this layout, render nothing extra
  const isAuthPage = pathname.includes('/login')
  if (isAuthPage) return <Outlet />

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#f4faf0', color: '#1a1a1a' }}>
      <Navbar />
      <main className="flex-1">
        <Outlet />        {/* HomeSection renders here */}
        <AboutSection />  {/* id="about" */}
        <ContactSection />{/* id="contact" */}
      </main>
      <Footer />
    </div>
  )
}