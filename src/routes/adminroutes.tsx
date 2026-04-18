// adminroutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminDashboardLayout } from '@layouts/admindashboard'
import { AdminDashboard } from '@pages/admindashboard/admin-dashboard'
import { AdminPost } from '@pages/admindashboard/admin-post'
import { AdminProduct } from '@pages/admindashboard/admin-product'
import { AdminMember } from '@pages/admindashboard/admin-member'
import { AdminMessage } from '@pages/admindashboard/admin-message'
import { AdminContact } from '@pages/admindashboard/admin-contact'
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
        <Route path="messages" element={<AdminMessage />} />
        <Route path="contacts" element={<AdminContact />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
    </Routes>
  )
}
