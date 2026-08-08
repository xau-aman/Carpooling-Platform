import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, Car, ChevronRight, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import Button from '../components/Button'
import { Badge, LoadingState, EmptyState, PageHeader } from '../components/ui'
import { Trip } from '../types'
import { useAuth } from '../context/AuthContext'
import { connectSocket } from '../lib/socket'

type Tab = 'upcoming' | 'active' | 'completed'

const statusConfig: Record<string, { label: string; variant: 'info' | 'warning' | 'danger' | 'success' | 'default' }> = {
  BOOKED:            { label: 'Upcoming',        variant: 'info' },
  STARTED:           { label: 'Starting',        variant: 'info' },
  IN_PROGRESS:       { label: '🔴 Live',         variant: 'warning' },
  PAYMENT_PENDING:   { label: 'Pay Now',         variant: 'danger' },
  PAYMENT_COMPLETED: { label: 'Completed',       variant: 'success' },
  COMPLETED:         { label: 'Completed',       variant: 'success' },
  CANCELLED:         { label: 'Cancelled',       variant: 'default' },
}

export default function MyTrips() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('upcoming')

  const refresh = useCallback(() =>
    api.get('/trips').then(r => setTrips(r.data.data)).catch(() => {})
  , [])

  useEffect(() => { refresh().finally(() => setLoading(false)) }, [])

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  useEffect(() => {
    const s = connectSocket()
    s.on('trip:started',      refresh)
    s.on('trip:completed',    refresh)
    s.on('trip:cancelled',    refresh)
    s.on('trip:payment_done', refresh)
    s.on('booking:cancelled', refresh)
    return () => {
      s.off('trip:started',      refresh)
      s.off('trip:completed',    refresh)
      s.off('trip:cancelled',    refresh)
      s.off('trip:payment_done', refresh)
      s.off('booking:cancelled', refresh)
    }
  }, [refresh])

  if (loading) return <LoadingState />

  const upcoming  = trips.filter(t => ['BOOKED', 'STARTED'].includes(t.status))
  const active    = trips.filter(t => t.status === 'IN_PROGRESS')
  const completed = trips.filter(t => ['COMPLETED', 'PAYMENT_COMPLETED', 'PAYMENT_PENDING', 'CANCELLED'].includes(t.status))

  const filtered = tab === 'upcoming' ? upcoming : tab === 'active' ? active : completed

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="My Trips" />

      {/* Active trip alert */}
      {active.length > 0 && (
        <div
          className="mb-5 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
          onClick={() => navigate(`/trips/${active[0].id}`)}
        >
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <div>
              <p className="font-bold text-white text-sm">Active Trip in Progress</p>
              <p className="text-white/70 text-xs mt-0.5">
                {active[0].ride.pickupAddress.split(',')[0]} → {active[0].ride.destAddress.split(',')[0]}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-white" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl mb-6" style={{ background: '#EEEDF8' }}>
        {([
          { key: 'upcoming',  label: 'Upcoming',  count: upcoming.length },
          { key: 'active',    label: 'Active',    count: active.length },
          { key: 'completed', label: 'History',   count: completed.length },
        ] as { key: Tab; label: string; count: number }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t.key ? 'bg-white text-[#212529] shadow-sm' : 'text-[#868E96] hover:text-[#495057]'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                tab === t.key ? 'bg-[#714B67] text-white' : 'bg-[#DEE2E6] text-[#495057]'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          message={tab === 'upcoming' ? 'No upcoming trips. Find a ride to get started!' : tab === 'active' ? 'No active trips right now.' : 'No trip history yet.'}
          icon={<Car size={40} />}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map(trip => {
            const sc = statusConfig[trip.status] ?? { label: trip.status, variant: 'default' as const }
            const isPending = trip.status === 'PAYMENT_PENDING'
            const isLive = trip.status === 'IN_PROGRESS'
            const booking = trip.ride.bookings?.find(b => b.userId === user?.id)

            return (
              <div
                key={trip.id}
                className={`card p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all ${isLive ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    {/* Route with dots */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#00A09D]" />
                        <div className="w-0.5 h-5 bg-[#DEE2E6]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#F06050]" />
                      </div>
                      <div className="space-y-2 flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#212529] truncate">{trip.ride.pickupAddress.split(',')[0]}</p>
                        <p className="font-semibold text-sm text-[#495057] truncate">{trip.ride.destAddress.split(',')[0]}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4 flex flex-col items-end gap-1.5">
                    <p className="font-display font-black text-2xl" style={{ color: '#714B67' }}>₹{trip.ride.farePerSeat}</p>
                    <Badge variant={sc.variant}>{sc.label}</Badge>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-[#868E96] mb-4">
                  <span className="flex items-center gap-1.5">
                    <Clock size={11} />
                    {new Date(trip.ride.departureTime).toLocaleString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  {trip.ride.distanceKm && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={11} />
                      {trip.ride.distanceKm} km
                    </span>
                  )}
                </div>

                {/* Driver + vehicle */}
                <div className="flex items-center gap-2 pt-3 border-t border-[#F5F5F5]">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                    style={{ background: 'linear-gradient(135deg, #714B67, #875A7B)' }}>
                    {trip.ride.driver.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#495057] truncate">
                      {trip.ride.driver.name} · {trip.ride.vehicle.model} · <span className="font-mono">{trip.ride.vehicle.registration}</span>
                    </p>
                  </div>
                  {isPending && booking && (
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/payment/${booking.id}/${trip.id}/${trip.ride.farePerSeat * (booking.seats ?? 1)}`) }}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full text-white shrink-0"
                      style={{ background: '#F06050' }}
                    >
                      <AlertCircle size={11} /> Pay Now
                    </button>
                  )}
                  {!isPending && (
                    <ChevronRight size={16} className="text-[#868E96] shrink-0" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FAB */}
      <div className="fixed bottom-8 right-8">
        <Button variant="primary" onClick={() => navigate('/find-ride')} icon={<Car size={16} />}>
          Find Ride
        </Button>
      </div>
    </div>
  )
}
