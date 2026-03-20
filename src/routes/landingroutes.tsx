import { Routes, Route } from 'react-router-dom'
import { LandingLayout } from '@layouts/landing'
import { HomeSection } from '@pages/landing/home'
import { AdminLogin }  from '@pages/landing/admin-login'
import { MemberLogin } from '@pages/landing/member-login'

export function LandingRoutes() {
  return (
    <Routes>
      {/* ── Full landing page (Navbar + Home + About + Contact + Footer) ── */}
      <Route element={<LandingLayout />}>
        <Route index element={<HomeSection />} />
      </Route>

      {/* ── Auth pages: completely standalone, zero layout wrapping ── */}
      <Route path="member/login" element={<MemberLogin />} />

      {/* Admin login: hidden from UI, only accessible by direct URL /admin/login */}
      <Route path="admin/login"  element={<AdminLogin />} />
    </Routes>
  )
}