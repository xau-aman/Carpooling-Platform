import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, MessageCircle, Navigation, Star, CheckCircle, Play, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'
import { connectSocket, getSocket } from '../lib/socket'
import Button from '../components/Button'
import { Badge, LoadingState, ErrorState } from '../components/ui'
import { Trip, ChatMessage, LocationPoint } from '../types'
import LiveMap from '../features/tracking/LiveMap'
import ChatPanel from '../features/tracking/ChatPanel'

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
  const [rating, setRating] = useState(0)
  const [rated, setRated] = useState(false)
  const [passengerRating, setPassengerRating] = useState(0)
  const [passengerRated, setPassengerRated] = useState(false)
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
    socket.on('trip:location', (loc: LocationPoint) => setDriverLocation(loc))
    socket.on('chat:message', (msg: ChatMessage) => setMessages(prev => [...prev, msg]))
    return () => {
      socket.emit('trip:leave', trip.id)
      socket.off('trip:location')
      socket.off('chat:message')
    }
  }, [trip])

  const startTrip = async () => {
    if (!trip) return
    setActionLoading(true)
    try {
      await api.post(`/trips/${trip.id}/start`)
      setTrip(t => t ? { ...t, status: 'IN_PROGRESS' } : t)
      toast('Trip started! Share your location.', 'success')
      if (navigator.geolocation) {
        watchRef.current = navigator.geolocation.watchPosition(pos => {
          getSocket().emit('trip:location', {
            tripId: trip.id,
            lat: pos.coords.latitude, lng: pos.coords.longitude,
            heading: pos.coords.heading ?? undefined,
            speed: pos.coords.speed ?? undefined,
          })
        }, () => toast('Location access denied. Use Simulate instead.', 'info'), { enableHighAccuracy: true })
      }
    } catch { toast('Failed to start trip', 'error') }
    finally { setActionLoading(false) }
  }

  const simulateMovement = () => {
    if (!trip) return
    const waypoints = [
      { lat: 22.5839, lng: 88.3424 }, { lat: 22.5800, lng: 88.3600 },
      { lat: 22.5760, lng: 88.3800 }, { lat: 22.5740, lng: 88.4000 },
      { lat: 22.5730, lng: 88.4150 }, { lat: 22.5726, lng: 88.4319 },
    ]
    getSocket().emit('trip:simulate', { tripId: trip.id, waypoints })
    toast('Simulation started — passenger can see movement', 'info')
  }

  const completeTrip = async () => {
    if (!trip) return
    setActionLoading(true)
    try {
      await api.post(`/trips/${trip.id}/complete`)
      setTrip(t => t ? { ...t, status: 'PAYMENT_PENDING' } : t)
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
      toast('Trip completed! Waiting for payment.', 'success')
    } catch { toast('Failed to complete trip', 'error') }
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
    if (!passengers.length) return
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

  const statusConfig: Record<string, { label: string; variant: 'info' | 'warning' | 'danger' | 'success' | 'default' }> = {
    BOOKED: { label: 'UPCOMING', variant: 'info' },
    STARTED: { label: 'STARTING', variant: 'info' },
    IN_PROGRESS: { label: '🔴 LIVE', variant: 'warning' },
    PAYMENT_PENDING: { label: 'PAYMENT PENDING', variant: 'danger' },
    PAYMENT_COMPLETED: { label: 'COMPLETED', variant: 'success' },
    COMPLETED: { label: 'COMPLETED', variant: 'success' },
    CANCELLED: { label: 'CANCELLED', variant: 'default' },
  }
  const sc = statusConfig[trip.status] ?? { label: trip.status, variant: 'default' as const }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/trips')} className="p-2 border-2 border-[#0f0f0f] bg-white hover:bg-[#f0ede6] transition-colors">
          ←
        </button>
        <h1 className="font-display font-bold text-xl uppercase flex-1">Trip Details</h1>
        <Badge variant={sc.variant}>{sc.label}</Badge>
      </div>

      {/* Live Map */}
      {(trip.status === 'IN_PROGRESS' || driverLocation) && (
        <div className="mb-4 h-64 border-2 border-[#0f0f0f] overflow-hidden">
          <LiveMap
            pickup={{ lat: trip.ride.pickupLat, lng: trip.ride.pickupLng }}
            destination={{ lat: trip.ride.destLat, lng: trip.ride.destLng }}
            driverLocation={driverLocation}
          />
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
              <a href={`tel:${driverPhone}`} className="neo-btn neo-btn-outline p-2.5">
                <Phone size={15} />
              </a>
            )}
            <button onClick={() => setShowChat(v => !v)} className={`neo-btn p-2.5 ${showChat ? 'bg-[#0f0f0f] text-white' : 'neo-btn-outline'}`}>
              <MessageCircle size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Trip info grid */}
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

      {/* Driver actions */}
      {isDriver && trip.status === 'BOOKED' && (
        <div className="flex gap-3 mb-4">
          <Button variant="dark" fullWidth loading={actionLoading} onClick={startTrip} icon={<Play size={16} />}>
            Start Trip
          </Button>
        </div>
      )}

      {isDriver && trip.status === 'IN_PROGRESS' && (
        <div className="flex gap-3 mb-4">
          <Button variant="ghost" onClick={simulateMovement} icon={<Navigation size={16} />}>
            Simulate
          </Button>
          <Button variant="primary" fullWidth loading={actionLoading} onClick={completeTrip} icon={<CheckCircle size={16} />}>
            Complete Trip
          </Button>
        </div>
      )}

      {/* Passenger payment */}
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

      {/* Two-way Rating: Driver rates passengers */}
      {isDriver && ['PAYMENT_COMPLETED', 'COMPLETED', 'PAYMENT_PENDING'].includes(trip.status) && !passengerRated && (
        <div className="neo-card p-5 mb-4">
          <p className="font-bold text-sm uppercase mb-1">Rate your passengers</p>
          <p className="text-xs text-[#6b6b6b] mb-3">How was the ride experience?</p>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setPassengerRating(s)} className="text-2xl transition-transform hover:scale-110">
                {s <= passengerRating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          {passengerRating > 0 && (
            <Button variant="dark" size="sm" onClick={submitPassengerRating}>Submit Rating</Button>
          )}
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
          {rating > 0 && (
            <Button variant="dark" size="sm" onClick={submitRating}>Submit Rating</Button>
          )}
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
