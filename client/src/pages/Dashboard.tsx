import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Car, MapPin, Leaf, IndianRupee, TrendingUp, Clock, ChevronRight, Zap, Shield, Star } from 'lucide-react'
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
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      api.get('/trips').then(r => setTrips(r.data.data)),
      api.get('/wallet').then(r => setWallet(r.data.data)),
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

      {/* Hero Greeting */}
      <div className="anim-in mb-8">
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #714B67 0%, #875A7B 60%, #9B6B8F 100%)' }}
        >
          {/* decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10 bg-white" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full opacity-10 bg-white" />
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium mb-1">{greeting} 👋</p>
            <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight">
              {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-white/60 text-sm mt-1">Where are you heading today?</p>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                <IndianRupee size={12} className="text-white" />
                <span className="text-white text-xs font-bold">₹{wallet?.balance ?? 0} wallet</span>
              </div>
              {completed.length > 0 && (
                <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                  <Star size={12} className="text-yellow-300" />
                  <span className="text-white text-xs font-bold">{completed.length} rides done</span>
                </div>
              )}
            </div>
          </div>
        </div>
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

      {/* Primary CTAs — Rapido style */}
      <div className="anim-in grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => navigate('/find-ride')}
          className="neo-card-lg p-5 text-left hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform cursor-pointer group"
        >
          <div className="w-11 h-11 bg-[#714B67] border-2 border-[#0f0f0f] flex items-center justify-center mb-3">
            <Search size={18} className="text-white" />
          </div>
          <h2 className="font-display font-bold text-base uppercase">Find a Ride</h2>
          <p className="text-xs text-[#6b6b6b] mt-1">Search nearby rides</p>
          <div className="flex items-center gap-1 mt-3 text-[#714B67]">
            <span className="text-xs font-bold">Book now</span>
            <ChevronRight size={12} />
          </div>
        </button>

        <button
          onClick={() => navigate('/offer-ride')}
          className="neo-card-lg p-5 text-left hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform cursor-pointer group bg-[#0f0f0f]"
        >
          <div className="w-11 h-11 bg-[#f97316] border-2 border-white flex items-center justify-center mb-3">
            <Car size={18} className="text-white" />
          </div>
          <h2 className="font-display font-bold text-base uppercase text-white">Offer a Ride</h2>
          <p className="text-xs text-white/50 mt-1">Share & split costs</p>
          <div className="flex items-center gap-1 mt-3 text-[#f97316]">
            <span className="text-xs font-bold">Earn now</span>
            <ChevronRight size={12} />
          </div>
        </button>
      </div>

      {/* Quick feature pills */}
      <div className="anim-in flex gap-3 mb-8 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { icon: Zap, label: 'Instant Match', color: '#f97316' },
          { icon: Shield, label: 'Safe Rides', color: '#16a34a' },
          { icon: Leaf, label: 'Eco Friendly', color: '#00A09D' },
          { icon: Clock, label: 'On Time', color: '#714B67' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-full border-2 border-[#0f0f0f] bg-white shrink-0 shadow-[2px_2px_0_rgba(0,0,0,1)]">
            <Icon size={13} style={{ color }} />
            <span className="text-xs font-bold whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming Trip */}
      {upcoming.length > 0 && (
        <div className="anim-in mb-8">
          <h3 className="font-display font-bold text-xs uppercase tracking-widest text-[#6b6b6b] mb-3">Upcoming Trip</h3>
          <div className="neo-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
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
              <div className="text-right shrink-0 ml-3">
                <p className="font-display font-bold text-2xl text-[#f97316]">₹{upcoming[0].ride.farePerSeat}</p>
                <p className="text-xs text-[#6b6b6b]">per seat</p>
                {upcoming[0].ride.distanceKm && (
                  <p className="text-xs text-[#6b6b6b] mt-1">{upcoming[0].ride.distanceKm} km</p>
                )}
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
              <div
                key={trip.id}
                className="neo-card p-4 flex items-center justify-between hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform cursor-pointer"
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#f0ede6] border-2 border-[#0f0f0f] flex items-center justify-center shrink-0">
                    <Car size={14} className="text-[#714B67]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {trip.ride.pickupAddress.split(',')[0]} → {trip.ride.destAddress.split(',')[0]}
                    </p>
                    <p className="text-xs text-[#6b6b6b] mt-0.5">
                      {new Date(trip.ride.departureTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' · '}{trip.ride.driver.name}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1 shrink-0 ml-3">
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
          <div className="w-16 h-16 bg-[#f0ede6] border-2 border-[#0f0f0f] flex items-center justify-center mx-auto mb-4">
            <Car size={28} className="text-[#714B67]" />
          </div>
          <p className="font-display font-bold text-lg mb-2">No trips yet</p>
          <p className="text-sm text-[#6b6b6b] mb-4">Find a ride or offer one to get started</p>
          <Button variant="primary" onClick={() => navigate('/find-ride')}>Find a Ride →</Button>
        </div>
      )}
    </div>
  )
}
