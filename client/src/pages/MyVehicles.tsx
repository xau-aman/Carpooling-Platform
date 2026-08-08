import { useEffect, useState, FormEvent } from 'react'
import { Plus, Edit2, Power, X } from 'lucide-react'
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
                placeholder="GJ01AB1234"
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
        <div className="flex flex-col gap-4">
          {vehicles.map(v => (
            <div key={v.id} className="neo-card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-lg">{v.model}</h3>
                    <Badge variant={v.isActive ? 'success' : 'default'}>{v.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="font-mono text-sm text-[#3d3d3d] font-semibold">{v.registration}</p>
                  <div className="flex gap-3 mt-1 text-sm text-[#6b6b6b]">
                    <span>💺 {v.seats} seats</span>
                    <span>⛽ {v.fuelType}</span>
                    {v.color && <span>🎨 {v.color}</span>}
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
          ))}
        </div>
      )}
    </div>
  )
}
