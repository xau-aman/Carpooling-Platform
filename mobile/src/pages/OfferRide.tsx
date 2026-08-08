import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Car, ChevronDown } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../context/ToastContext'

interface Vehicle { id: string; model: string; registration: string; seats: number; isActive: boolean }
interface LocationResult { display_name: string; lat: string; lon: string }

async function searchLocation(q: string): Promise<LocationResult[]> {
  if (q.length < 3) return []
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
    { headers: { 'Accept-Language': 'en' } }
  )
  return res.json()
}

function LocationInput({ label, placeholder, color, onSelect }: {
  label: string; placeholder: string; color: string
  onSelect: (r: LocationResult) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationResult[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.length >= 3 && query !== selected) {
        const r = await searchLocation(query)
        setResults(r); setOpen(true)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [query, selected])

  return (
    <div className="relative">
      <label className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="flex items-center gap-3 bg-[#f5f5f5] rounded-2xl px-4 py-3.5">
        <MapPin size={16} style={{ color }} />
        <input
          className="flex-1 bg-transparent text-sm font-medium text-[#0f0f0f] outline-none placeholder:text-[#9ca3af]"
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected('') }}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-[#e5e5e5] z-50 overflow-hidden">
          {results.map((r, i) => (
            <button key={i} className="w-full px-4 py-3 text-left text-sm border-b border-[#f5f5f5] last:border-0 active:bg-[#f5f5f5]"
              onClick={() => {
                const label = r.display_name.split(',').slice(0, 2).join(',')
                setQuery(label); setSelected(label)
                onSelect(r); setOpen(false)
              }}>
              <p className="font-medium text-[#0f0f0f] truncate">{r.display_name.split(',')[0]}</p>
              <p className="text-xs text-[#6b6b6b] truncate mt-0.5">{r.display_name.split(',').slice(1, 3).join(',')}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function OfferRide() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [pickup, setPickup] = useState<LocationResult | null>(null)
  const [dest, setDest] = useState<LocationResult | null>(null)
  const [vehicleId, setVehicleId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('09:00')
  const [seats, setSeats] = useState('3')
  const [fare, setFare] = useState('120')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/vehicles').then(r => {
      const active = r.data.data.filter((v: Vehicle) => v.isActive)
      setVehicles(active)
      if (active.length) setVehicleId(active[0].id)
    })
  }, [])

  const submit = async () => {
    if (!pickup || !dest) return toast('Enter pickup and destination', 'error')
    if (!vehicleId) return toast('Select a vehicle', 'error')
    setLoading(true)
    try {
      const departureTime = new Date(`${date}T${time}`).toISOString()
      await api.post('/rides', {
        vehicleId,
        pickupAddress: pickup.display_name.split(',').slice(0, 2).join(','),
        pickupLat: parseFloat(pickup.lat),
        pickupLng: parseFloat(pickup.lon),
        destAddress: dest.display_name.split(',').slice(0, 2).join(','),
        destLat: parseFloat(dest.lat),
        destLng: parseFloat(dest.lon),
        departureTime,
        availableSeats: parseInt(seats),
        farePerSeat: parseFloat(fare),
      })
      toast('Ride posted! 🎉', 'success')
      setTimeout(() => navigate('/trips'), 800)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg || 'Failed to post ride', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      <div className="bg-white px-4 py-4 shadow-sm shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-xl">Offer a Ride</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 safe-bottom">
        {/* Route */}
        <div className="bg-white rounded-3xl p-4 space-y-3">
          <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider">Route</p>
          <LocationInput label="From" placeholder="Howrah Station, Kolkata" color="#16a34a" onSelect={setPickup} />
          <LocationInput label="To" placeholder="Sector V, Salt Lake, Kolkata" color="#dc2626" onSelect={setDest} />
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-3xl p-4">
          <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-3">Schedule</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#6b6b6b] mb-1.5 block">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 text-sm font-medium outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#6b6b6b] mb-1.5 block">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 text-sm font-medium outline-none" />
            </div>
          </div>
        </div>

        {/* Vehicle */}
        <div className="bg-white rounded-3xl p-4">
          <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-3">Vehicle</p>
          {vehicles.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-[#6b6b6b] mb-3">No vehicles added yet</p>
              <button onClick={() => navigate('/profile')} className="m-btn m-btn-outline text-sm py-2.5 px-5">
                <Car size={16} /> Add Vehicle
              </button>
            </div>
          ) : (
            <div className="relative">
              <select value={vehicleId} onChange={e => setVehicleId(e.target.value)}
                className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3.5 text-sm font-medium outline-none appearance-none pr-10">
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.model} · {v.registration}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b6b6b] pointer-events-none" />
            </div>
          )}
        </div>

        {/* Seats & Fare */}
        <div className="bg-white rounded-3xl p-4">
          <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-3">Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#6b6b6b] mb-1.5 block">Available Seats</label>
              <select value={seats} onChange={e => setSeats(e.target.value)}
                className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 text-sm font-medium outline-none">
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} seats</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#6b6b6b] mb-1.5 block">Fare per Seat (₹)</label>
              <input type="number" value={fare} onChange={e => setFare(e.target.value)}
                className="w-full bg-[#f5f5f5] rounded-2xl px-4 py-3 text-sm font-medium outline-none" />
            </div>
          </div>
        </div>

        <button onClick={submit} disabled={loading} className="m-btn m-btn-primary m-btn-full text-base">
          {loading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : 'Post Ride →'}
        </button>
      </div>
    </div>
  )
}
