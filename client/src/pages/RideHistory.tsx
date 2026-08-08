import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ChevronRight } from 'lucide-react'
import api from '../lib/api'
import { PageHeader, LoadingState, EmptyState, Badge } from '../components/ui'
import { Trip } from '../types'

type Filter = 'ALL' | 'COMPLETED' | 'CANCELLED'

export default function RideHistory() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('ALL')

  useEffect(() => {
    api.get('/trips').then(r => {
      const done = r.data.data.filter((t: Trip) =>
        ['COMPLETED', 'PAYMENT_COMPLETED', 'PAYMENT_PENDING', 'CANCELLED'].includes(t.status)
      )
      setTrips(done)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = trips.filter(t => {
    if (filter === 'COMPLETED') return ['COMPLETED', 'PAYMENT_COMPLETED'].includes(t.status)
    if (filter === 'CANCELLED') return t.status === 'CANCELLED'
    return true
  })

  if (loading) return <LoadingState />

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Ride History" subtitle={`${filtered.length} trips`} />

      {/* Filter tabs */}
      <div className="flex border-2 border-[#0f0f0f] mb-6 w-fit shadow-[2px_2px_0_#0f0f0f]">
        {(['ALL', 'COMPLETED', 'CANCELLED'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              filter === f ? 'bg-[#0f0f0f] text-white' : 'bg-white text-[#3d3d3d] hover:bg-[#f0ede6]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No ride history found." icon={<MapPin size={40} />} />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(trip => (
            <button
              key={trip.id}
              onClick={() => navigate(`/trips/${trip.id}`)}
              className="neo-card p-4 text-left w-full hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#6b6b6b] uppercase mb-1">
                    {new Date(trip.ride.departureTime).toLocaleDateString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#16a34a] border border-[#0f0f0f] shrink-0" />
                    <p className="font-bold truncate">{trip.ride.pickupAddress.split(',')[0]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#dc2626] border border-[#0f0f0f] shrink-0" />
                    <p className="font-bold truncate">{trip.ride.destAddress.split(',')[0]}</p>
                  </div>
                  <p className="text-sm text-[#6b6b6b] mt-1.5">
                    {trip.ride.driver.name} · {trip.ride.vehicle.model}
                    {trip.ride.distanceKm ? ` · ${trip.ride.distanceKm}km` : ''}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="font-display font-bold text-lg text-[#f97316]">₹{trip.ride.farePerSeat}</p>
                  {['COMPLETED', 'PAYMENT_COMPLETED'].includes(trip.status)
                    ? <Badge variant="success">Completed</Badge>
                    : trip.status === 'PAYMENT_PENDING'
                    ? <Badge variant="warning">Unpaid</Badge>
                    : <Badge variant="danger">Cancelled</Badge>
                  }
                  <ChevronRight size={14} className="text-[#6b6b6b]" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
