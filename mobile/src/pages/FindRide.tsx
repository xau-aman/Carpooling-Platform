import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpDown, Search, Star, Users, MapPin, Clock, Map, Car, Navigation } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../context/ToastContext'
import MapPicker from '../components/MapPicker'

interface LocationResult { display_name: string; lat: string; lon: string }
interface Ride {
  id: string; pickupAddress: string; destAddress: string; farePerSeat: number
  availableSeats: number; departureTime: string; distanceKm?: number; durationMin?: number
  matchScore?: number; driverRating?: number
  driver: { name: string }
  vehicle: { model: string; registration: string; color?: string }
}

async function searchLocation(q: string): Promise<LocationResult[]> {
  if (q.length < 3) return []
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
      { headers: { 'Accept-Language': 'en' } }
    )
    return res.json()
  } catch { return [] }
}

function LocationInput({ label: _label, value, onChange, placeholder, onMapOpen, color }: {
  label: string; value: string; onChange: (v: LocationResult) => void
  placeholder: string; onMapOpen: () => void; color: string
}) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<LocationResult[]>([])
  const [open, setOpen] = useState(false)
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  // Sync external value changes (e.g. from map picker or swap)
  const handleChange = (v: string) => {
    setQuery(v)
    if (timer) clearTimeout(timer)
    if (v.length < 3) { setResults([]); setOpen(false); return }
    setTimer(setTimeout(async () => {
      const r = await searchLocation(v)
      setResults(r); setOpen(r.length > 0)
    }, 400))
  }

  const select = (r: LocationResult) => {
    const lbl = r.display_name.split(',').slice(0, 2).join(', ')
    setQuery(lbl); setOpen(false); onChange(r)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-2xl px-3 py-3">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <input
          className="flex-1 bg-transparent text-sm font-medium text-[#0f0f0f] outline-none placeholder:text-[#9ca3af]"
          placeholder={placeholder}
          value={query}
          onChange={e => handleChange(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        <button
          onMouseDown={e => { e.preventDefault(); onMapOpen() }}
          onClick={onMapOpen}
          className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0 active:scale-90"
        >
          <Map size={13} className="text-[#714B67]" />
        </button>
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-[#e5e5e5] z-50 overflow-hidden">
          {results.map((r, i) => (
            <button key={i}
              className="w-full px-4 py-3 text-left border-b border-[#f5f5f5] last:border-0 active:bg-[#f5f5f5] flex items-start gap-2"
              onMouseDown={e => { e.preventDefault(); select(r) }}
              onClick={() => select(r)}>
              <MapPin size={13} className="text-[#714B67] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm text-[#0f0f0f] truncate">{r.display_name.split(',')[0]}</p>
                <p className="text-xs text-[#6b6b6b] truncate">{r.display_name.split(',').slice(1, 3).join(',')}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FindRide() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [pickup, setPickup] = useState<LocationResult | null>(null)
  const [dest, setDest] = useState<LocationResult | null>(null)
  const [pickupLabel, setPickupLabel] = useState('')
  const [destLabel, setDestLabel] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('09:00')
  const [seats, setSeats] = useState('1')
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [bookingRideId, setBookingRideId] = useState<string | null>(null)
  const [mapFor, setMapFor] = useState<'pickup' | 'dest' | null>(null)

  const swap = () => {
    const tp = pickup; setPickup(dest); setDest(tp)
    const tl = pickupLabel; setPickupLabel(destLabel); setDestLabel(tl)
  }

  const search = async () => {
    if (!pickup || !dest) return toast('Select pickup and destination', 'error')
    setLoading(true); setSearched(false)
    try {
      const dt = new Date(`${date}T${time}`)
      const res = await api.get('/rides/search', {
        params: { pickupLat: pickup.lat, pickupLng: pickup.lon, destLat: dest.lat, destLng: dest.lon, departureTime: dt.toISOString(), seats },
      })
      setRides(res.data.data); setSearched(true)
      if (!res.data.data.length) toast('No rides found. Try different time.', 'info')
    } catch { toast('Search failed', 'error') }
    finally { setLoading(false) }
  }

  const book = async (ride: Ride) => {
    if (bookingRideId) return
    setBookingRideId(ride.id)
    try {
      const res = await api.post('/bookings', { rideId: ride.id, seats: parseInt(seats) })
      toast('Ride booked!', 'success')
      setTimeout(() => navigate(`/trip/${res.data.data.trip.id}`), 500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg || 'Booking failed', 'error')
      setBookingRideId(null)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      {mapFor && (
        <MapPicker
          label={mapFor === 'pickup' ? 'Select Pickup' : 'Select Destination'}
          onClose={() => setMapFor(null)}
          onConfirm={r => {
            const lbl = r.display_name.split(',').slice(0, 2).join(', ')
            if (mapFor === 'pickup') { setPickup(r); setPickupLabel(lbl) }
            else { setDest(r); setDestLabel(lbl) }
            setMapFor(null)
          }}
        />
      )}

      {/* Header */}
      <div className="bg-white px-4 shadow-sm shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)', paddingBottom: 16 }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-xl">Find a Ride</h1>
        </div>

        {/* Location inputs */}
        <div className="bg-[#f9f9f9] rounded-2xl p-3 space-y-1 relative">
          <LocationInput
            label="From" value={pickupLabel} color="#16a34a"
            placeholder="Pickup location"
            onChange={r => { setPickup(r); setPickupLabel(r.display_name.split(',').slice(0,2).join(', ')) }}
            onMapOpen={() => setMapFor('pickup')}
          />
          {/* Divider with swap */}
          <div className="flex items-center gap-2 px-1">
            <div className="flex-1 h-px bg-[#e5e5e5]" />
            <button onClick={swap} className="w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center active:scale-90 border border-[#e5e5e5]">
              <ArrowUpDown size={12} className="text-[#714B67]" />
            </button>
            <div className="flex-1 h-px bg-[#e5e5e5]" />
          </div>
          <LocationInput
            label="To" value={destLabel} color="#dc2626"
            placeholder="Destination"
            onChange={r => { setDest(r); setDestLabel(r.display_name.split(',').slice(0,2).join(', ')) }}
            onMapOpen={() => setMapFor('dest')}
          />
        </div>

        {/* Date / Time / Seats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div>
            <p className="text-[10px] font-bold text-[#6b6b6b] uppercase mb-1">Date</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-[#f5f5f5] rounded-xl px-2 py-2 text-xs font-medium outline-none" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#6b6b6b] uppercase mb-1">Time</p>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full bg-[#f5f5f5] rounded-xl px-2 py-2 text-xs font-medium outline-none" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#6b6b6b] uppercase mb-1">Seats</p>
            <select value={seats} onChange={e => setSeats(e.target.value)}
              className="w-full bg-[#f5f5f5] rounded-xl px-2 py-2 text-xs font-medium outline-none">
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <button onClick={search} disabled={loading} className="m-btn m-btn-primary m-btn-full mt-3">
          {loading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><Search size={16} /> Search Rides</>}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 80px)' }}>
        {searched && rides.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mb-4">
              <Search size={28} className="text-[#9ca3af]" />
            </div>
            <p className="font-bold text-[#0f0f0f]">No rides found</p>
            <p className="text-sm text-[#6b6b6b] mt-1">Try a different time or date</p>
          </div>
        )}

        {rides.length > 0 && (
          <div className="p-4 space-y-3">
            <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">{rides.length} ride{rides.length > 1 ? 's' : ''} found</p>
            {rides.map(ride => (
              <div key={ride.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* Match score banner */}
                {ride.matchScore && ride.matchScore >= 80 && (
                  <div className="px-4 py-1.5 flex items-center gap-1.5" style={{ background: '#f0fdf4' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                    <p className="text-xs font-bold text-[#16a34a]">{ride.matchScore}% route match</p>
                  </div>
                )}

                <div className="p-4">
                  {/* Driver row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-base shrink-0"
                      style={{ background: 'linear-gradient(135deg,#714B67,#875A7B)' }}>
                      {ride.driver.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#0f0f0f]">{ride.driver.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={10} fill="#f97316" className="text-[#f97316]" />
                        <span className="text-xs text-[#6b6b6b]">{ride.driverRating?.toFixed(1) ?? '4.9'}</span>
                        <span className="text-[#e5e5e5] mx-1">·</span>
                        <Car size={10} className="text-[#6b6b6b]" />
                        <span className="text-xs text-[#6b6b6b] truncate">{ride.vehicle.model}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display font-black text-2xl text-[#f97316]">₹{ride.farePerSeat}</p>
                      <p className="text-[10px] text-[#6b6b6b]">per seat</p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#16a34a]" />
                      <div className="w-px flex-1 bg-[#e5e5e5] min-h-[16px]" />
                      <div className="w-2 h-2 rounded-full bg-[#dc2626]" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-sm font-semibold text-[#0f0f0f] truncate">{ride.pickupAddress.split(',')[0]}</p>
                      <p className="text-sm font-semibold text-[#0f0f0f] truncate">{ride.destAddress.split(',')[0]}</p>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-1 bg-[#f5f5f5] rounded-full px-2.5 py-1">
                      <Clock size={11} className="text-[#6b6b6b]" />
                      <span className="text-xs font-medium text-[#6b6b6b]">
                        {new Date(ride.departureTime).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#f5f5f5] rounded-full px-2.5 py-1">
                      <Users size={11} className="text-[#6b6b6b]" />
                      <span className="text-xs font-medium text-[#6b6b6b]">{ride.availableSeats} seats left</span>
                    </div>
                    {ride.distanceKm && (
                      <div className="flex items-center gap-1 bg-[#f5f5f5] rounded-full px-2.5 py-1">
                        <Navigation size={11} className="text-[#6b6b6b]" />
                        <span className="text-xs font-medium text-[#6b6b6b]">{ride.distanceKm}km</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => book(ride)}
                    disabled={!!bookingRideId}
                    className="m-btn m-btn-primary m-btn-full disabled:opacity-60"
                    style={{ borderRadius: 14, padding: '12px 0' }}
                  >
                    {bookingRideId === ride.id
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : 'Book this Ride →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
