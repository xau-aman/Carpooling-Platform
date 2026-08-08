import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Car, IndianRupee, ChevronRight, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../context/ToastContext'
import Button from '../components/Button'
import { Select } from '../components/ui'
import LocationSearch, { LocationResult } from '../components/LocationSearch'
import RouteMap from '../components/RouteMap'
import { Vehicle } from '../types'

interface RouteData { distanceKm: number; durationMin: number; polyline: string }

export default function OfferRide() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [pickup, setPickup] = useState<LocationResult | null>(null)
  const [destination, setDestination] = useState<LocationResult | null>(null)
  const [routeData, setRouteData] = useState<RouteData | null>(null)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00', vehicleId: '', availableSeats: '3', farePerSeat: '120',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/vehicles').then(r => {
      const active = r.data.data.filter((v: Vehicle) => v.isActive)
      setVehicles(active)
      if (active.length) setForm(f => ({ ...f, vehicleId: active[0].id }))
    })
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!pickup) return toast('Enter pickup location', 'error')
    if (!destination) return toast('Enter destination', 'error')
    if (!form.vehicleId) return toast('Select a vehicle', 'error')
    setLoading(true)
    try {
      const dt = new Date(`${form.date}T${form.time}`)
      await api.post('/rides', {
        vehicleId: form.vehicleId,
        pickupAddress: pickup.address, pickupLat: pickup.lat, pickupLng: pickup.lng,
        destAddress: destination.address, destLat: destination.lat, destLng: destination.lng,
        departureTime: dt.toISOString(),
        availableSeats: form.availableSeats,
        farePerSeat: form.farePerSeat,
        distanceKm: routeData?.distanceKm,
        durationMin: routeData?.durationMin,
        routePolyline: routeData?.polyline,
      })
      toast('Ride published! 🚗 Colleagues will be notified.', 'success')
      navigate('/trips')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg || 'Failed to publish ride', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showMap = pickup && destination

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-black text-2xl text-[#212529]">Offer a Ride</h1>
        <p className="text-[#868E96] mt-1">Share your commute, split costs</p>
      </div>

      {vehicles.length === 0 && (
        <div className="mb-5 p-4 rounded-2xl flex items-center justify-between" style={{ background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.3)' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} style={{ color: '#F0A500' }} />
            <span className="text-sm font-semibold" style={{ color: '#B45309' }}>No active vehicles found.</span>
          </div>
          <button onClick={() => navigate('/vehicles')} className="text-sm font-bold underline" style={{ color: '#B45309' }}>Add Vehicle →</button>
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        {/* Route + Map */}
        <div className="card-lg p-5 space-y-4">
          <h3 className="font-display font-bold text-sm text-[#495057] uppercase tracking-wider">Route</h3>
          <LocationSearch
            label="Pickup Location"
            placeholder="Where are you starting from?"
            value={pickup}
            onChange={setPickup}
            accentColor="green"
          />
          <LocationSearch
            label="Destination"
            placeholder="Where are you going?"
            value={destination}
            onChange={setDestination}
            accentColor="red"
          />

          {/* Full-height map */}
          {showMap && (
            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ height: '380px' }}>
              <RouteMap
                pickup={pickup}
                destination={destination}
                height="h-full"
                onRouteCalculated={(distKm, durMin, polyline) => setRouteData({ distanceKm: distKm, durationMin: durMin, polyline })}
              />
            </div>
          )}

          {routeData && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(113,75,103,0.06)' }}>
                <p className="text-xs text-[#868E96]">Distance</p>
                <p className="font-display font-bold text-lg" style={{ color: '#714B67' }}>{routeData.distanceKm} km</p>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(0,160,157,0.06)' }}>
                <p className="text-xs text-[#868E96]">Est. Time</p>
                <p className="font-display font-bold text-lg" style={{ color: '#00A09D' }}>{routeData.durationMin} min</p>
              </div>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="card-lg p-5 space-y-4">
          <h3 className="font-display font-bold text-sm text-[#495057] uppercase tracking-wider">Schedule</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#495057] mb-1.5">Date</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#868E96]" />
                <input type="date" value={form.date} onChange={set('date')} className="input pl-9" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#495057] mb-1.5">Departure Time</label>
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#868E96]" />
                <input type="time" value={form.time} onChange={set('time')} className="input pl-9" />
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle + Seats + Fare */}
        <div className="card-lg p-5 space-y-4">
          <h3 className="font-display font-bold text-sm text-[#495057] uppercase tracking-wider">Ride Details</h3>
          <Select
            label="Vehicle"
            value={form.vehicleId}
            onChange={set('vehicleId')}
            options={vehicles.length
              ? vehicles.map(v => ({ value: v.id, label: `${v.model} · ${v.registration}` }))
              : [{ value: '', label: 'No vehicles — add one first' }]
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Available Seats"
              value={form.availableSeats}
              onChange={set('availableSeats')}
              options={[1, 2, 3, 4].map(n => ({ value: String(n), label: `${n} seat${n > 1 ? 's' : ''}` }))}
            />
            <div>
              <label className="block text-sm font-semibold text-[#495057] mb-1.5">Fare / Seat (₹)</label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#868E96]" />
                <input type="number" min="0" value={form.farePerSeat} onChange={set('farePerSeat')} className="input pl-9" />
              </div>
            </div>
          </div>

          {/* Fare summary */}
          {form.farePerSeat && form.availableSeats && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(113,75,103,0.06)' }}>
              <div className="flex justify-between text-sm">
                <span className="text-[#868E96]">Fare per seat</span>
                <span className="font-bold text-[#212529]">₹{form.farePerSeat}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-[#868E96]">Max earnings ({form.availableSeats} seats)</span>
                <span className="font-bold" style={{ color: '#714B67' }}>₹{parseInt(form.farePerSeat) * parseInt(form.availableSeats)}</span>
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit" variant="primary" size="lg" fullWidth
          loading={loading}
          disabled={vehicles.length === 0}
          icon={<ChevronRight size={16} />}
        >
          Publish Ride
        </Button>
      </form>
    </div>
  )
}
