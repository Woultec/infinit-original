import { Routes, Route, Navigate } from 'react-router-dom'
import { MemberDashboardLayout } from '@layouts/memberdashboard'
import { MemberDashboard } from '@pages/memberdashboard/member-dashboard'
import { MemberProduct } from '@pages/memberdashboard/member-product'
import { MemberProfile } from '@pages/memberdashboard/member-profile'
import { MemberMessage } from '@pages/memberdashboard/member-message'
import { MemberNews } from '@pages/memberdashboard/member-news'
import { useAuth } from '@hooks/useAuth'
import { Loader } from '@components/common/Loader'

export function MemberRoutes() {
  const { user, role, loading } = useAuth()

  if (loading) return <Loader />
  if (!user || role !== 'member') return <Navigate to="/member/login" replace />

  return (
    <Routes>
      <Route element={<MemberDashboardLayout />}>
        <Route index element={<MemberDashboard />} />
        <Route path="products" element={<MemberProduct />} />
        <Route path="profile" element={<MemberProfile />} />
        <Route path="messages" element={<MemberMessage />} />
        <Route path="news" element={<MemberNews />} />
      </Route>
    </Routes>
  )
}
