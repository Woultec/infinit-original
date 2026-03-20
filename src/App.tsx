import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from '@components/common/ErrorBoundary'
import { LandingRoutes } from '@routes/landingroutes'
import { AdminRoutes }   from '@routes/adminroutes'
import { MemberRoutes }  from '@routes/memberroutes'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Admin dashboard — protected, /admin/* */}
          <Route path="/admin/*" element={<AdminRoutes />} />

          {/* Member dashboard — protected, /member/* */}
          <Route path="/member/*" element={<MemberRoutes />} />

          {/* Landing + auth pages — must be LAST so /admin/* and /member/* match first */}
          <Route path="/*" element={<LandingRoutes />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}