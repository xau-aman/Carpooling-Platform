import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Car, MapPin, TrendingUp, ChevronRight, Settings, BarChart2, LogOut, Bell } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

interface Stats { employees: number; vehicles: number; ridesThisMonth: number; completedTrips: number }

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data.data)).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Employees', value: stats?.employees ?? 0, icon: Users, color: '#714B67', bg: '#714B6715' },
    { label: 'Vehicles', value: stats?.vehicles ?? 0, icon: Car, color: '#f97316', bg: '#f9731615' },
    { label: 'Rides / Month', value: stats?.ridesThisMonth ?? 0, icon: MapPin, color: '#00A09D', bg: '#00A09D15' },
    { label: 'Completed', value: stats?.completedTrips ?? 0, icon: TrendingUp, color: '#16a34a', bg: '#16a34a15' },
  ]

  const sections = [
    { label: 'Employees', sub: 'Manage staff & access', icon: Users, to: '/admin/employees', color: '#714B67' },
    { label: 'Vehicles', sub: 'Fleet management', icon: Car, to: '/admin/vehicles', color: '#f97316' },
    { label: 'Reports', sub: 'Analytics & insights', icon: BarChart2, to: '/admin/reports', color: '#00A09D' },
    { label: 'Settings', sub: 'Org configuration', icon: Settings, to: '/admin/settings', color: '#6b6b6b' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="scroll-area safe-bottom">
      <div className="page-enter">

        {/* Header */}
        <div className="px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
          <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0f0f0f 0%,#2d1f2a 100%)' }}>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/5" />
            <div className="relative">
              {/* Top row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0"
                    style={{ background: 'linear-gradient(135deg,#714B67,#875A7B)' }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white/50 text-xs">Admin</p>
                    <p className="text-white font-bold text-base leading-tight">{user?.name}</p>
                    <p className="text-white/40 text-xs truncate max-w-[160px]">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate('/notifications')}
                    className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center active:scale-95">
                    <Bell size={18} className="text-white" />
                  </button>
                  <button onClick={handleLogout}
                    className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center active:scale-95">
                    <LogOut size={18} className="text-red-400" />
                  </button>
                </div>
              </div>
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-white/80 text-xs font-semibold">GoTogether Admin Panel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          {loading
            ? [1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)
            : cards.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="m-card p-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: bg }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <p className="font-display font-black text-3xl text-[#0f0f0f]">{value}</p>
                <p className="text-xs text-[#6b6b6b] mt-0.5 font-medium">{label}</p>
              </div>
            ))
          }
        </div>

        {/* Manage sections */}
        <div className="px-4 mt-5">
          <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-3">Manage</p>
          <div className="space-y-2">
            {sections.map(({ label, sub, icon: Icon, to, color }) => (
              <button key={to} onClick={() => navigate(to)}
                className="w-full m-card p-4 flex items-center gap-4 active:scale-[0.99] transition-transform">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `${color}15` }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-[#0f0f0f]">{label}</p>
                  <p className="text-xs text-[#6b6b6b] mt-0.5">{sub}</p>
                </div>
                <ChevronRight size={18} className="text-[#d1d5db]" />
              </button>
            ))}
          </div>
        </div>

        {/* Logout button at bottom */}
        <div className="px-4 mt-5 mb-2">
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl font-bold text-[#dc2626] bg-white border border-[#fecaca] active:scale-[0.98] transition-transform">
            <LogOut size={18} /> Sign Out
          </button>
        </div>

      </div>
    </div>
  )
}
