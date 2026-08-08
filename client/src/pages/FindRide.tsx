import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpDown, Calendar, Clock, Users, Star, ChevronRight, CheckCircle, MapPin, Navigation2 } from 'lucide-react'
import gsap from 'gsap'
import api from '../lib/api'
import { useToast } from '../context/ToastContext'
import Button from '../components/Button'
import { Select, Badge, LoadingState, EmptyState } from '../components/ui'
import LocationSearch, { LocationResult } from '../components/LocationSearch'
import RouteMap from '../components/RouteMap'
import { Ride, SavedPlace } from '../types'

type Step = 'form' | 'confirm' | 'rides'
interface RouteData { distanceKm: number; durationMin: number; polyline: string }

export default function FindRide() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('form')
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([])
  const [pickup, setPickup] = useState<LocationResult | null>(null)
  const [destination, setDestination] = useState<LocationResult | null>(null)
  const [date, setDate] = useState(() => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    return now.toISOString().split('T')[0]
  })
  const [time, setTime] = useState(() => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  })
  const [seats, setSeats] = useState('1')
  const [routeData, setRouteData] = useState<RouteData | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const ridesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get('/saved-places').then(r => setSavedPlaces(r.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (step === 'rides' && ridesRef.current) {
      const cards = ridesRef.current.querySelectorAll('.ride-card')
      gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.35, ease: 'power2.out' })
    }
  }, [step, rides])

  const swap = () => { const tmp = pickup; setPickup(destination); setDestination(tmp) }

  const goToConfirm = () => {
    if (!pickup) return toast('Enter pickup location', 'error')
    if (!destination) return toast('Enter destination', 'error')
    setStep('confirm')
  }

  const searchRides = async () => {
    if (!pickup || !destination) return
    setLoading(true)
    try {
      const dt = new Date(`${date}T${time}`)
      const res = await api.get('/rides/search', {
        params: { pickupLat: pickup.lat, pickupLng: pickup.lng, destLat: destination.lat, destLng: destination.lng, departureTime: dt.toISOString(), seats },
      })
      setRides(res.data.data)
      setStep('rides')
      if (res.data.data.length === 0) toast('No rides found. Try a different time.', 'info')
    } catch { toast('Search failed. Try again.', 'error') }
    finally { setLoading(false) }
  }

  const book = async (ride: Ride) => {
    if (bookingId) return
    setBookingId(ride.id)
    try {
      const res = await api.post('/bookings', { rideId: ride.id, seats: parseInt(seats) })
      toast('Ride booked! 🎉', 'success')
      setTimeout(() => navigate(`/trips/${res.data.data.trip.id}`), 600)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg || 'Booking failed', 'error')
      setBookingId(null)
    }
  }

  // ── Step: Form ──────────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display font-black text-2xl text-[#212529]">Find a Ride</h1>
          <p className="text-[#868E96] mt-1">Where are you heading today?</p>
        </div>

        <div className="card-lg p-6 space-y-5">
          {/* Location inputs */}
          <div className="relative space-y-3">
            <LocationSearch
              label="Pickup Location"
              placeholder="e.g. ISKCON Temple, Ahmedabad"
              value={pickup}
              onChange={setPickup}
              savedPlaces={savedPlaces}
              accentColor="green"
            />
            <div className="flex justify-center">
              <button
                onClick={swap}
                className="w-9 h-9 rounded-full border-2 border-[#DEE2E6] bg-white hover:bg-[#F5F5F5] flex items-center justify-center transition-all hover:border-[#714B67] hover:text-[#714B67] shadow-sm"
              >
                <ArrowUpDown size={15} />
              </button>
            </div>
            <LocationSearch
              label="Destination"
              placeholder="e.g. Infocity, GIFT City"
              value={destination}
              onChange={setDestination}
              savedPlaces={savedPlaces}
              accentColor="red"
            />
          </div>

          {/* Route preview */}
          {pickup && destination && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(113,75,103,0.06)', border: '1px solid rgba(113,75,103,0.15)' }}>
              <Navigation2 size={14} style={{ color: '#714B67' }} />
              <span className="truncate font-medium text-[#495057]">{pickup.address.split(',')[0]}</span>
              <ChevronRight size={12} className="text-[#868E96] shrink-0" />
              <span className="truncate font-medium text-[#495057]">{destination.address.split(',')[0]}</span>
            </div>
          )}

          {/* Date + Time + Seats */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#495057] mb-1.5">Date</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#868E96]" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input pl-9 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#495057] mb-1.5">Time</label>
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#868E96]" />
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input pl-9 text-sm" />
              </div>
            </div>
            <Select
              label="Seats"
              value={seats}
              onChange={e => setSeats(e.target.value)}
              options={[1, 2, 3, 4].map(n => ({ value: String(n), label: `${n} seat${n > 1 ? 's' : ''}` }))}
            />
          </div>

          <Button variant="primary" size="lg" fullWidth onClick={goToConfirm} disabled={!pickup || !destination}>
            Confirm Route →
          </Button>
        </div>
      </div>
    )
  }

  // ── Step: Route Confirmation ─────────────────────────────────────────────────
  if (step === 'confirm' && pickup && destination) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display font-black text-2xl text-[#212529]">Confirm Route</h1>
            <p className="text-[#868E96] mt-0.5">Verify your route before searching</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStep('form')}>← Edit</Button>
        </div>

        {/* Full-height map */}
        <div className="mb-5">
          <RouteMap
            pickup={pickup}
            destination={destination}
            heightPx={440}
            onRouteCalculated={(distKm, durMin, polyline) => setRouteData({ distanceKm: distKm, durationMin: durMin, polyline })}
          />
        </div>

        {/* Route details */}
        <div className="card p-5 mb-5">
          <div className="grid grid-cols-2 gap-5 mb-4">
            <div>
              <p className="text-xs font-semibold text-[#868E96] uppercase tracking-wider mb-1.5">Pickup</p>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00A09D] mt-1 shrink-0" />
                <p className="font-semibold text-sm text-[#212529] leading-snug">{pickup.address}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#868E96] uppercase tracking-wider mb-1.5">Destination</p>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full bg-[#F06050] mt-1 shrink-0" />
                <p className="font-semibold text-sm text-[#212529] leading-snug">{destination.address}</p>
              </div>
            </div>
          </div>

          {routeData && (
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#DEE2E6]">
              <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(113,75,103,0.06)' }}>
                <p className="text-xs text-[#868E96] font-medium">Distance</p>
                <p className="font-display font-bold text-xl text-[#714B67] mt-0.5">{routeData.distanceKm} km</p>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(0,160,157,0.06)' }}>
                <p className="text-xs text-[#868E96] font-medium">Est. Time</p>
                <p className="font-display font-bold text-xl text-[#00A09D] mt-0.5">{routeData.durationMin} min</p>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(240,96,80,0.06)' }}>
                <p className="text-xs text-[#868E96] font-medium">Seats</p>
                <p className="font-display font-bold text-xl text-[#F06050] mt-0.5">{seats}</p>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-3 text-xs text-[#868E96]">
            <span>📅 {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            <span>🕐 {time}</span>
          </div>
        </div>

        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={searchRides} icon={<CheckCircle size={16} />}>
          Find Matching Rides →
        </Button>
      </div>
    )
  }

  // ── Step: Available Rides ────────────────────────────────────────────────────
  if (step === 'rides') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display font-black text-2xl text-[#212529]">Available Rides</h1>
            <p className="text-[#868E96] mt-0.5">{rides.length} match{rides.length !== 1 ? 'es' : ''} found</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStep('confirm')}>← Back</Button>
        </div>

        {/* Route bar */}
        {pickup && destination && (
          <div className="flex items-center gap-2 p-3.5 rounded-2xl text-sm mb-5 text-white" style={{ background: 'linear-gradient(135deg, #714B67, #875A7B)' }}>
            <MapPin size={14} className="shrink-0 opacity-70" />
            <span className="truncate font-medium">{pickup.address.split(',')[0]}</span>
            <ChevronRight size={12} className="shrink-0 opacity-50" />
            <span className="truncate font-medium">{destination.address.split(',')[0]}</span>
            {routeData && <span className="ml-auto shrink-0 opacity-70 font-bold">{routeData.distanceKm}km</span>}
          </div>
        )}

        {rides.length === 0 ? (
          <EmptyState message="No rides found. Try a different time or date." />
        ) : (
          <div className="space-y-4" ref={ridesRef}>
            {rides.map(ride => (
              <div key={ride.id} className="ride-card card p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
                {/* Driver + match */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0"
                      style={{ background: 'linear-gradient(135deg, #714B67, #875A7B)' }}
                    >
                      {ride.driver.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-[#212529]">{ride.driver.name}</p>
                      <div className="flex items-center gap-1 text-xs text-[#868E96]">
                        <Star size={11} fill="#F0A500" className="text-[#F0A500]" />
                        <span>{ride.driverRating ?? '4.5'} · {ride.ratingCount ?? 0} ratings</span>
                      </div>
                    </div>
                  </div>
                  {ride.matchScore !== undefined && (
                    <span
                      className="badge font-bold"
                      style={{
                        background: ride.matchScore >= 80 ? 'rgba(0,160,157,0.1)' : ride.matchScore >= 50 ? 'rgba(240,165,0,0.1)' : '#F5F5F5',
                        color: ride.matchScore >= 80 ? '#00A09D' : ride.matchScore >= 50 ? '#B45309' : '#495057',
                      }}
                    >
                      {ride.matchScore}% Match
                    </span>
                  )}
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Vehicle', main: ride.vehicle.model, sub: ride.vehicle.registration, color: '#714B67' },
                    { label: 'Departs', main: new Date(ride.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), sub: new Date(ride.departureTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), color: '#00A09D' },
                    { label: 'Seats Left', main: `${ride.availableSeats}`, sub: `of ${ride.totalSeats}`, color: '#F06050' },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl" style={{ background: `${item.color}0D` }}>
                      <p className="text-xs font-semibold text-[#868E96] mb-0.5">{item.label}</p>
                      <p className="font-bold text-sm text-[#212529] truncate">{item.main}</p>
                      <p className="text-xs text-[#868E96] font-mono">{item.sub}</p>
                    </div>
                  ))}
                </div>

                {ride.distanceKm && (
                  <p className="text-xs text-[#868E96] mb-3">📍 {ride.distanceKm} km · ⏱ {ride.durationMin} min</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#DEE2E6]">
                  <div>
                    <span className="font-display font-black text-3xl" style={{ color: '#714B67' }}>₹{ride.farePerSeat}</span>
                    <span className="text-xs text-[#868E96] ml-1">/ seat</span>
                  </div>
                  <Button
                    variant="primary" size="md"
                    loading={bookingId === ride.id}
                    disabled={!!bookingId && bookingId !== ride.id}
                    onClick={() => book(ride)}
                  >
                    Book Now →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return <LoadingState />
}
