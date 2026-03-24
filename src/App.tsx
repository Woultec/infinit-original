import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from '@components/common/ErrorBoundary'
import { LandingRoutes } from '@routes/landingroutes'
import { AdminRoutes }   from '@routes/adminroutes'
import { MemberRoutes }  from '@routes/memberroutes'
import { AdminLogin }  from '@pages/landing/admin-login'
import { MemberLogin } from '@pages/landing/member-login'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Auth pages — must be FIRST before dashboard routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/member/login" element={<MemberLogin />} />

          {/* Admin dashboard — protected, /admin/* */}
          <Route path="/admin/*" element={<AdminRoutes />} />

          {/* Member dashboard — protected, /member/* */}
          <Route path="/member/*" element={<MemberRoutes />} />

          {/* Landing + auth pages — must be LAST */}
          <Route path="/*" element={<LandingRoutes />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}