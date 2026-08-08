import { useState, ReactNode, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../lib/socket'
import {
  LayoutDashboard, Search, Car, History,
  BarChart2, Settings, Users, Menu, X, LogOut, Bell,
} from 'lucide-react'
import api from '../lib/api'

const employeeNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: '#714B67' },
  { to: '/find-ride', icon: Search, label: 'Find Ride', color: '#00A09D' },
  { to: '/offer-ride', icon: Car, label: 'Offer Ride', color: '#F06050' },
  { to: '/history', icon: History, label: 'Ride History', color: '#6CC1ED' },
  { to: '/reports', icon: BarChart2, label: 'Reports', color: '#F0A500' },
  { to: '/settings', icon: Settings, label: 'Settings', color: '#868E96' },
]

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', color: '#714B67' },
  { to: '/admin/employees', icon: Users, label: 'Employees', color: '#00A09D' },
  { to: '/admin/vehicles', icon: Car, label: 'Vehicles', color: '#F06050' },
  { to: '/admin/reports', icon: BarChart2, label: 'Reports', color: '#F0A500' },
  { to: '/admin/settings', icon: Settings, label: 'Settings', color: '#868E96' },
]

function NavItems({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const nav = user?.role === 'ADMIN' ? adminNav : employeeNav

  return (
    <>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard' || to === '/admin'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'nav-active shadow-sm'
                  : 'text-[#495057] hover:bg-[#F5F5F5]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
                  style={{ background: isActive ? color : '#F5F5F5' }}
                >
                  <Icon size={15} style={{ color: isActive ? 'white' : color }} />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-[#DEE2E6] pt-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F5F5F5] transition-colors">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: 'linear-gradient(135deg, #714B67, #875A7B)' }}
          >
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-[#212529]">{user?.name}</p>
            <p className="text-xs text-[#868E96] truncate capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="text-[#868E96] hover:text-[#D9534F] transition-colors p-1.5 rounded-lg hover:bg-[#FFF5F5]"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)

  // Load initial unread count
  useEffect(() => {
    if (!user) return
    api.get('/notifications').then(r => {
      setNotifCount(r.data.data.filter((n: { isRead: boolean }) => !n.isRead).length)
    }).catch(() => {})
  }, [user])

  // Real-time notification count via socket
  useEffect(() => {
    if (!user) return
    const socket = getSocket()
    if (!socket) return
    const handler = () => setNotifCount(c => c + 1)
    socket.on('notification:new', handler)
    return () => { socket.off('notification:new', handler) }
  }, [user])

  return (
    <div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="w-64 hidden lg:flex flex-col bg-white border-r border-[#DEE2E6] h-full shrink-0 shadow-sm">
        <div className="px-5 py-5 border-b border-[#DEE2E6]">
          <div className="flex items-center gap-2.5">
            <img src="/only_logo.png" alt="GoTogether" className="w-9 h-9 rounded-xl shrink-0 object-cover" />
            <div>
              <span className="font-display font-black text-lg tracking-tight text-[#212529]">GoTogether</span>
              <p className="text-[10px] text-[#868E96] uppercase tracking-wider leading-none mt-0.5">Carpooling</p>
            </div>
          </div>
        </div>
        <NavItems />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 h-full flex flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#DEE2E6]">
              <div className="flex items-center gap-2">
                <img src="/only_logo.png" alt="GoTogether" className="w-8 h-8 rounded-xl object-cover" />
                <span className="font-display font-black text-lg text-[#212529]">GoTogether</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-[#F5F5F5] text-[#868E96]">
                <X size={18} />
              </button>
            </div>
            <NavItems onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#DEE2E6] shrink-0 shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl hover:bg-[#F5F5F5] text-[#495057]">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/only_logo.png" alt="GoTogether" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-display font-black text-lg text-[#212529]">GoTogether</span>
          </div>
          <button
            onClick={() => { setNotifCount(0); navigate('/notifications') }}
            className="relative p-2 rounded-xl hover:bg-[#F5F5F5] text-[#495057]"
          >
            <Bell size={20} />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white" style={{ background: '#F06050' }}>
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
