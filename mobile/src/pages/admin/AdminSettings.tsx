import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import api from '../../lib/api'
import { useToast } from '../../context/ToastContext'

interface Settings {
  org: { name: string; address?: string; industry?: string; adminEmail: string }
  settings: { fuelCostPerLiter: number; costPerKm: number; travelCostPolicy?: string; defaultCarpoolPolicy?: string } | null
}

export default function AdminSettings() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: '', address: '', industry: '',
    fuelCostPerLiter: '105', costPerKm: '6',
    travelCostPolicy: '', defaultCarpoolPolicy: '',
  })
  const [adminEmail, setAdminEmail] = useState('')

  useEffect(() => {
    api.get('/admin/settings').then(r => {
      const d: Settings = r.data.data
      setAdminEmail(d.org.adminEmail)
      setForm({
        name: d.org.name,
        address: d.org.address || '',
        industry: d.org.industry || '',
        fuelCostPerLiter: String(d.settings?.fuelCostPerLiter ?? 105),
        costPerKm: String(d.settings?.costPerKm ?? 6),
        travelCostPolicy: d.settings?.travelCostPolicy || '',
        defaultCarpoolPolicy: d.settings?.defaultCarpoolPolicy || '',
      })
    }).finally(() => setLoading(false))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    setSaving(true)
    try {
      await api.put('/admin/settings', {
        ...form,
        fuelCostPerLiter: parseFloat(form.fuelCostPerLiter),
        costPerKm: parseFloat(form.costPerKm),
      })
      setSaved(true)
      toast('Settings saved', 'success')
      setTimeout(() => setSaved(false), 3000)
    } catch { toast('Failed to save', 'error') }
    finally { setSaving(false) }
  }

  const fields = [
    { section: 'Company Details', items: [
      { k: 'name', label: 'Company Name', type: 'text' },
      { k: 'address', label: 'Address', type: 'text' },
      { k: 'industry', label: 'Industry', type: 'text' },
    ]},
    { section: 'Carpool Config', items: [
      { k: 'fuelCostPerLiter', label: 'Fuel Cost / Liter (₹)', type: 'number' },
      { k: 'costPerKm', label: 'Cost Per KM (₹)', type: 'number' },
    ]},
  ]

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      <div className="bg-white px-4 shadow-sm shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)', paddingBottom: 16 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-xl">Settings</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 p-4 space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 safe-bottom">
          {fields.map(({ section, items }) => (
            <div key={section} className="m-card p-4 space-y-3">
              <p className="font-bold text-sm text-[#0f0f0f] uppercase tracking-wider">{section}</p>
              {items.map(({ k, label, type }) => (
                <div key={k}>
                  <label className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-1 block">{label}</label>
                  <input className="m-input" type={type} value={form[k as keyof typeof form]} onChange={set(k)} />
                </div>
              ))}
              {section === 'Company Details' && (
                <div>
                  <label className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-1 block">Admin Email</label>
                  <input className="m-input bg-[#f5f5f5] text-[#6b6b6b]" value={adminEmail} disabled />
                </div>
              )}
            </div>
          ))}

          <div className="m-card p-4 space-y-3">
            <p className="font-bold text-sm text-[#0f0f0f] uppercase tracking-wider">Policies</p>
            {[
              { k: 'travelCostPolicy', label: 'Travel Cost Policy' },
              { k: 'defaultCarpoolPolicy', label: 'Default Carpool Policy' },
            ].map(({ k, label }) => (
              <div key={k}>
                <label className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-1 block">{label}</label>
                <textarea className="m-input resize-none" rows={2}
                  value={form[k as keyof typeof form]} onChange={set(k)}
                  placeholder="Enter policy..." />
              </div>
            ))}
          </div>

          <button onClick={submit} disabled={saving} className="m-btn m-btn-primary m-btn-full">
            {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : saved ? <><Check size={18} /> Saved!</>
              : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  )
}
