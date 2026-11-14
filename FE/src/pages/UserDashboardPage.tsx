import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useCustomerAuth } from '../hooks/useCustomerAuth'
import UserDashboardNavbar from '../user/dashboard/UserDashboardNavbar'
import UserBookingsTab from '../user/dashboard/UserBookingsTab'
import UserVehiclesTab from '../user/dashboard/UserVehiclesTab'
import UserNewBookingTab from '../user/dashboard/UserNewBookingTab'
import type { UserVehicle } from '../user/dashboard/userStorage'
import '../user/user.css'

export default function UserDashboardPage() {
  const { user, isAuthenticated, logout } = useCustomerAuth()
  const [activeTab, setActiveTab] = useState<'bookings' | 'vehicles' | 'new-booking'>('vehicles')
  const [preselectedVehicle, setPreselectedVehicle] = useState<UserVehicle | null>(null)
  const [filterPlate, setFilterPlate] = useState<string>('all')

  // Protect route
  if (!isAuthenticated || !user) {
    return <Navigate to="/user/login" replace />
  }

  const handleBookForVehicle = (vehicle: UserVehicle) => {
    setPreselectedVehicle(vehicle)
    setActiveTab('new-booking')
  }

  const handleViewVehicleBookings = (plate: string) => {
    setFilterPlate(plate)
    setActiveTab('bookings')
  }

  const handleBookingSuccess = () => {
    setPreselectedVehicle(null)
    setFilterPlate('all')
    setActiveTab('bookings')
  }

  return (
    <div className="tb-user-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <UserDashboardNavbar
        user={user}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== 'bookings') setFilterPlate('all')
          if (tab !== 'new-booking') setPreselectedVehicle(null)
          setActiveTab(tab)
        }}
        onLogout={logout}
      />

      <main style={{ flex: 1, padding: '2.5rem 0' }}>
        <div className="tb-container">
          {activeTab === 'bookings' && (
            <UserBookingsTab
              user={user}
              onNewBookingClick={() => {
                setPreselectedVehicle(null)
                setActiveTab('new-booking')
              }}
              filterVehiclePlate={filterPlate}
            />
          )}

          {activeTab === 'vehicles' && (
            <UserVehiclesTab
              user={user}
              onBookForVehicle={handleBookForVehicle}
              onViewVehicleBookings={handleViewVehicleBookings}
            />
          )}

          {activeTab === 'new-booking' && (
            <UserNewBookingTab
              user={user}
              onSuccess={handleBookingSuccess}
              preselectedVehicle={preselectedVehicle}
            />
          )}
        </div>
      </main>

      <footer style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', padding: '1.25rem 0', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
        <div className="tb-container">
          ThunderBolt Garage Customer Dashboard • Sistem Terintegrasi Antrean & Pengerjaan Kendaraan
        </div>
      </footer>
    </div>
  )
}
