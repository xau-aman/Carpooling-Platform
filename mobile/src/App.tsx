import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Login from './pages/Login'
import Home from './pages/Home'
import FindRide from './pages/FindRide'
import OfferRide from './pages/OfferRide'
import MyTrips from './pages/MyTrips'
import TripDetail from './pages/TripDetail'
import Wallet from './pages/Wallet'
import Profile from './pages/Profile'
import { Home as HomeIcon, Search, Car, List, User } from 'lucide-react'

const NAV = [
  { to: '/home',      icon: HomeIcon, label: 'Home' },
  { to: '/find-ride', icon: Search,   label: 'Find' },
  { to: '/offer-ride',icon: Car,      label: 'Offer' },
  { to: '/trips',     icon: List,     label: 'Trips' },
  { to: '/profile',   icon: User,     label: 'Profile' },
]

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const hide = ['/', '/login', '/signup'].includes(location.pathname) || location.pathname.startsWith('/trip/')
  if (hide) return null

  return (
    <nav className="bottom-nav">
      {NAV.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to || (to !== '/home' && location.pathname.startsWith(to))
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

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-4 bg-white">
      <img src="/only_logo.png" alt="GoTogether" className="w-16 h-16 rounded-2xl" />
      <div className="w-8 h-8 border-3 border-[#714B67] border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
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

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={user ? '/home' : '/login'} replace />} />
        <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login />} />
        <Route path="/home"       element={<Guard><Home /></Guard>} />
        <Route path="/find-ride"  element={<Guard><FindRide /></Guard>} />
        <Route path="/offer-ride" element={<Guard><OfferRide /></Guard>} />
        <Route path="/trips"      element={<Guard><MyTrips /></Guard>} />
        <Route path="/trip/:id"   element={<Guard><TripDetail /></Guard>} />
        <Route path="/wallet"     element={<Guard><Wallet /></Guard>} />
        <Route path="/profile"    element={<Guard><Profile /></Guard>} />
        <Route path="*"           element={<Navigate to="/" replace />} />
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
