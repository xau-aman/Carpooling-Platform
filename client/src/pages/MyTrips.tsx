import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import api from '../lib/api'
import Button from '../components/Button'
import { Badge, LoadingState, EmptyState, PageHeader } from '../components/ui'
import { Trip, TripStatus } from '../types'

type Tab = 'upcoming' | 'active' | 'completed'

const statusBadge = (s: TripStatus) => {
  if (['BOOKED', 'STARTED'].includes(s)) return <Badge variant="info">{s}</Badge>
  if (s === 'IN_PROGRESS') return <Badge variant="warning">IN PROGRESS</Badge>
  if (['COMPLETED', 'PAYMENT_COMPLETED'].includes(s)) return <Badge variant="success">COMPLETED</Badge>
  if (s === 'PAYMENT_PENDING') return <Badge variant="danger">PAYMENT PENDING</Badge>
  return <Badge>{s}</Badge>
}

export default function MyTrips() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('upcoming')

  useEffect(() => {
    api.get('/trips').then(r => setTrips(r.data.data)).finally(() => setLoading(false))
  }, [])

  const filtered = trips.filter(t => {
    if (tab === 'upcoming') return ['BOOKED', 'STARTED'].includes(t.status)
    if (tab === 'active') return t.status === 'IN_PROGRESS'
    return ['COMPLETED', 'PAYMENT_COMPLETED', 'PAYMENT_PENDING', 'CANCELLED'].includes(t.status)
  })

  if (loading) return <LoadingState />

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="My Trips" />

      {/* Tabs */}
      <div className="flex border-2 border-[#0f0f0f] mb-6 w-fit">
        {(['upcoming', 'active', 'completed'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              tab === t ? 'bg-[#0f0f0f] text-white' : 'bg-white text-[#3d3d3d] hover:bg-[#f0ede6]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={`No ${tab} trips.`} icon={<MapPin size={40} />} />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(trip => (
            <div key={trip.id} className="neo-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold">
                    {trip.ride.pickupAddress.split(',')[0]} → {trip.ride.destAddress.split(',')[0]}
                  </p>
                  <p className="text-sm text-[#6b6b6b] mt-0.5">
                    {trip.ride.driver.name} · {trip.ride.vehicle.model} · {trip.ride.vehicle.registration}
                  </p>
                  <p className="text-sm text-[#6b6b6b]">
                    {new Date(trip.ride.departureTime).toLocaleString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="font-display font-bold text-lg text-[#f97316]">₹{trip.ride.farePerSeat}</p>
                  {statusBadge(trip.status)}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`/trips/${trip.id}`)}>
                View Trip →
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
