import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, MessageCircle, Navigation, Star, CheckCircle, Play, MapPin, X, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'
import { connectSocket, getSocket } from '../lib/socket'
import Button from '../components/Button'
import { Badge, LoadingState, ErrorState } from '../components/ui'
import { Trip, ChatMessage, LocationPoint } from '../types'
import LiveMap from '../features/tracking/LiveMap'
import ChatPanel from '../features/tracking/ChatPanel'

const DEST_RADIUS_M = 300

export default function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [driverLocation, setDriverLocation] = useState<LocationPoint | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showChat, setShowChat] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // OTP states
  const [otp, setOtp] = useState<string | null>(null)          // driver sees this after startTrip
  const [otpInput, setOtpInput] = useState('')                  // driver types passenger's OTP
  const [passengerOtp, setPassengerOtp] = useState<string | null>(null) // passenger receives via socket

  // Rating
  const [rating, setRating] = useState(0)
  const [rated, setRated] = useState(false)
  const [passengerRating, setPassengerRating] = useState(0)
  const [passengerRated, setPassengerRated] = useState(false)

  // Driver earning
  const [earningReceived, setEarningReceived] = useState<number | null>(null)

  // Geofence
  const [distToDestM, setDistToDestM] = useState<number | null>(null)
  const watchRef = useRef<number | null>(null)

  const isDriver = trip?.participants.find(p => p.userId === user?.id)?.isDriver

  useEffect(() => {
    if (!id) return
    api.get(`/trips/${id}`)
      .then(r => { setTrip(r.data.data); setMessages(r.data.data.messages || []) })
      .catch(() => setError('Trip not found'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!trip) return
    const socket = connectSocket()
    socket.emit('trip:join', trip.id)
    socket.emit('chat:join', trip.id)

    socket.on('trip:location', (loc: LocationPoint) => {
      setDriverLocation(loc)
      // Update distance to destination for driver geofence
      if (trip && loc.lat && loc.lng) {
        const d = haversineM(loc.lat, loc.lng, trip.ride.destLat, trip.ride.destLng)
        setDistToDestM(Math.round(d))
      }
    })
    socket.on('chat:message', (msg: ChatMessage) => setMessages(prev => [...prev, msg]))

    // OTP sent by server after driver clicks Start
    socket.on('trip:otp', (data: { tripId: string; otp: string }) => {
      if (data.tripId === trip.id) setPassengerOtp(data.otp)
    })
    // OTP verified — trip is now IN_PROGRESS
    socket.on('trip:started', (data: { tripId: string }) => {
      if (data.tripId === trip.id) setTrip(t => t ? { ...t, status: 'IN_PROGRESS' } : t)
    })
    // Driver completed trip
    socket.on('trip:completed', (data: { tripId: string; status: string }) => {
      if (data.tripId === trip.id) setTrip(t => t ? { ...t, status: data.status as Trip['status'] } : t)
    })
    // Payment done
    socket.on('trip:payment_done', (data: { tripId: string; status: string }) => {
      if (data.tripId === trip.id) setTrip(t => t ? { ...t, status: data.status as Trip['status'] } : t)
    })
    // Driver earning
    socket.on('payment:received', (data: { tripId: string; amount: number }) => {
      if (data.tripId === trip.id) setEarningReceived(data.amount)
    })
    // Ride cancelled
    socket.on('trip:cancelled', (data: { tripId: string }) => {
      if (data.tripId === trip.id) {
        setTrip(t => t ? { ...t, status: 'CANCELLED' } : t)
        toast('Ride has been cancelled', 'error')
      }
    })

    return () => {
      socket.emit('trip:leave', trip.id)
      socket.off('trip:location')
      socket.off('chat:message')
      socket.off('trip:otp')
      socket.off('trip:started')
      socket.off('trip:completed')
      socket.off('trip:payment_done')
      socket.off('payment:received')
      socket.off('trip:cancelled')
    }
  }, [trip?.id])

  // ── Actions ────────────────────────────────────────────────────────────────

  // Driver: generate OTP + start GPS watch
  const startTrip = async () => {
    if (!trip) return
    setActionLoading(true)
    try {
      const r = await api.post(`/trips/${trip.id}/start`)
      const generatedOtp = r.data.data.otp
      setOtp(generatedOtp)
      setTrip(t => t ? { ...t, status: 'STARTED' } : t)
      toast(`OTP generated: ${generatedOtp} — ask passenger to share it`, 'success')

      // Start GPS
      if (navigator.geolocation) {
        watchRef.current = navigator.geolocation.watchPosition(pos => {
          const { latitude: lat, longitude: lng, heading, speed } = pos.coords
          getSocket().emit('trip:location', { tripId: trip.id, lat, lng, heading: heading ?? undefined, speed: speed ?? undefined })
          setDistToDestM(Math.round(haversineM(lat, lng, trip.ride.destLat, trip.ride.destLng)))
        }, () => {}, { enableHighAccuracy: true })
      }
    } catch { toast('Failed to start trip', 'error') }
    finally { setActionLoading(false) }
  }

  // Driver: verify OTP entered by passenger
  const verifyOtp = async () => {
    if (!trip || !otpInput) return
    setActionLoading(true)
    try {
      await api.post(`/trips/${trip.id}/verify-otp`, { otp: otpInput })
      setTrip(t => t ? { ...t, status: 'IN_PROGRESS' } : t)
      setOtp(null)
      toast('OTP verified! Trip is now live 🚗', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg || 'Invalid OTP', 'error')
    }
    finally { setActionLoading(false) }
  }

  // Simulate movement — bypasses geofence, teleports to destination
  const simulateMovement = () => {
    if (!trip) return
    const waypoints = [
      { lat: 22.5839, lng: 88.3424 }, { lat: 22.5800, lng: 88.3600 },
      { lat: 22.5760, lng: 88.3800 }, { lat: 22.5740, lng: 88.4000 },
      { lat: 22.5730, lng: 88.4150 }, { lat: 22.5726, lng: 88.4319 },
    ]
    getSocket().emit('trip:simulate', { tripId: trip.id, waypoints })
    // After simulation ends, set distance to 0 so geofence passes
    setTimeout(() => setDistToDestM(0), waypoints.length * 2000 + 500)
    toast('Simulation started — will reach destination in ~12s', 'info')
  }

  // Driver: complete trip (geofence enforced unless simulated)
  const completeTrip = async () => {
    if (!trip) return
    setActionLoading(true)
    try {
      const isSimulated = distToDestM !== null && distToDestM <= 50
      await api.post(`/trips/${trip.id}/complete`, {
        lat: driverLocation?.lat,
        lng: driverLocation?.lng,
        simulated: isSimulated,
      })
      setTrip(t => t ? { ...t, status: 'PAYMENT_PENDING' } : t)
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
      toast('Trip completed! Waiting for payment.', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg || 'Failed to complete trip', 'error')
    }
    finally { setActionLoading(false) }
  }

  // Driver: cancel entire ride
  const cancelRide = async () => {
    if (!trip || !confirm('Cancel this ride? All passengers will be notified.')) return
    setActionLoading(true)
    try {
      await api.post(`/trips/${trip.id}/cancel-ride`)
      setTrip(t => t ? { ...t, status: 'CANCELLED' } : t)
      toast('Ride cancelled', 'info')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg || 'Failed to cancel', 'error')
    }
    finally { setActionLoading(false) }
  }

  // Passenger: cancel booking
  const cancelBooking = async () => {
    if (!trip || !confirm('Cancel your booking?')) return
    setActionLoading(true)
    try {
      await api.post(`/trips/${trip.id}/cancel-booking`)
      setTrip(t => t ? { ...t, status: 'CANCELLED' } : t)
      toast('Booking cancelled', 'info')
      navigate('/trips')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg || 'Failed to cancel', 'error')
    }
    finally { setActionLoading(false) }
  }

  const submitRating = async () => {
    if (!trip || !rating) return
    const driverParticipant = trip.participants.find(p => p.isDriver)
    if (!driverParticipant) return
    try {
      await api.post('/ratings', { rateeId: driverParticipant.userId, rideId: trip.rideId, score: rating })
      setRated(true)
      toast('Rating submitted!', 'success')
    } catch { toast('Failed to submit rating', 'error') }
  }

  const submitPassengerRating = async () => {
    if (!trip || !passengerRating) return
    const passengers = trip.participants.filter(p => !p.isDriver)
    try {
      await Promise.all(passengers.map(p =>
        api.post('/ratings', { rateeId: p.userId, rideId: trip.rideId, score: passengerRating })
      ))
      setPassengerRated(true)
      toast('Passenger rated!', 'success')
    } catch { toast('Failed to submit rating', 'error') }
  }

  if (loading) return <LoadingState />
  if (error || !trip) return <ErrorState message={error || 'Trip not found'} />

  const driver = trip.participants.find(p => p.isDriver)
  const booking = trip.ride.bookings?.find(b => b.userId === user?.id)
  const driverPhone = (trip.ride.driver as { id: string; name: string; profilePhoto?: string; phone?: string }).phone
  const canCancel = ['BOOKED', 'STARTED'].includes(trip.status)
  const nearDest = distToDestM !== null && distToDestM <= DEST_RADIUS_M

  const statusConfig: Record<string, { label: string; variant: 'info' | 'warning' | 'danger' | 'success' | 'default' }> = {
    BOOKED:            { label: 'UPCOMING',         variant: 'info' },
    STARTED:           { label: '🔑 OTP PENDING',   variant: 'warning' },
    IN_PROGRESS:       { label: '🔴 LIVE',           variant: 'warning' },
    PAYMENT_PENDING:   { label: 'PAYMENT PENDING',  variant: 'danger' },
    PAYMENT_COMPLETED: { label: 'COMPLETED',         variant: 'success' },
    COMPLETED:         { label: 'COMPLETED',         variant: 'success' },
    CANCELLED:         { label: 'CANCELLED',         variant: 'default' },
  }
  const sc = statusConfig[trip.status] ?? { label: trip.status, variant: 'default' as const }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/trips')} className="p-2 border-2 border-[#0f0f0f] bg-white hover:bg-[#f0ede6] transition-colors">←</button>
        <h1 className="font-display font-bold text-xl uppercase flex-1">Trip Details</h1>
        <Badge variant={sc.variant}>{sc.label}</Badge>
      </div>

      {/* Live Map */}
      {(trip.status === 'IN_PROGRESS' || driverLocation) && (
        <div className="mb-4">
          <LiveMap
            pickup={{ lat: trip.ride.pickupLat, lng: trip.ride.pickupLng }}
            destination={{ lat: trip.ride.destLat, lng: trip.ride.destLng }}
            driverLocation={driverLocation}
            heightPx={320}
          />
        </div>
      )}

      {/* Passenger OTP card — shown when driver starts trip */}
      {!isDriver && passengerOtp && trip.status === 'STARTED' && (
        <div className="neo-card p-5 mb-4 bg-[#fffbeb] border-[#d97706]">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} className="text-[#d97706]" />
            <p className="font-bold text-sm uppercase">Share this OTP with your driver</p>
          </div>
          <div className="flex items-center justify-center py-4">
            <span className="font-mono font-black text-5xl tracking-[0.3em] text-[#0f0f0f]">{passengerOtp}</span>
          </div>
          <p className="text-xs text-center text-[#6b6b6b]">Driver will enter this to start the ride</p>
        </div>
      )}

      {/* Driver earning banner */}
      {isDriver && earningReceived && (
        <div className="neo-card p-4 mb-4 bg-[#f0fdf4] border-[#16a34a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#16a34a] border-2 border-[#0f0f0f] flex items-center justify-center text-white font-bold shrink-0">₹</div>
            <div>
              <p className="font-bold text-[#16a34a]">₹{earningReceived} credited to your wallet!</p>
              <p className="text-xs text-[#6b6b6b]">Passenger payment received</p>
            </div>
          </div>
        </div>
      )}

      {/* Driver card */}
      <div className="neo-card p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f97316] border-2 border-[#0f0f0f] flex items-center justify-center text-white font-bold text-xl shrink-0">
            {driver?.user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold">{driver?.user.name}</p>
            <div className="flex items-center gap-1 text-sm text-[#6b6b6b]">
              <Star size={12} fill="#d97706" className="text-[#d97706]" />
              <span>4.9 · Driver</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {driverPhone && (
              <a href={`tel:${driverPhone}`} className="neo-btn neo-btn-outline p-2.5"><Phone size={15} /></a>
            )}
            <button onClick={() => setShowChat(v => !v)} className={`neo-btn p-2.5 ${showChat ? 'bg-[#0f0f0f] text-white' : 'neo-btn-outline'}`}>
              <MessageCircle size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Trip info */}
      <div className="neo-card p-5 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-bold uppercase text-[#6b6b6b] mb-1">Vehicle</p>
            <p className="font-bold">{trip.ride.vehicle.model}</p>
            <p className="text-[#6b6b6b] font-mono text-xs">{trip.ride.vehicle.registration}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-[#6b6b6b] mb-1">Fare</p>
            <p className="font-display font-bold text-2xl text-[#f97316]">₹{trip.ride.farePerSeat}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-[#6b6b6b] mb-1">Pickup</p>
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-[#16a34a] shrink-0" />
              <p className="font-semibold text-sm">{trip.ride.pickupAddress.split(',')[0]}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-[#6b6b6b] mb-1">Drop</p>
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-[#dc2626] shrink-0" />
              <p className="font-semibold text-sm">{trip.ride.destAddress.split(',')[0]}</p>
            </div>
          </div>
          {trip.ride.distanceKm && (
            <div>
              <p className="text-xs font-bold uppercase text-[#6b6b6b] mb-1">Distance</p>
              <p className="font-semibold">{trip.ride.distanceKm} km · {trip.ride.durationMin} min</p>
            </div>
          )}
          <div>
            <p className="text-xs font-bold uppercase text-[#6b6b6b] mb-1">Departure</p>
            <p className="font-semibold text-sm">{new Date(trip.ride.departureTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      {/* ── DRIVER ACTIONS ── */}

      {/* Step 1: Start trip → generate OTP */}
      {isDriver && trip.status === 'BOOKED' && (
        <div className="flex gap-3 mb-4">
          <Button variant="ghost" onClick={cancelRide} loading={actionLoading} icon={<X size={16} />}>Cancel Ride</Button>
          <Button variant="dark" fullWidth loading={actionLoading} onClick={startTrip} icon={<Play size={16} />}>Start Trip</Button>
        </div>
      )}

      {/* Step 2: OTP generated — driver shows OTP + input box for passenger's OTP */}
      {isDriver && trip.status === 'STARTED' && (
        <div className="neo-card p-5 mb-4 bg-[#f0f9ff] border-[#0ea5e9]">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} className="text-[#0ea5e9]" />
            <p className="font-bold text-sm uppercase">OTP Verification</p>
          </div>
          {otp && (
            <div className="mb-4 p-3 bg-white border-2 border-[#0f0f0f] text-center">
              <p className="text-xs text-[#6b6b6b] mb-1">OTP sent to passenger</p>
              <p className="font-mono font-black text-3xl tracking-widest">{otp}</p>
            </div>
          )}
          <p className="text-xs text-[#6b6b6b] mb-2">Ask passenger for their OTP and enter below:</p>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={4}
              placeholder="Enter OTP"
              value={otpInput}
              onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
              className="flex-1 border-2 border-[#0f0f0f] px-3 py-2 font-mono text-xl tracking-widest text-center focus:outline-none"
            />
            <Button variant="primary" loading={actionLoading} onClick={verifyOtp} disabled={otpInput.length !== 4}>
              Verify
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: In progress — simulate + geofence complete */}
      {isDriver && trip.status === 'IN_PROGRESS' && (
        <div className="mb-4 space-y-3">
          {/* Distance indicator */}
          {distToDestM !== null && (
            <div className={`p-3 border-2 text-sm font-semibold flex items-center gap-2 ${nearDest ? 'border-[#16a34a] bg-[#f0fdf4] text-[#16a34a]' : 'border-[#0f0f0f] bg-[#f0ede6]'}`}>
              <MapPin size={14} />
              {nearDest
                ? `✅ Within ${DEST_RADIUS_M}m of destination — you can complete the trip`
                : `${distToDestM}m from destination (need < ${DEST_RADIUS_M}m to complete)`}
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={simulateMovement} icon={<Navigation size={16} />}>Simulate</Button>
            <Button
              variant="primary"
              fullWidth
              loading={actionLoading}
              onClick={completeTrip}
              disabled={distToDestM !== null && !nearDest}
              icon={<CheckCircle size={16} />}
            >
              Complete Trip
            </Button>
          </div>
          {distToDestM !== null && !nearDest && (
            <p className="text-xs text-center text-[#6b6b6b]">Use Simulate to reach destination for testing</p>
          )}
        </div>
      )}

      {/* ── PASSENGER ACTIONS ── */}

      {/* Cancel booking */}
      {!isDriver && canCancel && (
        <div className="mb-4">
          <Button variant="ghost" fullWidth loading={actionLoading} onClick={cancelBooking} icon={<X size={16} />}>
            Cancel Booking
          </Button>
        </div>
      )}

      {/* Pay Now */}
      {!isDriver && trip.status === 'PAYMENT_PENDING' && booking && (
        <div className="neo-card p-5 mb-4 border-[#d97706] bg-[#fffbeb]">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-[#16a34a]" />
            <p className="font-bold">Trip Completed!</p>
          </div>
          <p className="text-sm text-[#6b6b6b] mb-4">
            {trip.ride.pickupAddress.split(',')[0]} → {trip.ride.destAddress.split(',')[0]}
          </p>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[#6b6b6b]">Amount Due</span>
            <span className="font-display font-bold text-2xl text-[#f97316]">₹{trip.ride.farePerSeat}</span>
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={() => navigate(`/payment/${booking.id}/${trip.id}/${trip.ride.farePerSeat}`)}>
            Pay Now →
          </Button>
        </div>
      )}

      {/* Driver rates passengers */}
      {isDriver && ['PAYMENT_COMPLETED', 'COMPLETED', 'PAYMENT_PENDING'].includes(trip.status) && !passengerRated && (
        <div className="neo-card p-5 mb-4">
          <p className="font-bold text-sm uppercase mb-1">Rate your passengers</p>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setPassengerRating(s)} className="text-2xl transition-transform hover:scale-110">
                {s <= passengerRating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          {passengerRating > 0 && <Button variant="dark" size="sm" onClick={submitPassengerRating}>Submit</Button>}
        </div>
      )}

      {/* Passenger rates driver */}
      {!isDriver && ['PAYMENT_COMPLETED', 'COMPLETED'].includes(trip.status) && !rated && (
        <div className="neo-card p-5 mb-4">
          <p className="font-bold text-sm uppercase mb-3">Rate your driver</p>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setRating(s)} className="text-2xl transition-transform hover:scale-110">
                {s <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          {rating > 0 && <Button variant="dark" size="sm" onClick={submitRating}>Submit</Button>}
        </div>
      )}

      {/* Chat */}
      {showChat && (
        <div className="mb-4">
          <ChatPanel tripId={trip.id} messages={messages} currentUserId={user?.id || ''} />
        </div>
      )}
    </div>
  )
}

const haversineM = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
