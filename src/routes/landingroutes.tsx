import { Routes, Route } from 'react-router-dom'
import { LandingLayout } from '@layouts/landing'
import { Home } from '@pages/landing/home'
import { AboutUs } from '@pages/landing/about-us'
import { Contacts } from '@pages/landing/contacts'
import { AdminLogin } from '@pages/landing/admin-login'
import { MemberLogin } from '@pages/landing/member-login'

export function LandingRoutes() {
  return (
    <Routes>
      <Route element={<LandingLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<AboutUs />} />
        <Route path="contacts" element={<Contacts />} />
      </Route>
      <Route path="admin/login" element={<AdminLogin />} />
      <Route path="member/login" element={<MemberLogin />} />
    </Routes>
  )
}
