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
import BookingsPage from './pages/BookingsPage'
import NotificationsPage from './pages/NotificationsPage'

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
              <Route path="/bookings"      element={<BookingsPage />} />
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
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
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
