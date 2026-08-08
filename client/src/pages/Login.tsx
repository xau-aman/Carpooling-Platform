import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'

const DEMO = [
  { label: 'Employee', email: 'aman@odoo.com',  bg: '#DEB3FA' },
  { label: 'Driver',   email: 'raj@odoo.com',   bg: '#FCD34D' },
  { label: 'Admin',    email: 'admin@odoo.com',  bg: '#ffffff' },
]

export default function Login() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

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
    <div className="min-h-screen grid lg:grid-cols-2 bg-black">

      {/* ── Left — HackStack purple gradient panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between relative overflow-hidden rounded-[2.5rem] m-3 mr-0 p-12"
        style={{ background: 'linear-gradient(to bottom, #4a148c, #9c27b0, #DEB3FA)' }}
      >
        {/* Noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl border-2 border-white/30 flex items-center justify-center text-2xl"
            style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}>
            🚗
          </div>
          <div>
            <p className="font-display font-black text-2xl text-white tracking-tight">WorkZen</p>
            <p className="text-white/50 text-[10px] uppercase tracking-[0.2em] font-bold">Carpooling Platform</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10">
          <h1 className="font-display font-black text-5xl text-white leading-tight mb-4"
            style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.4)' }}>
            Smarter<br />commutes,<br />together.
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-10 max-w-sm">
            Connect with colleagues, share rides, save money and reduce your carbon footprint.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '2.4T',  label: 'CO₂ Saved',   bg: '#DEB3FA' },
              { value: '1,240', label: 'Rides Shared', bg: '#FCD34D' },
              { value: '380+',  label: 'Employees',    bg: 'white' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 border-2 border-black"
                style={{ background: s.bg, boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
                <p className="font-display font-black text-2xl text-black">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/60 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-xs font-bold tracking-[0.2em] uppercase">
          © 2025 WorkZen · Odoo Hackathon
        </p>
      </div>

      {/* ── Right — white form panel ── */}
      <div className="flex items-center justify-center bg-white rounded-[2.5rem] m-3 relative px-6 py-12">

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-2xl border-2 border-black flex items-center justify-center text-xl"
              style={{ background: '#DEB3FA', boxShadow: '3px 3px 0 black' }}>
              🚗
            </div>
            <span className="font-display font-black text-xl text-black">WorkZen</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-black text-3xl text-black uppercase">Sign In</h2>
            <p className="text-sm text-gray-500 mt-2">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl border-2 border-red-300 bg-red-50 text-sm text-red-600 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-widest mb-2">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" placeholder="you@odoo.com"
                  value={form.email} onChange={set('email')}
                  className="input pl-11" required autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-black uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={set('password')}
                  className="input pl-11 pr-11" required autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  {showPass ? <EyeOff size={14} className="text-gray-400" /> : <Eye size={14} className="text-gray-400" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-black text-white py-4 rounded-full border-2 border-black font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px] mt-1"
              style={{ boxShadow: '6px 6px 0px 0px rgba(0,0,0,0.2)' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '3px 3px 0px 0px rgba(0,0,0,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,0.2)')}
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
                <span className="flex items-center gap-2">Sign In <ArrowRight size={15} /></span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-[#9c27b0] hover:underline">Create one →</Link>
            </p>
          </div>

          {/* Demo accounts */}
          <div className="mt-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-3">Quick Demo</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => setForm({ email: acc.email, password: 'Demo@1234' })}
                  className="rounded-2xl border-2 border-black p-3 text-center transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
                  style={{ background: acc.bg, boxShadow: '3px 3px 0 black' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '1px 1px 0 black')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '3px 3px 0 black')}
                >
                  <p className="font-black text-xs text-black uppercase tracking-wider">{acc.label}</p>
                  <p className="text-[10px] text-black/50 font-medium mt-0.5">{acc.email.split('@')[0]}</p>
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">Password: Demo@1234</p>
          </div>
        </div>
      </div>
    </div>
  )
}
