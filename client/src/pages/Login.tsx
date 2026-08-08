import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'

const DEMO = [
  { label: 'Employee', email: 'user@gotogether.com',   color: '#714B67' },
  { label: 'Driver',   email: 'driver@gotogether.com', color: '#00A09D' },
  { label: 'Admin',    email: 'admin@gotogether.com',  color: '#F06050' },
]

export default function Login() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    setForm(f => ({ ...f, [k]: e.target.value }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      const { token, user } = res.data.data
      login(token, user)
      toast(`Welcome back, ${user.name.split(' ')[0]}! 👋`, 'success')
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F8F7FF]">

      {/* ── Left panel — app-style gradient ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #714B67 0%, #875A7B 40%, #9B6B8F 70%, #c084fc 100%)' }}
      >
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute top-1/2 right-8 w-32 h-32 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/only_logo.png" alt="GoTogether" className="w-11 h-11 rounded-2xl object-cover shadow-lg" />
          <div>
            <p className="font-display font-black text-2xl text-white tracking-tight">GoTogether</p>
            <p className="text-white/50 text-[10px] uppercase tracking-[0.2em] font-semibold">Enterprise Carpooling</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h1 className="font-display font-black text-5xl text-white leading-tight mb-5">
            Smarter<br />commutes,<br />
            <span className="text-yellow-300">together.</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-10 max-w-sm">
            Connect with colleagues, share rides, save money and reduce your carbon footprint every day.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '2.4T',  label: 'CO₂ Saved' },
              { value: '1,240', label: 'Rides Shared' },
              { value: '380+',  label: 'Employees' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 bg-white/15 backdrop-blur-sm border border-white/20">
                <p className="font-display font-black text-2xl text-white">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-xs font-bold tracking-[0.2em] uppercase">
          © GoTogether · Odoo Hackathon
        </p>
      </div>

      {/* ── Right — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src="/only_logo.png" alt="GoTogether" className="w-10 h-10 rounded-2xl object-cover" />
            <span className="font-display font-black text-2xl text-[#212529]">GoTogether</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-black text-3xl text-[#212529]">Welcome back</h2>
            <p className="text-[#868E96] mt-1.5">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-5 p-4 rounded-2xl border border-red-200 bg-red-50 text-sm text-red-600 font-semibold flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#495057] mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868E96]" />
                <input
                  type="email" placeholder="you@gotogether.com"
                  value={form.email} onChange={set('email')}
                  className="input pl-11" required autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#495057] mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868E96]" />
                <input
                  type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={set('password')}
                  className="input pl-11 pr-11" required autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors">
                  {showPass ? <EyeOff size={14} className="text-[#868E96]" /> : <Eye size={14} className="text-[#868E96]" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#DEE2E6] text-center">
            <p className="text-sm text-[#868E96]">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold hover:underline" style={{ color: '#714B67' }}>Create one →</Link>
            </p>
          </div>

          {/* Demo accounts */}
          <div className="mt-6">
            <p className="text-xs font-bold text-[#868E96] uppercase tracking-widest text-center mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => setForm({ email: acc.email, password: 'Demo@1234' })}
                  className="rounded-2xl border border-[#DEE2E6] p-3 text-center hover:border-[#714B67] hover:bg-[#F8F7FF] transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1.5 text-white text-xs font-black"
                    style={{ background: acc.color }}>
                    {acc.label[0]}
                  </div>
                  <p className="font-bold text-xs text-[#212529]">{acc.label}</p>
                  <p className="text-[10px] text-[#868E96] mt-0.5">{acc.email.split('@')[0]}</p>
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] text-[#868E96] mt-2 font-medium">Password: Demo@1234</p>
          </div>
        </div>
      </div>
    </div>
  )
}
