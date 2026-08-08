import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserCheck, UserX, Plus, X, User } from 'lucide-react'
import api from '../../lib/api'
import { useToast } from '../../context/ToastContext'

interface Employee {
  id: string; name: string; email: string; phone?: string; isActive: boolean
  profile?: { department?: string; manager?: string; location?: string }
}

export default function AdminEmployees() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', manager: '', location: '' })

  const load = () => api.get('/admin/employees').then(r => setEmployees(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.name || !form.email) return toast('Name and email required', 'error')
    setSaving(true)
    try {
      await api.post('/admin/employees', form)
      await load()
      setShowForm(false)
      setForm({ name: '', email: '', phone: '', department: '', manager: '', location: '' })
      toast('Employee added', 'success')
    } catch (err: unknown) {
      toast((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed', 'error')
    } finally { setSaving(false) }
  }

  const toggleAccess = async (emp: Employee) => {
    try {
      await api.patch(`/admin/employees/${emp.id}/access`, { isActive: !emp.isActive })
      await load()
      toast(emp.isActive ? 'Access revoked' : 'Access granted', 'success')
    } catch { toast('Failed', 'error') }
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      <div className="bg-white px-4 shadow-sm shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)', paddingBottom: 16 }}>
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate('/admin')} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-xl flex-1">Employees</h1>
          <button onClick={() => setShowForm(v => !v)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white active:scale-95"
            style={{ background: '#714B67' }}>
            {showForm ? <X size={18} /> : <Plus size={18} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 safe-bottom">
        {/* Add form */}
        {showForm && (
          <div className="m-card p-4 space-y-3">
            <p className="font-bold text-sm text-[#0f0f0f]">Add Employee</p>
            {[
              { k: 'name', label: 'Full Name', type: 'text' },
              { k: 'email', label: 'Email', type: 'email' },
              { k: 'phone', label: 'Phone', type: 'tel' },
              { k: 'department', label: 'Department', type: 'text' },
              { k: 'manager', label: 'Manager', type: 'text' },
              { k: 'location', label: 'Location', type: 'text' },
            ].map(({ k, label, type }) => (
              <div key={k}>
                <label className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-1 block">{label}</label>
                <input className="m-input" type={type} value={form[k as keyof typeof form]} onChange={set(k)} />
              </div>
            ))}
            <button onClick={submit} disabled={saving} className="m-btn m-btn-primary m-btn-full">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Add Employee'}
            </button>
          </div>
        )}

        {loading && [1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}

        {!loading && employees.map(emp => (
          <div key={emp.id} className="m-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black shrink-0"
                  style={{ background: 'linear-gradient(135deg,#714B67,#875A7B)' }}>
                  {emp.name[0]}
                </div>
                <div>
                  <p className="font-bold text-[#0f0f0f]">{emp.name}</p>
                  <p className="text-xs text-[#6b6b6b]">{emp.email}</p>
                  {emp.profile?.department && <p className="text-xs text-[#6b6b6b]">{emp.profile.department}</p>}
                </div>
              </div>
              <button onClick={() => toggleAccess(emp)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border active:scale-95"
                style={emp.isActive
                  ? { background: '#fef2f2', color: '#dc2626', borderColor: '#dc2626' }
                  : { background: '#f0fdf4', color: '#16a34a', borderColor: '#16a34a' }}>
                {emp.isActive ? <><UserX size={12} /> Revoke</> : <><UserCheck size={12} /> Grant</>}
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={emp.isActive ? { background: '#f0fdf4', color: '#16a34a' } : { background: '#f5f5f5', color: '#6b6b6b' }}>
                {emp.isActive ? 'Active' : 'Revoked'}
              </span>
              {emp.profile?.location && <span className="text-xs text-[#6b6b6b]">📍 {emp.profile.location}</span>}
            </div>
          </div>
        ))}

        {!loading && employees.length === 0 && (
          <div className="text-center py-16">
            <User size={48} className="mx-auto mb-3 text-[#e5e5e5]" />
            <p className="font-bold text-[#0f0f0f]">No employees yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
