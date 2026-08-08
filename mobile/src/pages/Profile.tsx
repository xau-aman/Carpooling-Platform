import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Car, Plus, ChevronRight, Wallet, MapPin, Edit2, Check, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'

interface Vehicle { id: string; model: string; registration: string; seats: number; fuelType: string; color?: string; isActive: boolean }
interface VehicleForm { model: string; registration: string; seats: string; fuelType: string; color: string }

export default function Profile() {
  const { user, logout, login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [vForm, setVForm] = useState<VehicleForm>({ model: '', registration: '', seats: '4', fuelType: 'PETROL', color: '' })
  const [savingV, setSavingV] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [pForm, setPForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [savingP, setSavingP] = useState(false)

  const loadVehicles = () => api.get('/vehicles').then(r => setVehicles(r.data.data))
  useEffect(() => { loadVehicles() }, [])

  const saveProfile = async () => {
    setSavingP(true)
    try {
      const res = await api.patch('/auth/profile', pForm)
      login(res.data.data.accessToken, res.data.data.user)
      toast('Profile updated!', 'success')
      setEditingProfile(false)
    } catch { toast('Failed to update', 'error') }
    finally { setSavingP(false) }
  }

  const addVehicle = async () => {
    if (!vForm.model || !vForm.registration) return toast('Fill model and registration', 'error')
    setSavingV(true)
    try {
      await api.post('/vehicles', { ...vForm, seats: parseInt(vForm.seats) })
      toast('Vehicle added!', 'success')
      setShowVehicleForm(false)
      setVForm({ model: '', registration: '', seats: '4', fuelType: 'PETROL', color: '' })
      loadVehicles()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg || 'Failed to add vehicle', 'error')
    } finally { setSavingV(false) }
  }

  const toggleVehicle = async (v: Vehicle) => {
    try {
      await api.patch(`/vehicles/${v.id}/toggle`, { isActive: !v.isActive })
      loadVehicles()
    } catch { toast('Failed', 'error') }
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      <div className="bg-white px-4 pb-4 shadow-sm shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <h1 className="font-display font-bold text-2xl text-[#0f0f0f]">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 safe-bottom">
        {/* Avatar + info */}
        <div className="bg-white rounded-3xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shrink-0"
              style={{ background: 'linear-gradient(135deg, #714B67, #875A7B)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-xl text-[#0f0f0f] truncate">{user?.name}</p>
              <p className="text-sm text-[#6b6b6b] truncate">{user?.email}</p>
              <span className="inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                style={{ background: '#714B67' }}>
                {user?.role}
              </span>
            </div>
            <button onClick={() => { setEditingProfile(v => !v); setPForm({ name: user?.name || '', phone: user?.phone || '' }) }}
              className="w-9 h-9 rounded-xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
              <Edit2 size={15} className="text-[#714B67]" />
            </button>
          </div>

          {editingProfile && (
            <div className="space-y-3 pt-3 border-t border-[#f5f5f5]">
              <div>
                <label className="text-xs font-bold text-[#6b6b6b] mb-1 block">Full Name</label>
                <input className="m-input" value={pForm.name} onChange={e => setPForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6b6b6b] mb-1 block">Phone</label>
                <input className="m-input" type="tel" value={pForm.phone} onChange={e => setPForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button onClick={saveProfile} disabled={savingP} className="m-btn m-btn-primary flex-1 py-3 text-sm">
                  {savingP ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={15} /> Save</>}
                </button>
                <button onClick={() => setEditingProfile(false)} className="m-btn m-btn-ghost flex-1 py-3 text-sm">
                  <X size={15} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-3xl overflow-hidden">
          {[
            { icon: Wallet, label: 'Wallet', sub: 'Balance & transactions', to: '/wallet', color: '#714B67' },
            { icon: MapPin, label: 'My Trips', sub: 'View all trips', to: '/trips', color: '#f97316' },
          ].map(({ icon: Icon, label, sub, to, color }) => (
            <button key={to} onClick={() => navigate(to)}
              className="w-full flex items-center gap-4 px-5 py-4 border-b border-[#f5f5f5] last:border-0 active:bg-[#f9f9f9]">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm text-[#0f0f0f]">{label}</p>
                <p className="text-xs text-[#6b6b6b]">{sub}</p>
              </div>
              <ChevronRight size={16} className="text-[#9ca3af]" />
            </button>
          ))}
        </div>

        {/* Vehicles */}
        <div className="bg-white rounded-3xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-base text-[#0f0f0f]">My Vehicles</p>
            <button onClick={() => setShowVehicleForm(v => !v)}
              className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-full active:scale-95"
              style={{ background: '#714B67' }}>
              <Plus size={13} /> Add
            </button>
          </div>

          {showVehicleForm && (
            <div className="mb-4 p-4 bg-[#f9f5ff] rounded-2xl space-y-3">
              <input className="m-input text-sm" placeholder="Model (e.g. Maruti Swift)" value={vForm.model}
                onChange={e => setVForm(f => ({ ...f, model: e.target.value }))} />
              <input className="m-input text-sm" placeholder="Registration (WB01AB1234)" value={vForm.registration}
                onChange={e => setVForm(f => ({ ...f, registration: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <select className="m-input text-sm" value={vForm.seats} onChange={e => setVForm(f => ({ ...f, seats: e.target.value }))}>
                  {[2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} seats</option>)}
                </select>
                <select className="m-input text-sm" value={vForm.fuelType} onChange={e => setVForm(f => ({ ...f, fuelType: e.target.value }))}>
                  {['PETROL','DIESEL','CNG','ELECTRIC','HYBRID'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <input className="m-input text-sm" placeholder="Color (White, Black...)" value={vForm.color}
                onChange={e => setVForm(f => ({ ...f, color: e.target.value }))} />
              <div className="flex gap-2">
                <button onClick={addVehicle} disabled={savingV} className="m-btn m-btn-primary flex-1 py-3 text-sm">
                  {savingV ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Add Vehicle'}
                </button>
                <button onClick={() => setShowVehicleForm(false)} className="m-btn m-btn-ghost py-3 text-sm px-4">Cancel</button>
              </div>
            </div>
          )}

          {vehicles.length === 0 ? (
            <div className="text-center py-6">
              <Car size={32} className="mx-auto mb-2 text-[#e5e5e5]" />
              <p className="text-sm text-[#6b6b6b]">No vehicles yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vehicles.map(v => (
                <div key={v.id} className={`flex items-center gap-3 p-3 rounded-2xl ${v.isActive ? 'bg-[#f9f5ff]' : 'bg-[#f5f5f5] opacity-60'}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#714B6720' }}>
                    <Car size={18} style={{ color: '#714B67' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#0f0f0f]">{v.model}</p>
                    <p className="text-xs text-[#6b6b6b] font-mono">{v.registration} · {v.seats} seats · {v.fuelType}</p>
                  </div>
                  <button onClick={() => toggleVehicle(v)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full ${v.isActive ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-[#f0fdf4] text-[#16a34a]'}`}>
                    {v.isActive ? 'Off' : 'On'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/login', { replace: true }) }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl font-bold text-[#dc2626] bg-white active:scale-[0.98] transition-transform"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  )
}
