import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Car } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'

export default function Login() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      const { token, user } = res.data.data
      login(token, user)
      toast('Welcome back! 👋', 'success')
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-20 -left-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-10 w-40 h-40 rounded-full bg-white/5" />

        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Car size={22} className="text-white" />
            </div>
            <span className="font-display font-black text-2xl text-white tracking-tight">WorkZen</span>
          </div>
          <p className="text-white/60 text-sm">Enterprise Carpooling Platform</p>
        </div>

        <div>
          <h2 className="font-display font-black text-4xl text-white leading-tight mb-4">
            Smarter commutes,<br />together.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Connect with colleagues, share rides, save money and reduce your carbon footprint.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: 'CO₂ Saved', value: '2.4T', color: 'bg-[#00A09D]' },
              { label: 'Rides Shared', value: '1,240', color: 'bg-[#F06050]' },
              { label: 'Employees', value: '380+', color: 'bg-[#F7CD1F]' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className={`w-8 h-1.5 rounded-full ${s.color} mb-3`} />
                <p className="font-display font-black text-2xl text-white">{s.value}</p>
                <p className="text-white/60 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs">© 2025 WorkZen · Built for Odoo Hackathon</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F5F5F5]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C3AED, #0D9488)' }}>
              <Car size={18} className="text-white" />
            </div>
            <span className="font-display font-black text-xl" style={{ color: '#7C3AED' }}>WorkZen</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display font-black text-3xl text-[#212529]">Welcome back</h1>
            <p className="text-[#868E96] mt-1.5">Sign in to your account to continue</p>
          </div>

          <div className="card-lg p-8">
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-[#FFF5F5] border border-[#F5C6CB] text-[#D9534F] text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9534F] shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-[#495057] mb-2">Email address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#868E96]" />
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={set('email')}
                    className="input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#495057] mb-2">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#868E96]" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set('password')}
                    className="input pl-10"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-base mt-1"
                style={{ background: loading ? '#9B7BA8' : undefined }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Sign In <ArrowRight size={16} /></span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#DEE2E6] text-center">
              <p className="text-sm text-[#868E96]">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold" style={{ color: '#7C3AED' }}>
                  Create one →
                </Link>
              </p>
            </div>
          </div>

          {/* Demo accounts */}
          <div className="mt-4 card p-4">
            <p className="text-xs font-semibold text-[#868E96] uppercase tracking-wider mb-3">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'Employee', email: 'aman@techcorp.demo', color: '#6CC1ED' },
                { role: 'Driver', email: 'raj@techcorp.demo', color: '#00A09D' },
                { role: 'Employee', email: 'priya@techcorp.demo', color: '#F06050' },
                { role: 'Admin', email: 'admin@techcorp.demo', color: '#714B67' },
              ].map(d => (
                <button
                  key={d.email}
                  onClick={() => setForm({ email: d.email, password: 'Demo@1234' })}
                  className="text-left p-2.5 rounded-xl border border-[#DEE2E6] hover:border-[#714B67] transition-colors"
                >
                  <span className="text-xs font-bold block" style={{ color: d.color }}>{d.role}</span>
                  <span className="text-xs text-[#868E96] truncate block">{d.email.split('@')[0]}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-[#868E96] mt-2 text-center">Password: Demo@1234</p>
          </div>
        </div>
      </div>
    </div>
  )
}
