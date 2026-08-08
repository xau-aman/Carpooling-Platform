import { useEffect, useState } from 'react'
import { Power } from 'lucide-react'
import api from '../../lib/api'
import { PageHeader, LoadingState, Badge } from '../../components/ui'
import { Vehicle } from '../../types'

interface VehicleWithUser extends Vehicle {
  user: { id: string; name: string; email: string }
}

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState<VehicleWithUser[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/vehicles/org/all').then(r => setVehicles(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const toggle = async (v: VehicleWithUser) => {
    await api.patch(`/vehicles/${v.id}/toggle`, { isActive: !v.isActive })
    await load()
  }

  if (loading) return <LoadingState />

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Registered Vehicles" subtitle={`${vehicles.length} total`} />

      <div className="neo-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f0f0f] text-white">
                {['Registration', 'Model', 'Capacity', 'Fuel', 'Driver', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v, i) => (
                <tr key={v.id} className={`border-b border-[#f0ede6] ${i % 2 === 0 ? 'bg-white' : 'bg-[#faf9f6]'}`}>
                  <td className="px-4 py-3 font-mono font-bold">{v.registration}</td>
                  <td className="px-4 py-3 font-semibold">{v.model}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{v.seats} seats</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{v.fuelType}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{v.user.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={v.isActive ? 'success' : 'default'}>{v.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle(v)}
                      className={`neo-btn text-xs px-2 py-1 flex items-center gap-1 ${v.isActive ? 'bg-[#fef2f2] text-[#dc2626] border-[#dc2626]' : 'bg-[#f0fdf4] text-[#16a34a] border-[#16a34a]'}`}
                    >
                      <Power size={12} />
                      {v.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
