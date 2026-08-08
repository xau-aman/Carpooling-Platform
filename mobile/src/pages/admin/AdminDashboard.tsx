import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Car, MapPin, TrendingUp, ChevronRight, Settings, BarChart2 } from 'lucide-react'
import api from '../../lib/api'

interface Stats { employees: number; vehicles: number; ridesThisMonth: number; completedTrips: number }

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data.data)).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Employees', value: stats?.employees ?? 0, icon: Users, color: '#714B67' },
    { label: 'Vehicles', value: stats?.vehicles ?? 0, icon: Car, color: '#f97316' },
    { label: 'Rides This Month', value: stats?.ridesThisMonth ?? 0, icon: MapPin, color: '#00A09D' },
    { label: 'Completed Trips', value: stats?.completedTrips ?? 0, icon: TrendingUp, color: '#16a34a' },
  ]

  const sections = [
    { label: 'Employees', sub: 'Manage access', icon: Users, to: '/admin/employees', color: '#714B67' },
    { label: 'Vehicles', sub: 'Fleet overview', icon: Car, to: '/admin/vehicles', color: '#f97316' },
    { label: 'Reports', sub: 'Analytics & stats', icon: BarChart2, to: '/admin/reports', color: '#00A09D' },
    { label: 'Settings', sub: 'Org configuration', icon: Settings, to: '/admin/settings', color: '#6b6b6b' },
  ]

  return (
    <div className="scroll-area safe-bottom">
      <div className="page-enter">
        <div className="px-4 pt-4" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
          <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#714B67,#875A7B)' }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <p className="text-white/60 text-sm">Admin Panel</p>
            <h1 className="font-display font-black text-3xl text-white mt-0.5">Dashboard</h1>
          </div>
        </div>

        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          {loading ? [1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />) :
            cards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="m-card p-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${color}18` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="font-display font-black text-2xl text-[#0f0f0f]">{value}</p>
                <p className="text-xs text-[#6b6b6b] mt-0.5">{label}</p>
              </div>
            ))
          }
        </div>

        <div className="px-4 mt-5 space-y-3 pb-4">
          <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">Manage</p>
          {sections.map(({ label, sub, icon: Icon, to, color }) => (
            <button key={to} onClick={() => navigate(to)}
              className="w-full m-card p-4 flex items-center gap-4 active:scale-[0.99] transition-transform">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-[#0f0f0f]">{label}</p>
                <p className="text-xs text-[#6b6b6b]">{sub}</p>
              </div>
              <ChevronRight size={18} className="text-[#9ca3af]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
