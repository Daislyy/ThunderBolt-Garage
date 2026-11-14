import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import VehiclesPage from './pages/VehiclesPage'
import ServicesPage from './pages/ServicesPage'
import SparepartsPage from './pages/SparepartsPage'
import BookingsPage from './pages/BookingsPage'
import RatingsPage from './pages/RatingsPage'
import NotificationsPage from './pages/NotificationsPage'
import UserHomePage from './pages/UserHomePage'
import UserLoginPage from './pages/UserLoginPage'
import UserDashboardPage from './pages/UserDashboardPage'

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="admin-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      <div className="admin-main">
        <Topbar onMenuClick={() => setCollapsed(p => !p)} />
        <main className="admin-content">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/dashboard"     element={<DashboardPage />} />
              <Route path="/users"         element={<UsersPage />} />
              <Route path="/vehicles"      element={<VehiclesPage />} />
              <Route path="/services"      element={<ServicesPage />} />
              <Route path="/spareparts"    element={<SparepartsPage />} />
              <Route path="/bookings"      element={<BookingsPage />} />
              <Route path="/ratings"       element={<RatingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="*"              element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Customer Web View & Dedicated Customer Portal */}
      <Route path="/" element={<UserHomePage />} />
      <Route path="/user/login" element={<UserLoginPage />} />
      <Route path="/user/dashboard" element={<UserDashboardPage />} />
      <Route path="/user/bookings" element={<Navigate to="/user/dashboard" replace />} />
      <Route path="/user/vehicles" element={<Navigate to="/user/dashboard" replace />} />

      {/* Admin Login */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Admin Protected Panel */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
