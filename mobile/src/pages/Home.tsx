import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Car, MapPin, IndianRupee, Leaf, TrendingUp, ChevronRight, Zap, Shield, Clock, Bell, User, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { connectSocket } from '../lib/socket'

interface Trip {
  id: string; status: string
  ride: {
    pickupAddress: string; destAddress: string; farePerSeat: number
    distanceKm?: number; departureTime: string
    driver: { id: string; name: string }; vehicle: { model: string; registration: string }
  }
  participants: { userId: string; isDriver: boolean }[]
}
interface Wallet { balance: number }

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(() => Promise.all([
    api.get('/trips').then(r => setTrips(r.data.data)),
    api.get('/wallet').then(r => setWallet(r.data.data)),
  ]).finally(() => setLoading(false)), [])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    Promise.all([
      api.get('/trips').then(r => setTrips(r.data.data)),
      api.get('/wallet').then(r => setWallet(r.data.data)),
    ]).finally(() => setRefreshing(false))
  }, [])

  useEffect(() => { loadData() }, [])

  // Refresh when app comes back to foreground
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadData() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadData])

  // Real-time: listen for ALL trip status changes on home screen
  useEffect(() => {
    if (!user) return
    const s = connectSocket()
    s.emit('user:join', user.id)

    const refreshTrips = () => api.get('/trips').then(r => setTrips(r.data.data))
    const refreshAll = () => Promise.all([
      api.get('/trips').then(r => setTrips(r.data.data)),
      api.get('/wallet').then(r => setWallet(r.data.data)),
    ])

    // trip:otp — driver started, passenger's trip moves to STARTED (OTP Pending)
    s.on('trip:otp',          refreshTrips)
    s.on('trip:started',      refreshTrips)
    s.on('trip:completed',    refreshTrips)
    s.on('trip:cancelled',    refreshTrips)
    s.on('trip:payment_done', refreshTrips)
    s.on('booking:new',       refreshTrips)
    s.on('booking:cancelled', refreshTrips)
    s.on('payment:received',  refreshAll)

    const rejoin = () => s.emit('user:join', user.id)
    s.on('connect', rejoin)

    return () => {
      s.off('connect',          rejoin)
      s.off('trip:otp',         refreshTrips)
      s.off('trip:started',     refreshTrips)
      s.off('trip:completed',   refreshTrips)
      s.off('trip:cancelled',   refreshTrips)
      s.off('trip:payment_done',refreshTrips)
      s.off('booking:new',      refreshTrips)
      s.off('booking:cancelled',refreshTrips)
      s.off('payment:received', refreshAll)
    }
  }, [user?.id])

  const active = trips.filter(t => t.status === 'IN_PROGRESS')
  const upcoming = trips.filter(t => ['BOOKED', 'STARTED'].includes(t.status))
  const completed = trips.filter(t => ['PAYMENT_COMPLETED', 'COMPLETED'].includes(t.status))
  const totalKm = completed.reduce((s, t) => s + (t.ride.distanceKm ?? 0), 0)
  const co2 = Math.round(totalKm * 0.21 * 10) / 10

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="scroll-area safe-bottom">
      <div className="page-enter">
        <div className="px-4 pt-4 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src="/only_logo.png" alt="GoTogether" className="w-8 h-8 rounded-xl" />
              <span className="font-display font-black text-base text-[#0f0f0f]">GoTogether</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} disabled={refreshing} className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm active:scale-95">
                <RefreshCw size={16} className={`text-[#6b6b6b] ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => navigate('/notifications')} className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm active:scale-95">
                <Bell size={18} className="text-[#6b6b6b]" />
              </button>
              <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm active:scale-95" style={{ background: 'linear-gradient(135deg,#714B67,#875A7B)' }}>
                {user?.name?.[0]?.toUpperCase() ?? <User size={16} />}
              </button>
            </div>
          </div>

          <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #714B67 0%, #875A7B 55%, #9B6B8F 100%)' }}>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="relative">
              <p className="text-white/60 text-sm">{greeting}</p>
              <h1 className="font-display font-black text-3xl text-white mt-0.5">{user?.name?.split(' ')[0]}</h1>
              <div className="flex gap-2 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
                  <IndianRupee size={12} className="text-white" />
                  <span className="text-white text-xs font-bold">₹{wallet?.balance ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
                  <Leaf size={12} className="text-green-300" />
                  <span className="text-white text-xs font-bold">{co2}kg CO₂ saved</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active trip banner — Rapido style */}
        {active.length > 0 && (
          <div className="px-4 mt-3">
            <button onClick={() => navigate(`/trip/${active[0].id}`)}
              className="w-full rounded-2xl overflow-hidden active:scale-[0.99] transition-transform"
              style={{ background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)' }}>
              {/* Top bar */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                  </span>
                  <span className="text-white font-display font-black text-sm tracking-wide">LIVE TRIP</span>
                </div>
                <div className="flex items-center gap-1 text-white/90 text-xs font-bold">
                  Track <ChevronRight size={14} />
                </div>
              </div>
              {/* Route */}
              <div className="px-4 pb-3 flex items-center gap-2">
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                  <div className="w-0.5 h-4 bg-white/50" />
                  <div className="w-2 h-2 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-xs truncate">{active[0].ride.pickupAddress.split(',')[0]}</p>
                  <p className="text-white/70 text-xs truncate mt-1">{active[0].ride.destAddress.split(',')[0]}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white font-display font-black text-lg">₹{active[0].ride.farePerSeat}</p>
                  {active[0].ride.distanceKm && <p className="text-white/70 text-xs">{active[0].ride.distanceKm}km</p>}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Upcoming trips — all of them, driver + passenger */}
        {upcoming.length > 0 && (
          <div className="px-4 mt-3">
            <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-2">
              Upcoming ({upcoming.length})
            </p>
            <div className="space-y-2">
              {upcoming.map(trip => {
                const isDriver = trip.participants.find(p => p.userId === user?.id)?.isDriver
                const statusLabel = trip.status === 'STARTED' ? '🔑 OTP Pending' : isDriver ? 'You are driving' : 'Passenger'
                const statusColor = trip.status === 'STARTED' ? '#D97706' : isDriver ? '#714B67' : '#2563EB'
                return (
                  <button key={trip.id} onClick={() => navigate(`/trip/${trip.id}`)}
                    className="w-full m-card p-4 text-left active:scale-[0.99] transition-transform">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${statusColor}18`, color: statusColor }}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-[#0f0f0f]">{trip.ride.pickupAddress.split(',')[0]}</p>
                        <p className="text-xs text-[#6b6b6b] mt-0.5">→ {trip.ride.destAddress.split(',')[0]}</p>
                        <p className="text-xs text-[#6b6b6b] mt-1">
                          {new Date(trip.ride.departureTime).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-display font-black text-xl text-[#f97316]">₹{trip.ride.farePerSeat}</p>
                        <p className="text-xs text-[#6b6b6b]">{trip.ride.vehicle.model}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/find-ride')} className="m-card p-5 text-left active:scale-95 transition-transform">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#714B67' }}>
              <Search size={20} className="text-white" />
            </div>
            <p className="font-display font-bold text-base text-[#0f0f0f]">Find Ride</p>
            <p className="text-xs text-[#6b6b6b] mt-0.5">Search nearby</p>
            <div className="flex items-center gap-1 mt-3 text-[#714B67]">
              <span className="text-xs font-bold">Book now</span><ChevronRight size={12} />
            </div>
          </button>
          <button onClick={() => navigate('/offer-ride')} className="m-card p-5 text-left active:scale-95 transition-transform" style={{ background: '#0f0f0f' }}>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#f97316' }}>
              <Car size={20} className="text-white" />
            </div>
            <p className="font-display font-bold text-base text-white">Offer Ride</p>
            <p className="text-xs text-white/50 mt-0.5">Share & earn</p>
            <div className="flex items-center gap-1 mt-3 text-[#f97316]">
              <span className="text-xs font-bold">Earn now</span><ChevronRight size={12} />
            </div>
          </button>
        </div>

        {/* Feature pills */}
        <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { icon: Zap, label: 'Instant Match', color: '#f97316' },
            { icon: Shield, label: 'Safe Rides', color: '#16a34a' },
            { icon: Leaf, label: 'Eco Friendly', color: '#00A09D' },
            { icon: Clock, label: 'On Time', color: '#714B67' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-[#e5e5e5] shrink-0 shadow-sm">
              <Icon size={13} style={{ color }} />
              <span className="text-xs font-semibold text-[#0f0f0f] whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="px-4 mt-5 grid grid-cols-2 gap-3">
          {[
            { label: 'Total Trips', value: completed.length, icon: MapPin, color: '#714B67' },
            { label: 'Wallet', value: `₹${wallet?.balance ?? 0}`, icon: IndianRupee, color: '#f97316', accent: true },
            { label: 'CO₂ Saved', value: `${co2}kg`, icon: Leaf, color: '#16a34a' },
            { label: 'Rides Done', value: completed.length, icon: TrendingUp, color: '#00A09D' },
          ].map(({ label, value, icon: Icon, color, accent }) => (
            <div key={label} className={`m-card p-4 ${accent ? 'bg-[#714B67]' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: accent ? 'rgba(255,255,255,0.2)' : `${color}18` }}>
                  <Icon size={16} style={{ color: accent ? 'white' : color }} />
                </div>
              </div>
              <p className={`font-display font-black text-2xl ${accent ? 'text-white' : 'text-[#0f0f0f]'}`}>{value}</p>
              <p className={`text-xs mt-0.5 ${accent ? 'text-white/70' : 'text-[#6b6b6b]'}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Recent trips */}
        {completed.length > 0 && (
          <div className="px-4 mt-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">Recent Trips</p>
              <button onClick={() => navigate('/history')} className="text-xs font-bold text-[#714B67]">View All →</button>
            </div>
            <div className="space-y-3">
              {completed.slice(0, 3).map(trip => (
                <button key={trip.id} onClick={() => navigate(`/trip/${trip.id}`)}
                  className="w-full m-card p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#714B6718' }}>
                    <Car size={18} style={{ color: '#714B67' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#0f0f0f] truncate">
                      {trip.ride.pickupAddress.split(',')[0]} → {trip.ride.destAddress.split(',')[0]}
                    </p>
                    <p className="text-xs text-[#6b6b6b] mt-0.5">
                      {new Date(trip.ride.departureTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {trip.ride.driver.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[#f97316]">₹{trip.ride.farePerSeat}</p>
                    <p className="text-[10px] text-[#16a34a] font-bold mt-0.5">Done</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="px-4 mt-4 space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        )}

        {!loading && trips.length === 0 && (
          <div className="px-4 mt-8 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: '#714B6718' }}>
              <Car size={36} style={{ color: '#714B67' }} />
            </div>
            <p className="font-display font-bold text-xl text-[#0f0f0f]">No trips yet</p>
            <p className="text-sm text-[#6b6b6b] mt-2 mb-6">Find a ride or offer one to get started</p>
            <button onClick={() => navigate('/find-ride')} className="m-btn m-btn-primary">Find a Ride →</button>
          </div>
        )}
      </div>
    </div>
  )
}
