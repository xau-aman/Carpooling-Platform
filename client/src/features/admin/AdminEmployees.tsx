import { useEffect, useState, FormEvent } from 'react'
import { Plus, UserCheck, UserX } from 'lucide-react'
import api from '../../lib/api'
import Button from '../../components/Button'
import { PageHeader, LoadingState, Badge, Input } from '../../components/ui'
import { User } from '../../types'

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', manager: '', location: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => api.get('/admin/employees').then(r => setEmployees(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/admin/employees', form)
      await load()
      setShowForm(false)
      setForm({ name: '', email: '', phone: '', department: '', manager: '', location: '' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Failed to add employee')
    } finally {
      setSaving(false)
    }
  }

  const toggleAccess = async (emp: User) => {
    await api.patch(`/admin/employees/${emp.id}/access`, { isActive: !emp.isActive })
    await load()
  }

  if (loading) return <LoadingState />

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} registered`}
        action={<Button variant="dark" size="sm" icon={<Plus size={14} />} onClick={() => setShowForm(v => !v)}>Add Employee</Button>}
      />

      {showForm && (
        <div className="neo-card-lg p-6 mb-6">
          <h3 className="font-display font-bold text-sm uppercase mb-4">Add Employee</h3>
          {error && <div className="mb-3 p-3 border-2 border-[#dc2626] bg-[#fef2f2] text-[#dc2626] text-sm">{error}</div>}
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <Input label="Full Name" value={form.name} onChange={set('name')} required />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
            <Input label="Phone" value={form.phone} onChange={set('phone')} />
            <Input label="Department" value={form.department} onChange={set('department')} />
            <Input label="Manager" value={form.manager} onChange={set('manager')} />
            <Input label="Location" value={form.location} onChange={set('location')} />
            <div className="col-span-2 flex gap-3 mt-1">
              <Button type="submit" variant="dark" loading={saving}>Add Employee</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="neo-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f0f0f] text-white">
                {['Name', 'Email', 'Department', 'Manager', 'Location', 'Access', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp.id} className={`border-b border-[#f0ede6] ${i % 2 === 0 ? 'bg-white' : 'bg-[#faf9f6]'}`}>
                  <td className="px-4 py-3 font-semibold">{emp.name}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{emp.email}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{emp.profile?.department || '—'}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{emp.profile?.manager || '—'}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{emp.profile?.location || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={emp.isActive ? 'success' : 'danger'}>{emp.isActive ? 'Active' : 'Revoked'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAccess(emp)}
                      className={`neo-btn text-xs px-2 py-1 ${emp.isActive ? 'bg-[#fef2f2] text-[#dc2626] border-[#dc2626]' : 'bg-[#f0fdf4] text-[#16a34a] border-[#16a34a]'}`}
                    >
                      {emp.isActive ? <><UserX size={12} /> Revoke</> : <><UserCheck size={12} /> Grant</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
