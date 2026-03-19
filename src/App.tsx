import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from '@components/common/ErrorBoundary'
import { LandingRoutes } from '@routes/landingroutes'
import { AdminRoutes } from '@routes/adminroutes'
import { MemberRoutes } from '@routes/memberroutes'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Landing / public routes */}
          <Route path="/*" element={<LandingRoutes />} />

          {/* Admin routes — protected */}
          <Route path="/admin/*" element={<AdminRoutes />} />

          {/* Member routes — protected */}
          <Route path="/member/*" element={<MemberRoutes />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
