import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Car, MapPin, Leaf, IndianRupee, TrendingUp, Bell } from 'lucide-react'
import gsap from 'gsap'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import Button from '../components/Button'
import { StatCard, LoadingState, Badge } from '../components/ui'
import { Trip, Wallet } from '../types'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifCount, setNotifCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      api.get('/trips').then(r => setTrips(r.data.data)),
      api.get('/wallet').then(r => setWallet(r.data.data)),
      api.get('/notifications').then(r => setNotifCount(r.data.data.filter((n: { isRead: boolean }) => !n.isRead).length)),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading || !containerRef.current) return
    const els = containerRef.current.querySelectorAll('.anim-in')
    gsap.fromTo(els,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
    )
  }, [loading])

  const upcoming = trips.filter(t => ['BOOKED', 'STARTED'].includes(t.status))
  const active = trips.filter(t => t.status === 'IN_PROGRESS')
  const completed = trips.filter(t => ['PAYMENT_COMPLETED', 'COMPLETED'].includes(t.status))
  const totalSaved = completed.reduce((s, t) => s + t.ride.farePerSeat, 0)
  const totalKm = completed.reduce((s, t) => s + (t.ride.distanceKm ?? 0), 0)
  const co2Saved = Math.round(totalKm * 0.21 * 10) / 10

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  if (loading) return <LoadingState />

  return (
    <div className="max-w-4xl mx-auto" ref={containerRef}>
      {/* Greeting */}
      <div className="anim-in flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-black text-3xl text-[#0f0f0f] uppercase tracking-tight">
            {greeting}, {user?.name?.split(' ')[0]}.
          </h1>
          <p className="text-[#6b6b6b] mt-1">Where are you heading today?</p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="relative p-2 border-2 border-[#0f0f0f] bg-white hover:bg-[#f0ede6] transition-colors"
        >
          <Bell size={18} />
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#f97316] text-white text-[10px] font-bold flex items-center justify-center border border-white">
              {notifCount}
            </span>
          )}
        </button>
      </div>

      {/* Primary CTAs */}
      <div className="anim-in grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => navigate('/find-ride')}
          className="neo-card-lg p-6 text-left hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#f97316] border-2 border-[#0f0f0f] flex items-center justify-center">
              <Search size={18} className="text-white" />
            </div>
            <span className="text-2xl font-display font-black text-[#f0ede6] group-hover:text-[#f97316] transition-colors">→</span>
          </div>
          <h2 className="font-display font-bold text-lg uppercase">Find a Ride</h2>
          <p className="text-sm text-[#6b6b6b] mt-1">Search available rides near you</p>
        </button>

        <button
          onClick={() => navigate('/offer-ride')}
          className="neo-card-lg p-6 text-left hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform cursor-pointer group bg-[#0f0f0f]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#f97316] border-2 border-white flex items-center justify-center">
              <Car size={18} className="text-white" />
            </div>
            <span className="text-2xl font-display font-black text-white/20 group-hover:text-[#f97316] transition-colors">→</span>
          </div>
          <h2 className="font-display font-bold text-lg uppercase text-white">Offer a Ride</h2>
          <p className="text-sm text-white/50 mt-1">Share your commute, split costs</p>
        </button>
      </div>

      {/* Active trip banner */}
      {active.length > 0 && (
        <div className="anim-in mb-6">
          <div className="neo-card p-4 bg-[#f97316] border-[#f97316] flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-white uppercase text-sm">🔴 Active Trip</p>
              <p className="text-white/90 text-sm mt-0.5">
                {active[0].ride.pickupAddress.split(',')[0]} → {active[0].ride.destAddress.split(',')[0]}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/trips/${active[0].id}`)}>
              Track →
            </Button>
          </div>
        </div>
      )}

      {/* Upcoming Trip */}
      {upcoming.length > 0 && (
        <div className="anim-in mb-8">
          <h3 className="font-display font-bold text-xs uppercase tracking-widest text-[#6b6b6b] mb-3">Upcoming Trip</h3>
          <div className="neo-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info">{upcoming[0].status}</Badge>
                </div>
                <p className="font-bold text-lg">
                  {upcoming[0].ride.pickupAddress.split(',')[0]} → {upcoming[0].ride.destAddress.split(',')[0]}
                </p>
                <p className="text-sm text-[#6b6b6b] mt-1">
                  {upcoming[0].ride.driver.name} · {upcoming[0].ride.vehicle.model} · {upcoming[0].ride.vehicle.registration}
                </p>
                <p className="text-sm text-[#6b6b6b]">
                  {new Date(upcoming[0].ride.departureTime).toLocaleString('en-IN', {
                    weekday: 'short', day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-2xl text-[#f97316]">₹{upcoming[0].ride.farePerSeat}</p>
                <p className="text-xs text-[#6b6b6b]">per seat</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t-2 border-[#f0ede6] flex gap-2">
              <Button variant="dark" size="sm" onClick={() => navigate(`/trips/${upcoming[0].id}`)}>
                View Trip →
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/trips')}>
                All Trips
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="anim-in grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Trips" value={completed.length} icon={<MapPin size={20} />} />
        <StatCard label="Wallet" value={`₹${wallet?.balance ?? 0}`} icon={<IndianRupee size={20} />} accent />
        <StatCard label="Saved" value={`₹${totalSaved}`} icon={<TrendingUp size={20} />} />
        <StatCard label="CO₂ Saved" value={`${co2Saved}kg`} icon={<Leaf size={20} />} />
      </div>

      {/* Recent trips */}
      {completed.length > 0 && (
        <div className="anim-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-[#6b6b6b]">Recent Trips</h3>
            <button onClick={() => navigate('/history')} className="text-xs font-bold text-[#f97316] hover:underline">View All →</button>
          </div>
          <div className="flex flex-col gap-3">
            {completed.slice(0, 3).map(trip => (
              <div key={trip.id} className="neo-card p-4 flex items-center justify-between hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform cursor-pointer" onClick={() => navigate(`/trips/${trip.id}`)}>
                <div>
                  <p className="font-semibold text-sm">
                    {trip.ride.pickupAddress.split(',')[0]} → {trip.ride.destAddress.split(',')[0]}
                  </p>
                  <p className="text-xs text-[#6b6b6b] mt-0.5">
                    {new Date(trip.ride.departureTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' · '}{trip.ride.driver.name}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="font-bold text-[#f97316]">₹{trip.ride.farePerSeat}</p>
                  <Badge variant="success">Completed</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {trips.length === 0 && (
        <div className="anim-in neo-card p-8 text-center">
          <p className="font-display font-bold text-lg mb-2">No trips yet</p>
          <p className="text-sm text-[#6b6b6b] mb-4">Find a ride or offer one to get started</p>
          <Button variant="primary" onClick={() => navigate('/find-ride')}>Find a Ride →</Button>
        </div>
      )}
    </div>
  )
}
