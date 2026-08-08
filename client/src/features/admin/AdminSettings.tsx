import { useEffect, useState, FormEvent } from 'react'
import api from '../../lib/api'
import Button from '../../components/Button'
import { PageHeader, LoadingState, Input } from '../../components/ui'

interface Settings {
  org: { name: string; address?: string; industry?: string; adminEmail: string }
  settings: { fuelCostPerLiter: number; costPerKm: number; travelCostPolicy?: string; defaultCarpoolPolicy?: string } | null
}

export default function AdminSettings() {
  const [data, setData] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: '', address: '', industry: '',
    fuelCostPerLiter: '105', costPerKm: '6',
    travelCostPolicy: '', defaultCarpoolPolicy: '',
  })

  useEffect(() => {
    api.get('/admin/settings').then(r => {
      const d: Settings = r.data.data
      setData(d)
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

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/admin/settings', {
        ...form,
        fuelCostPerLiter: parseFloat(form.fuelCostPerLiter),
        costPerKm: parseFloat(form.costPerKm),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !data) return <LoadingState />

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Settings" subtitle="Company & carpool configuration" />

      <form onSubmit={submit} className="flex flex-col gap-6">
        {/* Company */}
        <div className="neo-card p-6">
          <h3 className="font-display font-bold text-sm uppercase mb-4">Company Details</h3>
          <div className="flex flex-col gap-3">
            <Input label="Company Name" value={form.name} onChange={set('name')} required />
            <Input label="Registered Address" value={form.address} onChange={set('address')} />
            <Input label="Industry" value={form.industry} onChange={set('industry')} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#3d3d3d]">Admin Contact</label>
              <p className="neo-input bg-[#f0ede6] text-[#6b6b6b] cursor-not-allowed">{data.org.adminEmail}</p>
            </div>
          </div>
        </div>

        {/* Carpool config */}
        <div className="neo-card p-6">
          <h3 className="font-display font-bold text-sm uppercase mb-4">Carpool Configuration</h3>
          <div className="flex flex-col gap-3">
            <Input label="Fuel Cost / Liter (₹)" type="number" value={form.fuelCostPerLiter} onChange={set('fuelCostPerLiter')} />
            <Input label="Cost Per KM (₹)" type="number" value={form.costPerKm} onChange={set('costPerKm')} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#3d3d3d]">Travel Cost Policy</label>
              <textarea
                value={form.travelCostPolicy}
                onChange={set('travelCostPolicy')}
                rows={2}
                className="neo-input resize-none"
                placeholder="e.g. Employees must carpool for distances > 5km"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#3d3d3d]">Default Carpool Policy</label>
              <textarea
                value={form.defaultCarpoolPolicy}
                onChange={set('defaultCarpoolPolicy')}
                rows={2}
                className="neo-input resize-none"
              />
            </div>
          </div>
        </div>

        <Button type="submit" variant="dark" size="lg" loading={saving}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </Button>
      </form>
    </div>
  )
}
