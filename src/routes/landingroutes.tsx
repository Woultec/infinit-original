import { Routes, Route } from 'react-router-dom'
import { LandingLayout } from '@layouts/landing'
import { HomeSection } from '@pages/landing/home'

export function LandingRoutes() {
  return (
    <Routes>
      {/* ── Full landing page (Navbar + Home + About + Contact + Footer) ── */}
      <Route element={<LandingLayout />}>
        <Route index element={<HomeSection />} />
      </Route>
    </Routes>
  )
}