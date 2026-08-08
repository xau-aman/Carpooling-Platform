import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Geolocation } from '@capacitor/geolocation'
import { ArrowLeft, Phone, MessageCircle, Play, CheckCircle, Navigation, Send, X } from 'lucide-react'
import api from '../lib/api'
import { connectSocket, getSocket } from '../lib/socket'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import OtpCard from '../components/OtpCard'
import GeofenceBar from '../components/GeofenceBar'
import RatingCard from '../components/RatingCard'
import LiveMap from '../components/LiveMap'

interface Loc { lat: number; lng: number; heading?: number; speed?: number }
interface Msg { id: string; senderId: string; message: string; createdAt: string; sender: { name: string } }
interface Trip {
  id: string; rideId: string; status: string; otp?: string
  ride: {
    pickupAddress: string; destAddress: string; farePerSeat: number
    pickupLat: number; pickupLng: number; destLat: number; destLng: number
    distanceKm?: number; durationMin?: number; departureTime: string
    driver: { id: string; name: string; phone?: string }
    vehicle: { model: string; registration: string }
    bookings?: { id: string; userId: string; seats: number }[]
  }
  participants: { id: string; userId: string; isDriver: boolean; user: { id: string; name: string } }[]
  messages?: Msg[]
}

const haversineM = (a: number, b: number, c: number, d: number) => {
  const R = 6371000, dLat = (c-a)*Math.PI/180, dLng = (d-b)*Math.PI/180
  const x = Math.sin(dLat/2)**2 + Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
}

const SC: Record<string, { label: string; bg: string; color: string }> = {
  BOOKED:            { label: 'Upcoming',    bg: '#EFF6FF', color: '#2563EB' },
  STARTED:           { label: 'OTP Pending', bg: '#FFFBEB', color: '#D97706' },
  IN_PROGRESS:       { label: 'Live',        bg: '#FFF7ED', color: '#EA580C' },
  PAYMENT_PENDING:   { label: 'Pay Now',     bg: '#FEF9C3', color: '#CA8A04' },
  PAYMENT_COMPLETED: { label: 'Completed',   bg: '#F0FDF4', color: '#16A34A' },
  COMPLETED:         { label: 'Completed',   bg: '#F0FDF4', color: '#16A34A' },
  CANCELLED:         { label: 'Cancelled',   bg: '#F5F5F5', color: '#6B7280' },
}

export default function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [chat, setChat] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [driverLoc, setDriverLoc] = useState<Loc | null>(null)
  const [distM, setDistM] = useState<number | null>(null)

  const [otpInput, setOtpInput] = useState('')
  const [passengerOtp, setPassengerOtp] = useState<string | null>(null)

  const [driverRating, setDriverRating] = useState(0)
  const [driverRated, setDriverRated] = useState(false)
  const [paxRating, setPaxRating] = useState(0)
  const [paxRated, setPaxRated] = useState(false)

  const [earning, setEarning] = useState<number | null>(null)

  const chatRef = useRef<HTMLDivElement>(null)
  const watchRef = useRef<number | null>(null)

  const isDriver = trip?.participants.find(p => p.userId === user?.id)?.isDriver
  const canCancel = ['BOOKED', 'STARTED'].includes(trip?.status ?? '')

  // Join personal socket room IMMEDIATELY on mount — before trip loads
  // This ensures OTP socket event is not missed due to race condition
  useEffect(() => {
    if (!user) return
    const s = connectSocket()
    s.emit('user:join', user.id)
    // Re-join on reconnect so notifications/OTP always arrive
    const rejoin = () => s.emit('user:join', user.id)
    s.on('connect', rejoin)
    return () => { s.off('connect', rejoin) }
  }, [user?.id])

  const loadTrip = useCallback(() => {
    if (!id) return
    api.get(`/trips/${id}`)
      .then(r => {
        const t = r.data.data
        setTrip(t)
        setMsgs(t.messages || [])
        // Always restore OTP from trip data if status is STARTED
        if (t.status === 'STARTED' && t.otp) setPassengerOtp(t.otp)
      })
      .catch(() => toast('Trip not found', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadTrip() }, [loadTrip])

  // Re-fetch when app comes back to foreground (fixes stale status after back navigation)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadTrip() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadTrip])

  useEffect(() => {
    if (!trip || !user) return
    const s = connectSocket()
    s.emit('trip:join', trip.id)
    s.emit('chat:join', trip.id)

    s.on('trip:location', (loc: Loc) => {
      setDriverLoc(loc)
      setDistM(Math.round(haversineM(loc.lat, loc.lng, trip.ride.destLat, trip.ride.destLng)))
    })
    s.on('chat:message', (m: Msg) => setMsgs(p => [...p, m]))
    s.on('trip:otp', (d: { tripId: string; otp: string }) => {
      if (d.tripId === trip.id) setPassengerOtp(d.otp)
    })
    s.on('trip:started', (d: { tripId: string }) => {
      if (d.tripId === trip.id) setTrip(t => t ? { ...t, status: 'IN_PROGRESS' } : t)
    })
    s.on('trip:completed', (d: { tripId: string; status: string }) => {
      if (d.tripId === trip.id) setTrip(t => t ? { ...t, status: d.status } : t)
    })
    s.on('trip:payment_done', (d: { tripId: string; status: string }) => {
      if (d.tripId === trip.id) setTrip(t => t ? { ...t, status: d.status } : t)
    })
    s.on('payment:received', (d: { tripId: string; amount: number }) => {
      if (d.tripId === trip.id) setEarning(d.amount)
    })
    s.on('trip:cancelled', (d: { tripId: string }) => {
      if (d.tripId === trip.id) { setTrip(t => t ? { ...t, status: 'CANCELLED' } : t); toast('Ride cancelled', 'error') }
    })
    s.on('booking:cancelled', () => {
      // Driver sees passenger cancelled — reload trip
      api.get(`/trips/${trip.id}`).then(r => setTrip(r.data.data))
    })

    return () => {
      s.emit('trip:leave', trip.id)
      ;['trip:location','chat:message','trip:otp','trip:started','trip:completed','trip:payment_done','payment:received','trip:cancelled','booking:cancelled'].forEach(e => s.off(e))
    }
  }, [trip?.id])

  useEffect(() => { chatRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  // ── Actions ──────────────────────────────────────────────────────────────

  const startTrip = async () => {
    if (!trip) return
    setBusy(true)
    try {
      // Request location permission before starting trip
      const perm = await Geolocation.requestPermissions()
      if (perm.location !== 'granted') {
        toast('Location permission is required for live tracking', 'error')
        setBusy(false)
        return
      }

      const r = await api.post(`/trips/${trip.id}/start`)
      setTrip(t => t ? { ...t, status: 'STARTED' } : t)
      toast(`OTP sent to passenger`, 'success')
      setDriverLoc({ lat: trip.ride.pickupLat, lng: trip.ride.pickupLng })

      // Capacitor watchPosition works correctly on Android with runtime perms
      const watchId = await Geolocation.watchPosition({ enableHighAccuracy: true }, (pos, err) => {
        if (err || !pos) return
        const { latitude: lat, longitude: lng } = pos.coords
        getSocket().emit('trip:location', { tripId: trip.id, lat, lng })
        setDriverLoc({ lat, lng })
        setDistM(Math.round(haversineM(lat, lng, trip.ride.destLat, trip.ride.destLng)))
      })
      watchRef.current = watchId as unknown as number
      void r
    } catch { toast('Failed to start', 'error') }
    finally { setBusy(false) }
  }

  const verifyOtp = async () => {
    if (!trip) return
    setBusy(true)
    try {
      await api.post(`/trips/${trip.id}/verify-otp`, { otp: otpInput })
      setTrip(t => t ? { ...t, status: 'IN_PROGRESS' } : t)
      toast('OTP verified! Ride is live', 'success')
    } catch (e: unknown) {
      toast((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid OTP', 'error')
    }
    finally { setBusy(false) }
  }

  const simulate = () => {
    if (!trip) return
    const wp = [
      { lat: trip.ride.pickupLat, lng: trip.ride.pickupLng },
      { lat: (trip.ride.pickupLat + trip.ride.destLat) / 2, lng: (trip.ride.pickupLng + trip.ride.destLng) / 2 },
      { lat: trip.ride.destLat, lng: trip.ride.destLng },
    ]
    getSocket().emit('trip:simulate', { tripId: trip.id, waypoints: wp })
    setDistM(0)
    setDriverLoc({ lat: trip.ride.destLat, lng: trip.ride.destLng })
    toast('Simulation done', 'success')
  }

  const completeTrip = async () => {
    if (!trip) return
    setBusy(true)
    try {
      const simulated = distM !== null && distM <= 50
      await api.post(`/trips/${trip.id}/complete`, { lat: driverLoc?.lat, lng: driverLoc?.lng, simulated })
      setTrip(t => t ? { ...t, status: 'PAYMENT_PENDING' } : t)
      setMsgs([])
      if (watchRef.current) await Geolocation.clearWatch({ id: String(watchRef.current) })
      toast('Trip completed!', 'success')
    } catch (e: unknown) {
      toast((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed', 'error')
    }
    finally { setBusy(false) }
  }

  const cancelRide = async () => {
    if (!trip || !confirm('Cancel this ride?')) return
    setBusy(true)
    try {
      await api.post(`/trips/${trip.id}/cancel-ride`)
      setTrip(t => t ? { ...t, status: 'CANCELLED' } : t)
      setMsgs([])
      toast('Ride cancelled', 'info')
    } catch { toast('Failed to cancel', 'error') }
    finally { setBusy(false) }
  }

  const cancelBooking = async () => {
    if (!trip || !confirm('Cancel your booking?')) return
    setBusy(true)
    try {
      await api.post(`/trips/${trip.id}/cancel-booking`)
      toast('Booking cancelled', 'info')
      navigate('/trips')
    } catch { toast('Failed to cancel', 'error') }
    finally { setBusy(false) }
  }

  const sendChat = () => {
    if (!chatInput.trim() || !trip) return
    getSocket().emit('chat:message', { tripId: trip.id, message: chatInput.trim() })
    setChatInput('')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #714B67', borderTopColor: 'transparent' }} />
    </div>
  )
  if (!trip) return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center gap-4">
      <p className="font-bold text-xl">Trip not found</p>
      <button onClick={() => navigate('/trips')} className="m-btn m-btn-primary">Go Back</button>
    </div>
  )

  const sc = SC[trip.status] ?? { label: trip.status, bg: '#f5f5f5', color: '#6b6b6b' }
  const driver = trip.participants.find(p => p.isDriver)
  const booking = trip.ride.bookings?.find(b => b.userId === user?.id)
  const nearDest = distM !== null && distM <= 300

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white px-4 flex items-center gap-3 shadow-sm shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)', paddingBottom: 16 }}>
        <button onClick={() => navigate('/trips')} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display font-bold text-lg flex-1">Trip Details</h1>
        <span className="m-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 80px)' }}>

        {/* Earning banner */}
        {isDriver && earning && (
          <div className="mx-4 mt-4 rounded-2xl p-4 flex items-center gap-3" style={{ background: '#f0fdf4' }}>
            <div className="w-10 h-10 rounded-2xl bg-[#16a34a] flex items-center justify-center text-white font-bold shrink-0">₹</div>
            <div>
              <p className="font-bold text-[#16a34a]">₹{earning} credited!</p>
              <p className="text-xs text-[#6b6b6b]">Passenger payment received</p>
            </div>
          </div>
        )}

        {/* OTP card */}
        <div className="mt-4">
          <OtpCard
            passengerOtp={passengerOtp}
            otpInput={otpInput} onOtpInput={setOtpInput}
            onVerify={verifyOtp} loading={busy} isDriver={!!isDriver}
            tripStatus={trip.status}
          />
        </div>

        {/* Live map */}
        {driverLoc && (
          <div className="mx-4 mt-4">
            <LiveMap
              driverLat={driverLoc.lat} driverLng={driverLoc.lng}
              pickupLat={trip.ride.pickupLat} pickupLng={trip.ride.pickupLng}
              destLat={trip.ride.destLat} destLng={trip.ride.destLng}
            />
          </div>
        )}

        {/* Geofence bar */}
        <div className="mt-3">
          <GeofenceBar distM={distM} />
        </div>

        {/* Driver card */}
        <div className="mx-4 mt-3 m-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0"
              style={{ background: 'linear-gradient(135deg,#714B67,#875A7B)' }}>
              {driver?.user.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-bold">{driver?.user.name}</p>
              <p className="text-xs text-[#6b6b6b] mt-0.5">4.9 · Driver</p>
            </div>
            <div className="flex gap-2">
              {trip.ride.driver.phone && (
                <a href={`tel:${trip.ride.driver.phone}`} className="w-10 h-10 rounded-2xl bg-[#f0fdf4] flex items-center justify-center">
                  <Phone size={16} className="text-[#16a34a]" />
                </a>
              )}
              <button onClick={() => setChat(v => !v)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: chat ? '#714B67' : '#f5f5f5' }}>
                <MessageCircle size={16} style={{ color: chat ? 'white' : '#6b6b6b' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Route card */}
        <div className="mx-4 mt-3 m-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#16a34a]" />
              <div className="w-0.5 h-8 bg-[#e5e5e5]" />
              <div className="w-3 h-3 rounded-full bg-[#dc2626]" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-[#6b6b6b]">Pickup</p>
                <p className="font-semibold text-sm">{trip.ride.pickupAddress.split(',')[0]}</p>
              </div>
              <div>
                <p className="text-xs text-[#6b6b6b]">Drop</p>
                <p className="font-semibold text-sm">{trip.ride.destAddress.split(',')[0]}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display font-black text-2xl text-[#f97316]">₹{trip.ride.farePerSeat}</p>
              {trip.ride.distanceKm && <p className="text-xs text-[#6b6b6b] mt-1">{trip.ride.distanceKm}km</p>}
            </div>
          </div>
          <div className="pt-3 border-t border-[#f5f5f5] grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-[#6b6b6b]">Vehicle</p>
              <p className="font-semibold">{trip.ride.vehicle.model}</p>
              <p className="text-xs text-[#6b6b6b] font-mono">{trip.ride.vehicle.registration}</p>
            </div>
            <div>
              <p className="text-xs text-[#6b6b6b]">Departure</p>
              <p className="font-semibold text-sm">
                {new Date(trip.ride.departureTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* ── DRIVER ACTIONS ── */}
        {isDriver && trip.status === 'BOOKED' && (
          <div className="mx-4 mt-3 flex gap-3">
            <button onClick={cancelRide} disabled={busy} className="m-btn m-btn-outline flex-1">
              <X size={16} /> Cancel
            </button>
            <button onClick={startTrip} disabled={busy} className="m-btn m-btn-dark flex-1">
              {busy ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Play size={16} /> Start</>}
            </button>
          </div>
        )}

        {isDriver && trip.status === 'IN_PROGRESS' && (
          <div className="mx-4 mt-3 space-y-2">
            <div className="flex gap-3">
              <button onClick={simulate} className="m-btn m-btn-outline flex-1">
                <Navigation size={16} /> Simulate
              </button>
              <button onClick={completeTrip} disabled={busy || (distM !== null && !nearDest)} className="m-btn m-btn-primary flex-1 disabled:opacity-50">
                {busy ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle size={16} /> Complete</>}
              </button>
            </div>
            {distM !== null && !nearDest && (
              <p className="text-center text-xs text-[#6b6b6b]">Use Simulate to reach destination for testing</p>
            )}
          </div>
        )}

        {/* ── PASSENGER ACTIONS ── */}
        {!isDriver && canCancel && (
          <div className="mx-4 mt-3">
            <button onClick={cancelBooking} disabled={busy} className="m-btn m-btn-outline m-btn-full">
              <X size={16} /> Cancel Booking
            </button>
          </div>
        )}

        {!isDriver && trip.status === 'PAYMENT_PENDING' && booking && (
          <div className="mx-4 mt-3 m-card p-4" style={{ background: '#fffbeb' }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={20} className="text-[#16a34a]" />
              <p className="font-bold">Trip Completed!</p>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#6b6b6b]">Amount Due</span>
              <span className="font-display font-black text-3xl text-[#f97316]">₹{trip.ride.farePerSeat}</span>
            </div>
            <button onClick={() => navigate(`/payment/${booking.id}/${trip.id}/${trip.ride.farePerSeat}`)}
              className="m-btn m-btn-orange m-btn-full">
              Pay Now →
            </button>
          </div>
        )}

        {/* Ratings */}
        {isDriver && ['PAYMENT_COMPLETED','COMPLETED','PAYMENT_PENDING'].includes(trip.status) && !paxRated && (
          <div className="mt-3">
            <RatingCard title="Rate your passengers" rating={paxRating} onRate={setPaxRating}
              onSubmit={async () => {
                const pax = trip.participants.filter(p => !p.isDriver)
                await Promise.all(pax.map(p => api.post('/ratings', { rateeId: p.userId, rideId: trip.rideId, score: paxRating })))
                setPaxRated(true); toast('Rated!', 'success')
              }} />
          </div>
        )}

        {!isDriver && ['PAYMENT_COMPLETED','COMPLETED'].includes(trip.status) && !driverRated && (
          <div className="mt-3">
            <RatingCard title="Rate your driver" rating={driverRating} onRate={setDriverRating}
              onSubmit={async () => {
                const d = trip.participants.find(p => p.isDriver)
                if (d) await api.post('/ratings', { rateeId: d.userId, rideId: trip.rideId, score: driverRating })
                setDriverRated(true); toast('Rated!', 'success')
              }} />
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* Chat overlay */}
      {chat && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[#f5f5f5]">
            <button onClick={() => setChat(false)} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center">
              <X size={20} />
            </button>
            <p className="font-display font-bold text-lg">Trip Chat</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.length === 0 && <p className="text-center text-sm text-[#6b6b6b] mt-8">No messages yet</p>}
            {msgs.map(m => {
              const mine = m.senderId === user?.id
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${mine ? 'rounded-br-sm text-white' : 'rounded-bl-sm text-[#0f0f0f] bg-[#f5f5f5]'}`}
                    style={mine ? { background: '#714B67' } : {}}>
                    {!mine && <p className="text-xs font-bold mb-1 opacity-60">{m.sender.name}</p>}
                    <p>{m.message}</p>
                    <p className={`text-xs mt-1 ${mine ? 'text-white/60' : 'text-[#6b6b6b]'}`}>
                      {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={chatRef} />
          </div>
          <div className="flex gap-3 px-4 py-3 border-t border-[#f5f5f5]"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 12px)' }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Type a message..." className="flex-1 bg-[#f5f5f5] rounded-2xl px-4 py-3 text-sm outline-none" />
            <button onClick={sendChat} className="w-12 h-12 rounded-2xl bg-[#714B67] flex items-center justify-center active:scale-95">
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
