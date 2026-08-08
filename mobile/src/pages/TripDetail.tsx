import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, MessageCircle, Play, CheckCircle, Navigation, Star, Send, X } from 'lucide-react'
import api from '../lib/api'
import { connectSocket, getSocket } from '../lib/socket'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

interface LocationPoint { lat: number; lng: number; heading?: number; speed?: number }
interface ChatMsg { id: string; senderId: string; message: string; createdAt: string; sender: { name: string } }
interface Trip {
  id: string; rideId: string; status: string
  ride: {
    pickupAddress: string; destAddress: string; farePerSeat: number
    pickupLat: number; pickupLng: number; destLat: number; destLng: number
    distanceKm?: number; durationMin?: number; departureTime: string
    driver: { id: string; name: string; phone?: string }
    vehicle: { model: string; registration: string }
    bookings?: { id: string; userId: string }[]
  }
  participants: { id: string; userId: string; isDriver: boolean; user: { id: string; name: string } }[]
  messages?: ChatMsg[]
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  BOOKED:            { label: 'Upcoming',      bg: '#EFF6FF', color: '#2563EB' },
  IN_PROGRESS:       { label: '🔴 Live',       bg: '#FFF7ED', color: '#EA580C' },
  PAYMENT_PENDING:   { label: 'Pay Now',       bg: '#FEF9C3', color: '#CA8A04' },
  PAYMENT_COMPLETED: { label: 'Completed',     bg: '#F0FDF4', color: '#16A34A' },
  COMPLETED:         { label: 'Completed',     bg: '#F0FDF4', color: '#16A34A' },
}

export default function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [showChat, setShowChat] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [driverLoc, setDriverLoc] = useState<LocationPoint | null>(null)
  const [rating, setRating] = useState(0)
  const [rated, setRated] = useState(false)
  const [passengerRating, setPassengerRating] = useState(0)
  const [passengerRated, setPassengerRated] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const watchRef = useRef<number | null>(null)

  useEffect(() => {
    if (!id) return
    api.get(`/trips/${id}`)
      .then(r => { setTrip(r.data.data); setMessages(r.data.data.messages || []) })
      .catch(() => toast('Trip not found', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!trip) return
    const socket = connectSocket()
    socket.emit('trip:join', trip.id)
    socket.emit('chat:join', trip.id)
    socket.on('trip:location', (loc: LocationPoint) => setDriverLoc(loc))
    socket.on('chat:message', (msg: ChatMsg) => setMessages(p => [...p, msg]))
    return () => { socket.emit('trip:leave', trip.id); socket.off('trip:location'); socket.off('chat:message') }
  }, [trip])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isDriver = trip?.participants.find(p => p.userId === user?.id)?.isDriver

  const startTrip = async () => {
    if (!trip) return
    setActionLoading(true)
    try {
      await api.post(`/trips/${trip.id}/start`)
      setTrip(t => t ? { ...t, status: 'IN_PROGRESS' } : t)
      toast('Trip started!', 'success')
      if (navigator.geolocation) {
        watchRef.current = navigator.geolocation.watchPosition(pos => {
          getSocket().emit('trip:location', { tripId: trip.id, lat: pos.coords.latitude, lng: pos.coords.longitude })
        }, () => {}, { enableHighAccuracy: true })
      }
    } catch { toast('Failed to start', 'error') }
    finally { setActionLoading(false) }
  }

  const simulate = () => {
    if (!trip) return
    const waypoints = [
      { lat: 22.5839, lng: 88.3424 }, { lat: 22.5800, lng: 88.3600 },
      { lat: 22.5760, lng: 88.3800 }, { lat: 22.5740, lng: 88.4000 },
      { lat: 22.5726, lng: 88.4319 },
    ]
    getSocket().emit('trip:simulate', { tripId: trip.id, waypoints })
    toast('Simulation started', 'info')
  }

  const completeTrip = async () => {
    if (!trip) return
    setActionLoading(true)
    try {
      await api.post(`/trips/${trip.id}/complete`)
      setTrip(t => t ? { ...t, status: 'PAYMENT_PENDING' } : t)
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
      toast('Trip completed!', 'success')
    } catch { toast('Failed to complete', 'error') }
    finally { setActionLoading(false) }
  }

  const sendChat = () => {
    if (!chatInput.trim() || !trip) return
    getSocket().emit('chat:message', { tripId: trip.id, message: chatInput.trim() })
    setChatInput('')
  }

  const submitRating = async () => {
    if (!trip || !rating) return
    const driver = trip.participants.find(p => p.isDriver)
    if (!driver) return
    try {
      await api.post('/ratings', { rateeId: driver.userId, rideId: trip.rideId, score: rating })
      setRated(true); toast('Rating submitted!', 'success')
    } catch { toast('Failed to rate', 'error') }
  }

  const submitPassengerRating = async () => {
    if (!trip || !passengerRating) return
    const passengers = trip.participants.filter(p => !p.isDriver)
    try {
      await Promise.all(passengers.map(p => api.post('/ratings', { rateeId: p.userId, rideId: trip.rideId, score: passengerRating })))
      setPassengerRated(true); toast('Passengers rated!', 'success')
    } catch { toast('Failed to rate', 'error') }
  }

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-[#714B67] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!trip) return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center">
      <p className="text-4xl mb-3">😕</p>
      <p className="font-bold text-xl">Trip not found</p>
      <button onClick={() => navigate('/trips')} className="m-btn m-btn-primary mt-4">Go Back</button>
    </div>
  )

  const sc = statusConfig[trip.status] ?? { label: trip.status, bg: '#f5f5f5', color: '#6b6b6b' }
  const driver = trip.participants.find(p => p.isDriver)
  const booking = trip.ride.bookings?.find(b => b.userId === user?.id)
  const driverPhone = (trip.ride.driver as { phone?: string }).phone

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <button onClick={() => navigate('/trips')} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-lg">Trip Details</h1>
        </div>
        <span className="m-badge text-xs" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
      </div>

      <div className="flex-1 overflow-y-auto safe-bottom">
        {/* Driver card */}
        <div className="m-4 m-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0" style={{ background: '#714B67' }}>
              {driver?.user.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-bold text-base">{driver?.user.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={12} fill="#f97316" className="text-[#f97316]" />
                <span className="text-xs text-[#6b6b6b]">4.9 · Driver</span>
              </div>
            </div>
            <div className="flex gap-2">
              {driverPhone && (
                <a href={`tel:${driverPhone}`} className="w-10 h-10 rounded-2xl bg-[#f0fdf4] flex items-center justify-center">
                  <Phone size={16} className="text-[#16a34a]" />
                </a>
              )}
              <button
                onClick={() => setShowChat(v => !v)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${showChat ? 'bg-[#714B67]' : 'bg-[#f5f5f5]'}`}
              >
                <MessageCircle size={16} className={showChat ? 'text-white' : 'text-[#6b6b6b]'} />
              </button>
            </div>
          </div>
        </div>

        {/* Route info */}
        <div className="mx-4 m-card p-4 mb-4">
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
              {trip.ride.distanceKm && (
                <p className="text-xs text-[#6b6b6b] mt-1">{trip.ride.distanceKm}km · {trip.ride.durationMin}min</p>
              )}
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

        {/* Live location indicator */}
        {driverLoc && (
          <div className="mx-4 mb-4 bg-[#f97316] rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Navigation size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Driver is moving</p>
              <p className="text-white/70 text-xs">Lat: {driverLoc.lat.toFixed(4)}, Lng: {driverLoc.lng.toFixed(4)}</p>
            </div>
          </div>
        )}

        {/* Driver actions */}
        {isDriver && trip.status === 'BOOKED' && (
          <div className="mx-4 mb-4">
            <button onClick={startTrip} disabled={actionLoading} className="m-btn m-btn-dark m-btn-full">
              {actionLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Play size={18} /> Start Trip</>}
            </button>
          </div>
        )}

        {isDriver && trip.status === 'IN_PROGRESS' && (
          <div className="mx-4 mb-4 flex gap-3">
            <button onClick={simulate} className="m-btn m-btn-outline flex-1">
              <Navigation size={16} /> Simulate
            </button>
            <button onClick={completeTrip} disabled={actionLoading} className="m-btn m-btn-primary flex-1">
              {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle size={16} /> Complete</>}
            </button>
          </div>
        )}

        {/* Payment */}
        {!isDriver && trip.status === 'PAYMENT_PENDING' && booking && (
          <div className="mx-4 mb-4 m-card p-4" style={{ background: '#fffbeb', borderColor: '#f97316' }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={20} className="text-[#16a34a]" />
              <p className="font-bold">Trip Completed!</p>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#6b6b6b]">Amount Due</span>
              <span className="font-display font-black text-3xl text-[#f97316]">₹{trip.ride.farePerSeat}</span>
            </div>
            <button
              onClick={() => navigate(`/payment/${booking.id}/${trip.id}/${trip.ride.farePerSeat}`)}
              className="m-btn m-btn-orange m-btn-full"
            >
              Pay Now →
            </button>
          </div>
        )}

        {/* Driver rates passengers */}
        {isDriver && ['PAYMENT_COMPLETED', 'COMPLETED', 'PAYMENT_PENDING'].includes(trip.status) && !passengerRated && (
          <div className="mx-4 mb-4 m-card p-4">
            <p className="font-bold text-sm mb-1">Rate your passengers</p>
            <p className="text-xs text-[#6b6b6b] mb-3">How was the ride experience?</p>
            <div className="flex gap-3 mb-3">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setPassengerRating(s)} className="text-2xl transition-transform active:scale-110">
                  {s <= passengerRating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            {passengerRating > 0 && (
              <button onClick={submitPassengerRating} className="m-btn m-btn-dark text-sm py-2.5 px-5">Submit</button>
            )}
          </div>
        )}

        {/* Passenger rates driver */}
        {!isDriver && ['PAYMENT_COMPLETED', 'COMPLETED'].includes(trip.status) && !rated && (
          <div className="mx-4 mb-4 m-card p-4">
            <p className="font-bold text-sm mb-3">Rate your driver</p>
            <div className="flex gap-3 mb-3">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} className="text-2xl transition-transform active:scale-110">
                  {s <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            {rating > 0 && (
              <button onClick={submitRating} className="m-btn m-btn-dark text-sm py-2.5 px-5">Submit Rating</button>
            )}
          </div>
        )}
      </div>

      {/* Chat overlay */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
          <div className="flex items-center gap-3 px-4 py-4 border-b border-[#f5f5f5]">
            <button onClick={() => setShowChat(false)} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center">
              <X size={20} />
            </button>
            <p className="font-display font-bold text-lg">Trip Chat</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-sm text-[#6b6b6b] mt-8">No messages yet. Say hi! 👋</p>
            )}
            {messages.map(msg => {
              const mine = msg.senderId === user?.id
              return (
                <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${mine ? 'bg-[#714B67] text-white rounded-br-sm' : 'bg-[#f5f5f5] text-[#0f0f0f] rounded-bl-sm'}`}>
                    {!mine && <p className="text-xs font-bold mb-1 opacity-60">{msg.sender.name}</p>}
                    <p>{msg.message}</p>
                    <p className={`text-xs mt-1 ${mine ? 'text-white/60' : 'text-[#6b6b6b]'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={chatBottomRef} />
          </div>
          <div className="flex gap-3 px-4 py-3 border-t border-[#f5f5f5]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 12px)' }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Type a message..."
              className="flex-1 bg-[#f5f5f5] rounded-2xl px-4 py-3 text-sm outline-none"
            />
            <button onClick={sendChat} className="w-12 h-12 rounded-2xl bg-[#714B67] flex items-center justify-center active:scale-95">
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
