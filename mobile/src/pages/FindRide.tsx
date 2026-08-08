import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpDown, Search, Star, Users, MapPin, Clock } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../context/ToastContext'

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
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', Kolkata')}&format=json&limit=5`,
    { headers: { 'Accept-Language': 'en' } }
  )
  return res.json()
}

function LocationInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: LocationResult) => void; placeholder: string
}) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<LocationResult[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.length >= 3) {
        const r = await searchLocation(query)
        setResults(r); setOpen(true)
      } else {
        setResults([]); setOpen(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="relative">
      <label className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="flex items-center gap-3 bg-[#f5f5f5] rounded-2xl px-4 py-3.5">
        <MapPin size={16} className={label === 'From' ? 'text-[#16a34a]' : 'text-[#dc2626]'} />
        <input
          className="flex-1 bg-transparent text-sm font-medium text-[#0f0f0f] outline-none placeholder:text-[#6b6b6b]"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-[#e5e5e5] z-50 overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full px-4 py-3 text-left text-sm border-b border-[#f5f5f5] last:border-0 active:bg-[#f5f5f5]"
              onClick={() => {
                setQuery(r.display_name.split(',').slice(0, 2).join(','))
                onChange(r); setOpen(false)
              }}
            >
              <p className="font-medium text-[#0f0f0f] truncate">{r.display_name.split(',')[0]}</p>
              <p className="text-xs text-[#6b6b6b] truncate mt-0.5">{r.display_name.split(',').slice(1, 3).join(',')}</p>
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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('09:00')
  const [seats, setSeats] = useState('1')
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)

  const swap = () => {
    const tmp = pickup; setPickup(dest); setDest(tmp)
  }

  const search = async () => {
    if (!pickup || !dest) return toast('Enter pickup and destination', 'error')
    setLoading(true)
    try {
      const dt = new Date(`${date}T${time}`)
      const res = await api.get('/rides/search', {
        params: {
          pickupLat: pickup.lat, pickupLng: pickup.lon,
          destLat: dest.lat, destLng: dest.lon,
          departureTime: dt.toISOString(), seats,
        },
      })
      setRides(res.data.data)
      setSearched(true)
      if (!res.data.data.length) toast('No rides found. Try different time.', 'info')
    } catch { toast('Search failed', 'error') }
    finally { setLoading(false) }
  }

  const book = async (ride: Ride) => {
    if (bookingId) return
    setBookingId(ride.id)
    try {
      const res = await api.post('/bookings', { rideId: ride.id, seats: parseInt(seats) })
      toast('Ride booked! 🎉', 'success')
      setTimeout(() => navigate(`/trip/${res.data.data.trip.id}`), 600)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg || 'Booking failed', 'error')
      setBookingId(null)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-5 shadow-sm" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-xl">Find a Ride</h1>
        </div>

        {/* Location inputs */}
        <div className="relative space-y-3">
          <LocationInput label="From" value="" onChange={setPickup} placeholder="Howrah Station, Kolkata" />
          <button
            onClick={swap}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center z-10 active:scale-90"
          >
            <ArrowUpDown size={14} className="text-[#714B67]" />
          </button>
          <LocationInput label="To" value="" onChange={setDest} placeholder="Sector V, Salt Lake, Kolkata" />
        </div>

        {/* Date/Time/Seats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div>
            <label className="text-xs font-bold text-[#6b6b6b] mb-1 block">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-[#f5f5f5] rounded-xl px-3 py-2.5 text-sm font-medium outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-[#6b6b6b] mb-1 block">Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full bg-[#f5f5f5] rounded-xl px-3 py-2.5 text-sm font-medium outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-[#6b6b6b] mb-1 block">Seats</label>
            <select value={seats} onChange={e => setSeats(e.target.value)}
              className="w-full bg-[#f5f5f5] rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={search}
          disabled={loading}
          className="m-btn m-btn-primary m-btn-full mt-4"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Search size={18} /> Search Rides</>
          )}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {searched && rides.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-bold text-[#0f0f0f]">No rides found</p>
            <p className="text-sm text-[#6b6b6b] mt-1">Try a different time or date</p>
          </div>
        )}

        {rides.map(ride => (
          <div key={ride.id} className="m-card p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: '#714B67' }}>
                    {ride.driver.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#0f0f0f]">{ride.driver.name}</p>
                    <div className="flex items-center gap-1">
                      <Star size={10} fill="#f97316" className="text-[#f97316]" />
                      <span className="text-xs text-[#6b6b6b]">{ride.driverRating?.toFixed(1) ?? '4.9'}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium text-[#0f0f0f] mt-2">
                  {ride.pickupAddress.split(',')[0]} → {ride.destAddress.split(',')[0]}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6b6b6b]">
                  <span className="flex items-center gap-1"><Clock size={10} />
                    {new Date(ride.departureTime).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                  </span>
                  <span className="flex items-center gap-1"><Users size={10} /> {ride.availableSeats} seats</span>
                  {ride.distanceKm && <span className="flex items-center gap-1"><MapPin size={10} /> {ride.distanceKm}km</span>}
                </div>
                <p className="text-xs text-[#6b6b6b] mt-1">{ride.vehicle.model} · {ride.vehicle.registration}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="font-display font-black text-2xl text-[#f97316]">₹{ride.farePerSeat}</p>
                <p className="text-xs text-[#6b6b6b]">per seat</p>
                {ride.matchScore && (
                  <p className="text-xs font-bold text-[#16a34a] mt-1">{ride.matchScore}% match</p>
                )}
              </div>
            </div>
            <button
              onClick={() => book(ride)}
              disabled={!!bookingId}
              className="m-btn m-btn-primary m-btn-full text-sm py-3"
            >
              {bookingId === ride.id ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Book Ride'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
