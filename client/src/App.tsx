import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider, useToast } from './context/ToastContext'
import AppShell from './layouts/AppShell'
import { LoadingState } from './components/ui'
import { useEffect } from 'react'
import { connectSocket, disconnectSocket } from './lib/socket'

import Splash from './pages/Splash'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import FindRide from './pages/FindRide'
import OfferRide from './pages/OfferRide'
import MyTrips from './pages/MyTrips'
import TripDetail from './pages/TripDetail'
import Payment from './pages/Payment'
import MyVehicles from './pages/MyVehicles'
import WalletPage from './pages/Wallet'
import RideHistory from './pages/RideHistory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'

import AdminDashboard from './features/admin/AdminDashboard'
import AdminEmployees from './features/admin/AdminEmployees'
import AdminVehicles from './features/admin/AdminVehicles'
import AdminReports from './features/admin/AdminReports'
import AdminSettings from './features/admin/AdminSettings'

function SocketManager() {
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return
    const socket = connectSocket()
    socket.on('notification:new', (data: { title: string; body: string }) => {
      toast(`${data.title} — ${data.body}`, 'notification')
    })
    return () => {
      socket.off('notification:new')
      disconnectSocket()
    }
  }, [user, toast])

  return null
}

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingState />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return <AppShell>{children}</AppShell>
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingState />

  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/find-ride" element={<ProtectedRoute><FindRide /></ProtectedRoute>} />
      <Route path="/offer-ride" element={<ProtectedRoute><OfferRide /></ProtectedRoute>} />
      <Route path="/trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
      <Route path="/trips/:id" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} />
      <Route path="/payment/:bookingId/:tripId/:amount" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
      <Route path="/vehicles" element={<ProtectedRoute><MyVehicles /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><RideHistory /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/employees" element={<ProtectedRoute adminOnly><AdminEmployees /></ProtectedRoute>} />
      <Route path="/admin/vehicles" element={<ProtectedRoute adminOnly><AdminVehicles /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute adminOnly><AdminReports /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SocketManager />
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
