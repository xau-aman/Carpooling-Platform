import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, IndianRupee, Users, Car } from 'lucide-react'
import api from '../../lib/api'

interface Report {
  totalTrips: number; totalDistance: number; totalFuelCost: number; totalPassengers: number
  vehicleStats: Array<{ vehicleId: string; _count: { id: number }; _sum: { distanceKm: number | null } }>
}

export default function AdminReports() {
  const navigate = useNavigate()
  const [data, setData] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/reports').then(r => setData(r.data.data)).finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Total Trips', value: data?.totalTrips ?? 0, icon: MapPin, color: '#714B67' },
    { label: 'Total Distance', value: `${data?.totalDistance ?? 0}km`, icon: Car, color: '#f97316' },
    { label: 'Fuel Cost', value: `₹${data?.totalFuelCost ?? 0}`, icon: IndianRupee, color: '#dc2626' },
    { label: 'Passengers', value: data?.totalPassengers ?? 0, icon: Users, color: '#16a34a' },
  ]

  const rows = [
    { label: 'Total Completed Trips', value: data?.totalTrips ?? 0 },
    { label: 'Total Distance Covered', value: `${data?.totalDistance ?? 0} km` },
    { label: 'Estimated Fuel Cost', value: `₹${data?.totalFuelCost ?? 0}` },
    { label: 'Total Passengers Served', value: data?.totalPassengers ?? 0 },
    { label: 'Active Vehicles', value: data?.vehicleStats?.length ?? 0 },
  ]

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      <div className="bg-white px-4 shadow-sm shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)', paddingBottom: 16 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-xl">Reports</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 safe-bottom">
        {loading ? (
          <>{[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {stats.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="m-card p-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${color}18` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <p className="font-display font-black text-2xl text-[#0f0f0f]">{value}</p>
                  <p className="text-xs text-[#6b6b6b] mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Vehicle utilization */}
            {(data?.vehicleStats?.length ?? 0) > 0 && (
              <div className="m-card p-4">
                <p className="font-bold text-sm text-[#0f0f0f] mb-3">Vehicle Utilization</p>
                <div className="space-y-2">
                  {data!.vehicleStats.slice(0, 5).map((v, i) => {
                    const max = Math.max(...data!.vehicleStats.map(x => x._count.id), 1)
                    const pct = (v._count.id / max) * 100
                    return (
                      <div key={v.vehicleId}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#6b6b6b]">Vehicle {i + 1}</span>
                          <span className="font-bold">{v._count.id} trips · {Math.round(v._sum.distanceKm ?? 0)}km</span>
                        </div>
                        <div className="h-2 bg-[#f5f5f5] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#f97316' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Summary table */}
            <div className="m-card overflow-hidden">
              <div className="px-4 py-3" style={{ background: '#0f0f0f' }}>
                <p className="font-bold text-sm text-white uppercase tracking-wider">Financial Summary</p>
              </div>
              {rows.map((row, i) => (
                <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${i < rows.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}>
                  <span className="text-sm text-[#6b6b6b]">{row.label}</span>
                  <span className="font-bold text-[#0f0f0f]">{row.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
