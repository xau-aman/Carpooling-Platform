import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, ChevronRight, MapPin, Clock } from 'lucide-react'
import api from '../lib/api'

interface Trip {
  id: string; status: string; createdAt: string
  ride: {
    pickupAddress: string; destAddress: string; farePerSeat: number
    departureTime: string; distanceKm?: number
    driver: { name: string }; vehicle: { model: string }
  }
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  BOOKED:            { label: 'Upcoming',        bg: '#EFF6FF', color: '#2563EB' },
  STARTED:           { label: 'Starting',        bg: '#EFF6FF', color: '#2563EB' },
  IN_PROGRESS:       { label: '🔴 Live',         bg: '#FFF7ED', color: '#EA580C' },
  PAYMENT_PENDING:   { label: 'Pay Now',         bg: '#FEF9C3', color: '#CA8A04' },
  PAYMENT_COMPLETED: { label: 'Completed',       bg: '#F0FDF4', color: '#16A34A' },
  COMPLETED:         { label: 'Completed',       bg: '#F0FDF4', color: '#16A34A' },
  CANCELLED:         { label: 'Cancelled',       bg: '#F5F5F5', color: '#6B7280' },
}

export default function MyTrips() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'past'>('active')

  useEffect(() => {
    api.get('/trips').then(r => setTrips(r.data.data)).finally(() => setLoading(false))
  }, [])

  const active = trips.filter(t => ['BOOKED', 'STARTED', 'IN_PROGRESS', 'PAYMENT_PENDING'].includes(t.status))
  const past = trips.filter(t => ['PAYMENT_COMPLETED', 'COMPLETED', 'CANCELLED'].includes(t.status))
  const shown = tab === 'active' ? active : past

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white px-4 pb-0 shadow-sm" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <h1 className="font-display font-bold text-2xl text-[#0f0f0f] mb-4">My Trips</h1>
        <div className="flex gap-1 bg-[#f5f5f5] rounded-2xl p-1">
          {(['active', 'past'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t ? 'bg-white text-[#0f0f0f] shadow-sm' : 'text-[#6b6b6b]'}`}
            >
              {t === 'active' ? `Active (${active.length})` : `Past (${past.length})`}
            </button>
          ))}
        </div>
        <div className="h-4" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 safe-bottom">
        {loading && [1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}

        {!loading && shown.length === 0 && (
          <div className="text-center py-16">
            <Car size={48} className="mx-auto mb-3 text-[#e5e5e5]" />
            <p className="font-bold text-[#0f0f0f]">No {tab} trips</p>
            {tab === 'active' && (
              <button onClick={() => navigate('/find-ride')} className="m-btn m-btn-primary mt-4 text-sm">
                Find a Ride
              </button>
            )}
          </div>
        )}

        {shown.map(trip => {
          const sc = statusConfig[trip.status] ?? { label: trip.status, bg: '#f5f5f5', color: '#6b6b6b' }
          return (
            <button
              key={trip.id}
              onClick={() => navigate(`/trip/${trip.id}`)}
              className="w-full m-card p-4 text-left active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="m-badge text-xs font-bold" style={{ background: sc.bg, color: sc.color }}>
                  {sc.label}
                </span>
                <p className="font-display font-black text-xl text-[#f97316]">₹{trip.ride.farePerSeat}</p>
              </div>
              <p className="font-bold text-base text-[#0f0f0f]">
                {trip.ride.pickupAddress.split(',')[0]}
              </p>
              <p className="text-sm text-[#6b6b6b]">→ {trip.ride.destAddress.split(',')[0]}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-[#6b6b6b]">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(trip.ride.departureTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                {trip.ride.distanceKm && (
                  <span className="flex items-center gap-1"><MapPin size={10} /> {trip.ride.distanceKm}km</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f5f5f5]">
                <p className="text-xs text-[#6b6b6b]">{trip.ride.driver.name} · {trip.ride.vehicle.model}</p>
                <ChevronRight size={16} className="text-[#6b6b6b]" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
