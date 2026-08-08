import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Power, Car } from 'lucide-react'
import api from '../../lib/api'
import { useToast } from '../../context/ToastContext'

interface Vehicle {
  id: string; model: string; registration: string; seats: number
  fuelType: string; color: string; isActive: boolean
  user: { name: string; email: string }
}

export default function AdminVehicles() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/vehicles/org/all').then(r => setVehicles(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const toggle = async (v: Vehicle) => {
    try {
      await api.patch(`/vehicles/${v.id}/toggle`, { isActive: !v.isActive })
      await load()
      toast(v.isActive ? 'Vehicle deactivated' : 'Vehicle activated', 'success')
    } catch { toast('Failed', 'error') }
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      <div className="bg-white px-4 shadow-sm shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)', paddingBottom: 16 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-xl flex-1">Vehicles</h1>
          <span className="text-sm text-[#6b6b6b] font-semibold">{vehicles.length} total</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 safe-bottom">
        {loading && [1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}

        {!loading && vehicles.map(v => (
          <div key={v.id} className="m-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: v.isActive ? '#f97316' + '18' : '#f5f5f5' }}>
                  <Car size={20} style={{ color: v.isActive ? '#f97316' : '#9ca3af' }} />
                </div>
                <div>
                  <p className="font-bold text-[#0f0f0f]">{v.model}</p>
                  <p className="font-mono text-xs text-[#6b6b6b]">{v.registration}</p>
                  <p className="text-xs text-[#6b6b6b]">{v.seats} seats · {v.fuelType} · {v.color}</p>
                </div>
              </div>
              <button onClick={() => toggle(v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border active:scale-95"
                style={v.isActive
                  ? { background: '#fef2f2', color: '#dc2626', borderColor: '#dc2626' }
                  : { background: '#f0fdf4', color: '#16a34a', borderColor: '#16a34a' }}>
                <Power size={12} />
                {v.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
            <div className="mt-2 pt-2 border-t border-[#f5f5f5] flex items-center justify-between">
              <p className="text-xs text-[#6b6b6b]">Driver: {v.user.name}</p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={v.isActive ? { background: '#f0fdf4', color: '#16a34a' } : { background: '#f5f5f5', color: '#6b6b6b' }}>
                {v.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}

        {!loading && vehicles.length === 0 && (
          <div className="text-center py-16">
            <Car size={48} className="mx-auto mb-3 text-[#e5e5e5]" />
            <p className="font-bold text-[#0f0f0f]">No vehicles registered</p>
          </div>
        )}
      </div>
    </div>
  )
}
