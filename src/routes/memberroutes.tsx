import { Routes, Route, Navigate } from 'react-router-dom'
import { MemberDashboardLayout } from '@layouts/memberdashboard'
import { MemberDashboard } from '@pages/memberdashboard/member-dashboard'
import { MemberProduct } from '@pages/memberdashboard/member-product'
import { MemberOrder } from '@pages/memberdashboard/member-order'
import { MemberWallet } from '@pages/memberdashboard/member-wallet'
import { MemberProfile } from '@pages/memberdashboard/member-profile'
import { MemberNews } from '@pages/memberdashboard/member-news'
import { MemberGoal } from '@pages/memberdashboard/member-goal'
import { useAuth } from '@hooks/useAuth'
import { Loader } from '@components/common/Loader'

export function MemberRoutes() {
  const { user, role, verified, loading } = useAuth()

  if (loading) return <Loader />
  if (!user || role !== 'member' || !verified) return <Navigate to="/member/login" replace />

  return (
    <Routes>
      <Route element={<MemberDashboardLayout />}>
        <Route index element={<MemberDashboard />} />
        <Route path="products" element={<MemberProduct />} />
        <Route path="orders" element={<MemberOrder />} />
        <Route path="wallet" element={<MemberWallet />} />
        <Route path="profile" element={<MemberProfile />} />
        <Route path="news" element={<MemberNews />} />
        <Route path="roadmap" element={<MemberGoal />} />
      </Route>
    </Routes>
  )
}
