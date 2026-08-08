import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { useEffect } from 'react'
import { connectSocket } from './lib/socket'
import { showLocalNotification } from './lib/notifications'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import FindRide from './pages/FindRide'
import OfferRide from './pages/OfferRide'
import MyTrips from './pages/MyTrips'
import TripDetail from './pages/TripDetail'
import Payment from './pages/Payment'
import Wallet from './pages/Wallet'
import Profile from './pages/Profile'
import RideHistory from './pages/RideHistory'
import Notifications from './pages/Notifications'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEmployees from './pages/admin/AdminEmployees'
import AdminVehicles from './pages/admin/AdminVehicles'
import AdminReports from './pages/admin/AdminReports'
import AdminSettings from './pages/admin/AdminSettings'
import { Home as HomeIcon, Search, Car, List, Wallet as WalletIcon, Users, BarChart2, Settings } from 'lucide-react'

const EMPLOYEE_NAV = [
  { to: '/home',       icon: HomeIcon,   label: 'Home' },
  { to: '/find-ride',  icon: Search,     label: 'Find' },
  { to: '/offer-ride', icon: Car,        label: 'Offer' },
  { to: '/trips',      icon: List,       label: 'Trips' },
  { to: '/wallet',     icon: WalletIcon, label: 'Wallet' },
]

const ADMIN_NAV = [
  { to: '/admin',          icon: HomeIcon,  label: 'Home' },
  { to: '/admin/employees', icon: Users,    label: 'Staff' },
  { to: '/admin/vehicles',  icon: Car,      label: 'Fleet' },
  { to: '/admin/reports',   icon: BarChart2, label: 'Reports' },
  { to: '/admin/settings',  icon: Settings, label: 'Settings' },
]

const HIDE_NAV = ['/', '/login', '/signup']
const HIDE_NAV_PREFIX = ['/trip/', '/payment/']

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const hide = HIDE_NAV.includes(location.pathname) ||
    HIDE_NAV_PREFIX.some(p => location.pathname.startsWith(p))
  if (hide) return null

  const nav = user?.role === 'ADMIN' ? ADMIN_NAV : EMPLOYEE_NAV

  return (
    <nav className="bottom-nav">
      {nav.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to ||
          (to !== '/home' && to !== '/admin' && location.pathname.startsWith(to))
        return (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="flex-1 flex flex-col items-center gap-1 py-1 transition-all active:scale-90"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-[#714B67]' : ''}`}>
              <Icon size={20} className={active ? 'text-white' : 'text-[#9ca3af]'} />
            </div>
            <span className={`text-[10px] font-bold ${active ? 'text-[#714B67]' : 'text-[#9ca3af]'}`}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// Global notification listener — fires native push for every socket notification
function NotificationBridge() {
  const { user } = useAuth()
  useEffect(() => {
    if (!user) return
    const s = connectSocket()
    // Emit user:join now and on every reconnect
    s.emit('user:join', user.id)
    const rejoin = () => s.emit('user:join', user.id)
    s.on('connect', rejoin)
    const handler = (d: { title: string; body: string }) => {
      showLocalNotification(d.title, d.body)
    }
    s.on('notification:new', handler)
    return () => {
      s.off('connect', rejoin)
      s.off('notification:new', handler)
    }
  }, [user?.id])
  return null
}

function Guard({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-4 bg-white">
      <img src="/only_logo.png" alt="GoTogether" className="w-16 h-16 rounded-2xl" />
      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #714B67', borderTopColor: 'transparent' }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/home" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-4 bg-white">
      <img src="/only_logo.png" alt="GoTogether" className="w-16 h-16 rounded-2xl" />
      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #714B67', borderTopColor: 'transparent' }} />
    </div>
  )

  const home = user?.role === 'ADMIN' ? '/admin' : '/home'

  return (
    <>
      <NotificationBridge />
      <Routes>
        <Route path="/"       element={<Navigate to={user ? home : '/login'} replace />} />
        <Route path="/login"  element={user ? <Navigate to={home} replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to={home} replace /> : <Signup />} />

        {/* Employee routes */}
        <Route path="/home"        element={<Guard><Home /></Guard>} />
        <Route path="/find-ride"   element={<Guard><FindRide /></Guard>} />
        <Route path="/offer-ride"  element={<Guard><OfferRide /></Guard>} />
        <Route path="/trips"       element={<Guard><MyTrips /></Guard>} />
        <Route path="/trip/:id"    element={<Guard><TripDetail /></Guard>} />
        <Route path="/payment/:bookingId/:tripId/:amount" element={<Guard><Payment /></Guard>} />
        <Route path="/wallet"      element={<Guard><Wallet /></Guard>} />
        <Route path="/profile"     element={<Guard><Profile /></Guard>} />
        <Route path="/history"     element={<Guard><RideHistory /></Guard>} />
        <Route path="/notifications" element={<Guard><Notifications /></Guard>} />

        {/* Admin routes */}
        <Route path="/admin"           element={<Guard adminOnly><AdminDashboard /></Guard>} />
        <Route path="/admin/employees" element={<Guard adminOnly><AdminEmployees /></Guard>} />
        <Route path="/admin/vehicles"  element={<Guard adminOnly><AdminVehicles /></Guard>} />
        <Route path="/admin/reports"   element={<Guard adminOnly><AdminReports /></Guard>} />
        <Route path="/admin/settings"  element={<Guard adminOnly><AdminSettings /></Guard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
