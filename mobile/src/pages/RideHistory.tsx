import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, ChevronRight, RefreshCw } from 'lucide-react'
import api from '../lib/api'

interface Trip {
  id: string; status: string
  ride: {
    pickupAddress: string; destAddress: string; farePerSeat: number
    departureTime: string; distanceKm?: number
    driver: { name: string }; vehicle: { model: string }
  }
}

type Filter = 'ALL' | 'COMPLETED' | 'CANCELLED'

const statusStyle: Record<string, { label: string; bg: string; color: string }> = {
  COMPLETED:         { label: 'Completed', bg: '#f0fdf4', color: '#16a34a' },
  PAYMENT_COMPLETED: { label: 'Completed', bg: '#f0fdf4', color: '#16a34a' },
  PAYMENT_PENDING:   { label: 'Unpaid',    bg: '#fef9c3', color: '#ca8a04' },
  CANCELLED:         { label: 'Cancelled', bg: '#f5f5f5', color: '#6b7280' },
}

export default function RideHistory() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [refreshing, setRefreshing] = useState(false)

  const loadTrips = () => api.get('/trips').then(r => {
    setTrips(r.data.data.filter((t: Trip) =>
      ['COMPLETED', 'PAYMENT_COMPLETED', 'PAYMENT_PENDING', 'CANCELLED'].includes(t.status)
    ))
  }).finally(() => setLoading(false))

  useEffect(() => { loadTrips() }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    api.get('/trips').then(r => {
      setTrips(r.data.data.filter((t: Trip) =>
        ['COMPLETED', 'PAYMENT_COMPLETED', 'PAYMENT_PENDING', 'CANCELLED'].includes(t.status)
      ))
    }).finally(() => setRefreshing(false))
  }

  const filtered = trips.filter(t => {
    if (filter === 'COMPLETED') return ['COMPLETED', 'PAYMENT_COMPLETED'].includes(t.status)
    if (filter === 'CANCELLED') return t.status === 'CANCELLED'
    return true
  })

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      <div className="bg-white px-4 py-4 shadow-sm shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-xl flex-1">Ride History</h1>
          <button onClick={handleRefresh} disabled={refreshing} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
            <RefreshCw size={16} className={`text-[#6b6b6b] ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex gap-1 bg-[#f5f5f5] rounded-2xl p-1">
          {(['ALL', 'COMPLETED', 'CANCELLED'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-white text-[#0f0f0f] shadow-sm' : 'text-[#6b6b6b]'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 24px)' }}>
        {loading && [1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <MapPin size={48} className="mx-auto mb-3 text-[#e5e5e5]" />
            <p className="font-bold text-[#0f0f0f]">No history found</p>
          </div>
        )}

        {filtered.map(trip => {
          const sc = statusStyle[trip.status] ?? { label: trip.status, bg: '#f5f5f5', color: '#6b6b6b' }
          return (
            <button key={trip.id} onClick={() => navigate(`/trip/${trip.id}`)}
              className="w-full bg-white rounded-2xl p-4 text-left active:scale-[0.99] transition-transform shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#6b6b6b] mb-1.5">
                    {new Date(trip.ride.departureTime).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#16a34a] shrink-0" />
                    <p className="font-bold text-sm truncate">{trip.ride.pickupAddress.split(',')[0]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#dc2626] shrink-0" />
                    <p className="font-semibold text-sm text-[#6b6b6b] truncate">{trip.ride.destAddress.split(',')[0]}</p>
                  </div>
                  <p className="text-xs text-[#9ca3af] mt-1.5">
                    {trip.ride.driver.name} · {trip.ride.vehicle.model}
                    {trip.ride.distanceKm ? ` · ${trip.ride.distanceKm}km` : ''}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="font-display font-black text-xl text-[#f97316]">₹{trip.ride.farePerSeat}</p>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                  <ChevronRight size={14} className="text-[#9ca3af]" />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
