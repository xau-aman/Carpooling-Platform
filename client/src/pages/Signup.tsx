import { useState, FormEvent, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Phone, Mail, Lock, Building, ArrowRight, Car } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { Organization } from '../types'

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '', organizationId: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/auth/organizations').then(r => {
      setOrgs(r.data.data)
      if (r.data.data.length) setForm(f => ({ ...f, organizationId: r.data.data[0].id }))
    })
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        name: form.name, phone: form.phone, email: form.email,
        password: form.password, organizationId: form.organizationId,
      })
      const { token, user } = res.data.data
      login(token, user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Aman Shah', icon: User },
    { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '9876543210', icon: Phone },
    { key: 'email', label: 'Email Address', type: 'email', placeholder: 'you@company.com', icon: Mail },
    { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••', icon: Lock },
    { key: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••••', icon: Lock },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #00A09D 0%, #714B67 100%)' }}>
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-10 -left-10 w-56 h-56 rounded-full bg-white/5" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Car size={22} className="text-white" />
          </div>
          <span className="font-display font-black text-2xl text-white">WorkZen</span>
        </div>

        <div>
          <h2 className="font-display font-black text-4xl text-white leading-tight mb-4">
            Join your team's<br />carpool network.
          </h2>
          <p className="text-white/70 text-lg">
            Save up to ₹3,000/month on commute costs while reducing traffic and emissions.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: '🚗', text: 'Match with colleagues on your route' },
              { icon: '💰', text: 'Split fuel costs automatically' },
              { icon: '🌱', text: 'Track your CO₂ savings' },
              { icon: '📍', text: 'Real-time GPS tracking' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <p className="text-white/80 text-sm">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs">© 2025 WorkZen · Built for Odoo Hackathon</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F5F5F5] overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00A09D, #714B67)' }}>
              <Car size={18} className="text-white" />
            </div>
            <span className="font-display font-black text-xl" style={{ color: '#714B67' }}>WorkZen</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display font-black text-3xl text-[#212529]">Create account</h1>
            <p className="text-[#868E96] mt-1.5">Join your organization's carpooling network</p>
          </div>

          <div className="card-lg p-8">
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-[#FFF5F5] border border-[#F5C6CB] text-[#D9534F] text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9534F] shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-4">
              {fields.map(({ key, label, type, placeholder, icon: Icon }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-[#495057] mb-2">{label}</label>
                  <div className="relative">
                    <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#868E96]" />
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={set(key)}
                      className="input pl-10"
                      required={key !== 'phone'}
                    />
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm font-semibold text-[#495057] mb-2">Organization</label>
                <div className="relative">
                  <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#868E96]" />
                  <select
                    value={form.organizationId}
                    onChange={set('organizationId')}
                    className="input pl-10 appearance-none"
                  >
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-base mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Create Account <ArrowRight size={16} /></span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#DEE2E6] text-center">
              <p className="text-sm text-[#868E96]">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold" style={{ color: '#714B67' }}>
                  Sign in →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
