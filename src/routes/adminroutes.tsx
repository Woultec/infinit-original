// adminroutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminDashboardLayout } from '@layouts/admindashboard'
import { AdminDashboard } from '@pages/admindashboard/admin-dashboard'
import { AdminPost } from '@pages/admindashboard/admin-post'
import { AdminProduct } from '@pages/admindashboard/admin-product'
import { AdminMember } from '@pages/admindashboard/admin-member'
import { AdminGoal } from '@pages/admindashboard/admin-goal'
import { AdminInquiry } from '@pages/admindashboard/admin-inquiry'
import { AdminProfile } from '@pages/admindashboard/admin-profile'
import { useAuth } from '@hooks/useAuth'
import { Loader } from '@components/common/Loader'

export function AdminRoutes() {
  const { user, role, verified, loading } = useAuth()

  if (loading) return <Loader />
  if (!user || role !== 'admin' || !verified) return <Navigate to="/admin/login" replace />

  return (
    <Routes>
      <Route element={<AdminDashboardLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="posts" element={<AdminPost />} />
        <Route path="products" element={<AdminProduct />} />
        <Route path="members" element={<AdminMember />} />
        <Route path="goals" element={<AdminGoal />} />
        <Route path="inquiries" element={<AdminInquiry />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
    </Routes>
  )
}
