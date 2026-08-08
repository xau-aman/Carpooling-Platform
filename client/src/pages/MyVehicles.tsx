import { useEffect, useState, FormEvent } from 'react'
import { Plus, Edit2, Power, X, Zap, Fuel, Wind, Leaf } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../context/ToastContext'
import Button from '../components/Button'
import { PageHeader, LoadingState, EmptyState, Badge, Input, Select } from '../components/ui'
import { Vehicle, FuelType } from '../types'

const fuelOptions: { value: FuelType; label: string }[] = [
  { value: 'PETROL', label: 'Petrol' }, { value: 'DIESEL', label: 'Diesel' },
  { value: 'CNG', label: 'CNG' }, { value: 'ELECTRIC', label: 'Electric' }, { value: 'HYBRID', label: 'Hybrid' },
]

interface VehicleForm { model: string; registration: string; seats: string; fuelType: FuelType; color: string }
const emptyForm: VehicleForm = { model: '', registration: '', seats: '4', fuelType: 'PETROL', color: '' }

// Vehicle type detection from model name
function getVehicleType(model: string): 'bike' | 'auto' | 'hatchback' | 'sedan' | 'suv' | 'ev' {
  const m = model.toLowerCase()
  if (m.includes('activa') || m.includes('splendor') || m.includes('pulsar') || m.includes('bike') || m.includes('scooty') || m.includes('bullet') || m.includes('duke')) return 'bike'
  if (m.includes('auto') || m.includes('rickshaw')) return 'auto'
  if (m.includes('nexon') || m.includes('creta') || m.includes('brezza') || m.includes('xuv') || m.includes('fortuner') || m.includes('innova') || m.includes('ertiga') || m.includes('scorpio') || m.includes('safari')) return 'suv'
  if (m.includes('city') || m.includes('verna') || m.includes('ciaz') || m.includes('dzire') || m.includes('amaze') || m.includes('aspire') || m.includes('tigor') || m.includes('rapid')) return 'sedan'
  if (m.includes('nexon ev') || m.includes('tiago ev') || m.includes('zs ev') || m.includes('electric') || m.includes('ev')) return 'ev'
  return 'hatchback'
}

// SVG vehicle illustrations
function VehicleIllustration({ model, fuelType, color }: { model: string; fuelType: FuelType; color?: string }) {
  const type = getVehicleType(model)
  const bodyColor = color ? colorToHex(color) : '#714B67'
  const isEV = fuelType === 'ELECTRIC' || type === 'ev'

  if (type === 'bike') return (
    <svg viewBox="0 0 120 60" className="w-full h-full" fill="none">
      <circle cx="30" cy="42" r="14" stroke="#0f0f0f" strokeWidth="3" fill="#e5e7eb"/>
      <circle cx="90" cy="42" r="14" stroke="#0f0f0f" strokeWidth="3" fill="#e5e7eb"/>
      <circle cx="30" cy="42" r="5" fill="#0f0f0f"/>
      <circle cx="90" cy="42" r="5" fill="#0f0f0f"/>
      <path d="M30 42 L55 20 L75 20 L90 42" stroke="#0f0f0f" strokeWidth="3" fill="none"/>
      <path d="M55 20 L60 10 L80 10 L85 20" fill={bodyColor} stroke="#0f0f0f" strokeWidth="2"/>
      <path d="M75 20 L90 28" stroke="#0f0f0f" strokeWidth="2.5"/>
      <rect x="58" y="8" width="10" height="4" rx="1" fill="#93c5fd" stroke="#0f0f0f" strokeWidth="1.5"/>
      {isEV && <text x="52" y="18" fontSize="8" fill="#16a34a" fontWeight="bold">EV</text>}
    </svg>
  )

  if (type === 'auto') return (
    <svg viewBox="0 0 120 60" className="w-full h-full" fill="none">
      <circle cx="35" cy="46" r="11" stroke="#0f0f0f" strokeWidth="3" fill="#e5e7eb"/>
      <circle cx="85" cy="46" r="11" stroke="#0f0f0f" strokeWidth="3" fill="#e5e7eb"/>
      <circle cx="35" cy="46" r="4" fill="#0f0f0f"/>
      <circle cx="85" cy="46" r="4" fill="#0f0f0f"/>
      <path d="M20 35 L25 15 L95 15 L100 35 L100 46 L20 46 Z" fill={bodyColor} stroke="#0f0f0f" strokeWidth="2.5"/>
      <path d="M30 15 L35 28 L85 28 L90 15" fill="#93c5fd" stroke="#0f0f0f" strokeWidth="1.5"/>
      <line x1="60" y1="15" x2="60" y2="28" stroke="#0f0f0f" strokeWidth="1.5"/>
      <rect x="20" y="35" width="80" height="11" fill={bodyColor} stroke="#0f0f0f" strokeWidth="1"/>
    </svg>
  )

  if (type === 'suv') return (
    <svg viewBox="0 0 140 65" className="w-full h-full" fill="none">
      <circle cx="32" cy="50" r="13" stroke="#0f0f0f" strokeWidth="3" fill="#e5e7eb"/>
      <circle cx="108" cy="50" r="13" stroke="#0f0f0f" strokeWidth="3" fill="#e5e7eb"/>
      <circle cx="32" cy="50" r="5" fill="#0f0f0f"/>
      <circle cx="108" cy="50" r="5" fill="#0f0f0f"/>
      <rect x="15" y="22" width="110" height="28" rx="4" fill={bodyColor} stroke="#0f0f0f" strokeWidth="2.5"/>
      <path d="M22 22 L30 8 L110 8 L118 22" fill={bodyColor} stroke="#0f0f0f" strokeWidth="2.5"/>
      <rect x="30" y="10" width="35" height="14" rx="2" fill="#bfdbfe" stroke="#0f0f0f" strokeWidth="1.5"/>
      <rect x="75" y="10" width="35" height="14" rx="2" fill="#bfdbfe" stroke="#0f0f0f" strokeWidth="1.5"/>
      <rect x="15" y="38" width="18" height="8" rx="2" fill="#fef08a" stroke="#0f0f0f" strokeWidth="1.5"/>
      <rect x="107" y="38" width="18" height="8" rx="2" fill="#fca5a5" stroke="#0f0f0f" strokeWidth="1.5"/>
      {isEV && <rect x="58" y="30" width="24" height="10" rx="2" fill="#16a34a" stroke="#0f0f0f" strokeWidth="1.5"/>}
      {isEV && <text x="62" y="39" fontSize="7" fill="white" fontWeight="bold">EV</text>}
    </svg>
  )

  if (type === 'sedan') return (
    <svg viewBox="0 0 140 65" className="w-full h-full" fill="none">
      <circle cx="32" cy="50" r="13" stroke="#0f0f0f" strokeWidth="3" fill="#e5e7eb"/>
      <circle cx="108" cy="50" r="13" stroke="#0f0f0f" strokeWidth="3" fill="#e5e7eb"/>
      <circle cx="32" cy="50" r="5" fill="#0f0f0f"/>
      <circle cx="108" cy="50" r="5" fill="#0f0f0f"/>
      <path d="M18 38 L28 18 L112 18 L122 38 L122 50 L18 50 Z" fill={bodyColor} stroke="#0f0f0f" strokeWidth="2.5"/>
      <path d="M35 18 L40 30 L100 30 L105 18" fill="#bfdbfe" stroke="#0f0f0f" strokeWidth="1.5"/>
      <line x1="70" y1="18" x2="70" y2="30" stroke="#0f0f0f" strokeWidth="1.5"/>
      <rect x="18" y="38" width="18" height="8" rx="2" fill="#fef08a" stroke="#0f0f0f" strokeWidth="1.5"/>
      <rect x="104" y="38" width="18" height="8" rx="2" fill="#fca5a5" stroke="#0f0f0f" strokeWidth="1.5"/>
    </svg>
  )

  // hatchback (default)
  return (
    <svg viewBox="0 0 130 65" className="w-full h-full" fill="none">
      <circle cx="30" cy="50" r="13" stroke="#0f0f0f" strokeWidth="3" fill="#e5e7eb"/>
      <circle cx="100" cy="50" r="13" stroke="#0f0f0f" strokeWidth="3" fill="#e5e7eb"/>
      <circle cx="30" cy="50" r="5" fill="#0f0f0f"/>
      <circle cx="100" cy="50" r="5" fill="#0f0f0f"/>
      <path d="M15 38 L30 16 L100 16 L115 38 L115 50 L15 50 Z" fill={bodyColor} stroke="#0f0f0f" strokeWidth="2.5"/>
      <path d="M32 16 L36 28 L94 28 L98 16" fill="#bfdbfe" stroke="#0f0f0f" strokeWidth="1.5"/>
      <line x1="65" y1="16" x2="65" y2="28" stroke="#0f0f0f" strokeWidth="1.5"/>
      <rect x="15" y="38" width="16" height="8" rx="2" fill="#fef08a" stroke="#0f0f0f" strokeWidth="1.5"/>
      <rect x="99" y="38" width="16" height="8" rx="2" fill="#fca5a5" stroke="#0f0f0f" strokeWidth="1.5"/>
      {isEV && <rect x="55" y="30" width="20" height="9" rx="2" fill="#16a34a" stroke="#0f0f0f" strokeWidth="1.5"/>}
      {isEV && <text x="59" y="38" fontSize="7" fill="white" fontWeight="bold">EV</text>}
    </svg>
  )
}

function colorToHex(color: string): string {
  const map: Record<string, string> = {
    white: '#f8fafc', black: '#1e293b', silver: '#94a3b8', grey: '#94a3b8', gray: '#94a3b8',
    red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', orange: '#f97316',
    brown: '#92400e', maroon: '#7f1d1d', gold: '#d97706', purple: '#7c3aed', pink: '#ec4899',
    beige: '#d4b896', navy: '#1e3a5f', teal: '#0d9488', cyan: '#06b6d4',
  }
  return map[color.toLowerCase()] || '#714B67'
}

function FuelIcon({ type }: { type: FuelType }) {
  if (type === 'ELECTRIC') return <Zap size={12} className="text-green-600" />
  if (type === 'CNG') return <Wind size={12} className="text-blue-500" />
  if (type === 'HYBRID') return <Leaf size={12} className="text-emerald-500" />
  return <Fuel size={12} className="text-orange-500" />
}

const fuelBadgeColor: Record<FuelType, string> = {
  PETROL: '#f97316', DIESEL: '#6b7280', CNG: '#3b82f6', ELECTRIC: '#16a34a', HYBRID: '#10b981',
}

export default function MyVehicles() {
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)
  const [form, setForm] = useState<VehicleForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => api.get('/vehicles').then(r => setVehicles(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const openAdd = () => { setEditVehicle(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (v: Vehicle) => {
    setEditVehicle(v)
    setForm({ model: v.model, registration: v.registration, seats: String(v.seats), fuelType: v.fuelType, color: v.color || '' })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditVehicle(null) }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editVehicle) {
        await api.put(`/vehicles/${editVehicle.id}`, { ...form, seats: parseInt(form.seats) })
        toast('Vehicle updated!', 'success')
      } else {
        await api.post('/vehicles', { ...form, seats: parseInt(form.seats) })
        toast('Vehicle added!', 'success')
      }
      await load()
      closeForm()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg || 'Failed to save vehicle', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (v: Vehicle) => {
    try {
      await api.patch(`/vehicles/${v.id}/toggle`, { isActive: !v.isActive })
      toast(v.isActive ? 'Vehicle deactivated' : 'Vehicle activated', 'success')
      await load()
    } catch { toast('Failed to update vehicle', 'error') }
  }

  if (loading) return <LoadingState />

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="My Vehicles"
        action={<Button variant="dark" size="sm" icon={<Plus size={14} />} onClick={openAdd}>Add Vehicle</Button>}
      />

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md neo-card-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-lg uppercase">{editVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
              <button onClick={closeForm} className="p-1 hover:bg-[#f0ede6]"><X size={18} /></button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <Input label="Model" placeholder="Maruti Swift Dzire" value={form.model} onChange={set('model')} required />
              <Input
                label="Registration Number"
                placeholder="WB01AB1234"
                value={form.registration}
                onChange={set('registration')}
                required
                disabled={!!editVehicle}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Seats" value={form.seats} onChange={set('seats')} options={[2,3,4,5,6,7].map(n => ({ value: String(n), label: `${n} seats` }))} />
                <Select label="Fuel Type" value={form.fuelType} onChange={set('fuelType')} options={fuelOptions} />
              </div>
              <Input label="Color" placeholder="White" value={form.color} onChange={set('color')} />
              <div className="flex gap-3 mt-2">
                <Button type="submit" variant="dark" loading={saving} fullWidth>
                  {editVehicle ? 'Save Changes' : 'Add Vehicle'}
                </Button>
                <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {vehicles.length === 0 ? (
        <EmptyState message="No vehicles yet. Add your first vehicle to offer rides." />
      ) : (
        <div className="flex flex-col gap-5">
          {vehicles.map(v => (
            <div key={v.id} className={`neo-card overflow-hidden ${!v.isActive ? 'opacity-60' : ''}`}>
              {/* Vehicle illustration banner */}
              <div
                className="h-36 flex items-center justify-center px-6 relative"
                style={{ background: `linear-gradient(135deg, ${colorToHex(v.color || 'purple')}22, ${colorToHex(v.color || 'purple')}44)` }}
              >
                <div className="w-full max-w-[220px]">
                  <VehicleIllustration model={v.model} fuelType={v.fuelType} color={v.color} />
                </div>
                {/* Fuel badge top-right */}
                <div
                  className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-white text-[10px] font-bold border border-white/30"
                  style={{ background: fuelBadgeColor[v.fuelType] }}
                >
                  <FuelIcon type={v.fuelType} />
                  {v.fuelType}
                </div>
                {/* Status badge top-left */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold border ${v.isActive ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                  {v.isActive ? '● Active' : '○ Inactive'}
                </div>
              </div>

              {/* Vehicle details */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-xl">{v.model}</h3>
                    <p className="font-mono text-sm text-[#3d3d3d] font-semibold tracking-wider mt-0.5">{v.registration}</p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <div className="flex items-center gap-1.5 text-sm text-[#6b6b6b]">
                        <span className="text-base">💺</span>
                        <span className="font-semibold">{v.seats} seats</span>
                      </div>
                      {v.color && (
                        <div className="flex items-center gap-1.5 text-sm text-[#6b6b6b]">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-[#0f0f0f]"
                            style={{ background: colorToHex(v.color) }}
                          />
                          <span className="font-semibold capitalize">{v.color}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-[#6b6b6b]">
                        <span className="text-base">{v.fuelType === 'ELECTRIC' ? '⚡' : v.fuelType === 'CNG' ? '💨' : '⛽'}</span>
                        <span className="font-semibold capitalize">{v.fuelType.toLowerCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => openEdit(v)}
                      className="neo-btn neo-btn-outline p-2.5"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => toggle(v)}
                      className={`neo-btn p-2.5 ${v.isActive ? 'bg-[#fef2f2] text-[#dc2626] border-[#dc2626]' : 'bg-[#f0fdf4] text-[#16a34a] border-[#16a34a]'}`}
                      title={v.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Power size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
