import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Car, Wallet, MapPin, LogOut, ChevronRight,
  Edit2, Check, X, Plus, Trash2, Navigation, History,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'
import { SavedPlace } from '../types'

interface ProfileForm { name: string; phone: string }

export default function Settings() {
  const { user, login, token } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [editingProfile, setEditingProfile] = useState(false)
  const [profile, setProfile] = useState<ProfileForm>({ name: user?.name || '', phone: user?.phone || '' })
  const [savingProfile, setSavingProfile] = useState(false)

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState(true)
  const [addingPlace, setAddingPlace] = useState(false)
  const [newPlace, setNewPlace] = useState({ label: '', address: '', lat: '', lng: '' })
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    api.get('/saved-places')
      .then(r => setSavedPlaces(r.data.data))
      .finally(() => setLoadingPlaces(false))
  }, [])

  const saveProfile = async () => {
    if (!profile.name.trim()) return toast('Name cannot be empty', 'error')
    setSavingProfile(true)
    try {
      const res = await api.patch('/auth/profile', profile)
      // Re-fetch me to update context
      const meRes = await api.get('/auth/me')
      login(token!, meRes.data.data)
      toast('Profile updated!', 'success')
      setEditingProfile(false)
    } catch {
      toast('Failed to update profile', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        const addr = data.display_name?.split(',').slice(0, 3).join(',').trim() || 'Current Location'
        setNewPlace(p => ({ ...p, address: addr, lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) }))
      } catch {
        setNewPlace(p => ({ ...p, lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) }))
      }
      setLocating(false)
    }, () => setLocating(false))
  }

  const addPlace = async () => {
    if (!newPlace.label || !newPlace.address || !newPlace.lat || !newPlace.lng)
      return toast('Fill all fields', 'error')
    try {
      const res = await api.post('/saved-places', newPlace)
      setSavedPlaces(p => [...p, res.data.data])
      setNewPlace({ label: '', address: '', lat: '', lng: '' })
      setAddingPlace(false)
      toast('Place saved!', 'success')
    } catch { toast('Failed to save place', 'error') }
  }

  const deletePlace = async (id: string) => {
    try {
      await api.delete(`/saved-places/${id}`)
      setSavedPlaces(p => p.filter(x => x.id !== id))
      toast('Place removed', 'success')
    } catch { toast('Failed to delete', 'error') }
  }

  const quickLinks = [
    { icon: History, label: 'My Trips', to: '/trips', color: '#714B67', bg: 'rgba(113,75,103,0.1)' },
    { icon: Car, label: 'My Vehicle', to: '/vehicles', color: '#F06050', bg: 'rgba(240,96,80,0.1)' },
    { icon: Wallet, label: 'Wallet', to: '/wallet', color: '#00A09D', bg: 'rgba(0,160,157,0.1)' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display font-black text-2xl text-[#212529]">Settings</h1>

      {/* Profile Card */}
      <div className="card-lg p-6">
        <div className="flex items-start justify-between mb-5">
          <h2 className="font-display font-bold text-base text-[#212529]">My Profile</h2>
          {!editingProfile ? (
            <button
              onClick={() => { setEditingProfile(true); setProfile({ name: user?.name || '', phone: user?.phone || '' }) }}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#714B67', background: 'rgba(113,75,103,0.08)' }}
            >
              <Edit2 size={13} /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg text-white transition-colors"
                style={{ background: '#00A09D' }}
              >
                <Check size={13} /> {savingProfile ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditingProfile(false)}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg text-[#868E96] bg-[#F5F5F5]"
              >
                <X size={13} /> Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-5 mb-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-3xl shrink-0"
            style={{ background: 'linear-gradient(135deg, #714B67, #875A7B)' }}
          >
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-display font-bold text-xl text-[#212529]">{user?.name}</p>
            <p className="text-[#868E96] text-sm">{user?.email}</p>
            <span
              className="inline-block mt-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
              style={{ background: user?.role === 'ADMIN' ? '#714B67' : user?.role === 'DRIVER' ? '#F06050' : '#00A09D' }}
            >
              {user?.role}
            </span>
          </div>
        </div>

        {editingProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#495057] mb-1.5">Full Name</label>
              <input
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                className="input"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#495057] mb-1.5">Phone</label>
              <input
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                className="input"
                placeholder="9876543210"
                type="tel"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-[#F5F5F5]">
              <p className="text-xs text-[#868E96] font-medium mb-0.5">Email</p>
              <p className="text-sm font-semibold text-[#212529] truncate">{user?.email}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F5F5]">
              <p className="text-xs text-[#868E96] font-medium mb-0.5">Phone</p>
              <p className="text-sm font-semibold text-[#212529]">{user?.phone || '—'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickLinks.map(({ icon: Icon, label, to, color, bg }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="card p-4 flex flex-col items-center gap-2.5 hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg }}>
              <Icon size={20} style={{ color }} />
            </div>
            <span className="text-sm font-semibold text-[#212529]">{label}</span>
            <ChevronRight size={14} className="text-[#868E96]" />
          </button>
        ))}
      </div>

      {/* Saved Places */}
      <div className="card-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-base text-[#212529]">Saved Places</h2>
          <button
            onClick={() => setAddingPlace(v => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg text-white transition-colors"
            style={{ background: '#714B67' }}
          >
            <Plus size={13} /> Add Place
          </button>
        </div>

        {/* Add form */}
        {addingPlace && (
          <div className="mb-5 p-4 rounded-xl border border-[#DEE2E6] bg-[#F5F5F5] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#495057] mb-1">Label</label>
                <input
                  value={newPlace.label}
                  onChange={e => setNewPlace(p => ({ ...p, label: e.target.value }))}
                  className="input text-sm"
                  placeholder="Home, Office..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057] mb-1">Address</label>
                <input
                  value={newPlace.address}
                  onChange={e => setNewPlace(p => ({ ...p, address: e.target.value }))}
                  className="input text-sm"
                  placeholder="Full address"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057] mb-1">Latitude</label>
                <input
                  value={newPlace.lat}
                  onChange={e => setNewPlace(p => ({ ...p, lat: e.target.value }))}
                  className="input text-sm"
                  placeholder="23.0225"
                  type="number"
                  step="any"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#495057] mb-1">Longitude</label>
                <input
                  value={newPlace.lng}
                  onChange={e => setNewPlace(p => ({ ...p, lng: e.target.value }))}
                  className="input text-sm"
                  placeholder="72.5714"
                  type="number"
                  step="any"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={detectLocation}
                disabled={locating}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border border-[#DEE2E6] bg-white text-[#495057] hover:bg-[#F5F5F5]"
              >
                <Navigation size={13} className={locating ? 'animate-pulse' : ''} />
                {locating ? 'Detecting...' : 'Use GPS'}
              </button>
              <button onClick={addPlace} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: '#00A09D' }}>
                <Check size={13} /> Save
              </button>
              <button onClick={() => setAddingPlace(false)} className="text-sm font-semibold px-3 py-2 rounded-lg text-[#868E96] bg-white border border-[#DEE2E6]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {loadingPlaces ? (
          <div className="text-center py-6 text-[#868E96] text-sm">Loading...</div>
        ) : savedPlaces.length === 0 ? (
          <div className="text-center py-8">
            <MapPin size={32} className="mx-auto mb-2 text-[#DEE2E6]" />
            <p className="text-sm text-[#868E96]">No saved places yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {savedPlaces.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F5F5F5] hover:bg-[#EBEBEB] transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(113,75,103,0.1)' }}>
                  <MapPin size={16} style={{ color: '#714B67' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#212529]">{p.label}</p>
                  <p className="text-xs text-[#868E96] truncate">{p.address}</p>
                </div>
                <button
                  onClick={() => deletePlace(p.id)}
                  className="p-2 rounded-lg text-[#868E96] hover:text-[#D9534F] hover:bg-[#FFF5F5] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <LogoutButton />
    </div>
  )
}

function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return (
    <button
      onClick={() => { logout(); navigate('/login') }}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-[#D9534F] border-2 border-[#D9534F] hover:bg-[#FFF5F5] transition-colors"
    >
      <LogOut size={16} />
      Sign Out
    </button>
  )
}
