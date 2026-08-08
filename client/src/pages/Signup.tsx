import { useState, FormEvent, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Phone, Mail, Lock, Building, ArrowRight, ArrowLeft, Eye, EyeOff, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { Organization } from '../types'

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '', organizationId: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    api.get('/auth/organizations').then(r => {
      setOrgs(r.data.data)
      if (r.data.data.length) setForm(f => ({ ...f, organizationId: r.data.data[0].id }))
    })
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setError('')
    setForm(f => ({ ...f, [k]: e.target.value }))
  }

  const next = () => {
    setError('')
    if (!form.email) return setError('Email is required')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match')
    setStep(1)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Name is required')
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        name: form.name, phone: form.phone, email: form.email,
        password: form.password, organizationId: form.organizationId,
      })
      const { token, user } = res.data.data
      login(token, user)
      setDone(true)
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-black">

      {/* ── Left panel — teal/green gradient ── */}
      <div
        className="hidden lg:flex flex-col justify-between relative overflow-hidden rounded-[2.5rem] m-3 mr-0 p-12"
        style={{ background: 'linear-gradient(to bottom, #052e16, #065f46, #0d9488, #FCD34D)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />

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

        <div className="relative z-10">
          <h1 className="font-display font-black text-5xl text-white leading-tight mb-4"
            style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.4)' }}>
            Ride smarter,<br />
            <span style={{ color: '#FCD34D' }}>save more.</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-10 max-w-sm">
            Join your organization's carpooling network and save up to ₹3,000/month on commute costs.
          </p>
          <div className="space-y-3">
            {[
              { icon: '🚗', text: 'Match with colleagues on your route' },
              { icon: '💰', text: 'Split fuel costs automatically' },
              { icon: '🌱', text: 'Track your CO₂ savings in real-time' },
              { icon: '📍', text: 'Live GPS tracking & in-app chat' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl border-2 border-white/20 flex items-center justify-center text-base shrink-0"
                  style={{ background: 'rgba(255,255,255,0.1)' }}>
                  {f.icon}
                </div>
                <p className="text-white/70 text-sm font-medium">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-xs font-bold tracking-[0.2em] uppercase">
          © 2025 WorkZen · Odoo Hackathon
        </p>
      </div>

      {/* ── Right — white form panel ── */}
      <div className="flex items-center justify-center bg-white rounded-[2.5rem] m-3 relative px-6 py-12 overflow-y-auto">

        {/* Back button */}
        {step === 1 && !done && (
          <button
            onClick={() => setStep(0)}
            className="absolute top-6 left-6 w-10 h-10 bg-white text-black rounded-full border-2 border-black flex items-center justify-center transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '2px 2px 0px 0px rgba(0,0,0,1)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="w-full max-w-sm py-4">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-2xl border-2 border-black flex items-center justify-center text-xl"
              style={{ background: '#FCD34D', boxShadow: '3px 3px 0 black' }}>
              🚗
            </div>
            <span className="font-display font-black text-xl text-black">WorkZen</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {['Credentials', 'Profile'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center text-xs font-black transition-all"
                  style={{
                    background: done ? '#10B981' : i < step ? '#000' : i === step ? '#FCD34D' : '#f5f5f5',
                    color: i < step || done ? 'white' : 'black',
                    boxShadow: i === step && !done ? '2px 2px 0 black' : 'none',
                  }}
                >
                  {done || i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${i === step && !done ? 'text-black' : 'text-gray-400'}`}>{s}</span>
                {i < 1 && <div className="w-6 h-0.5 bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>

          {done ? (
            <div className="text-center py-8">
              <div
                className="w-20 h-20 rounded-full border-2 border-black bg-[#FCD34D] flex items-center justify-center mx-auto mb-4"
                style={{ boxShadow: '4px 4px 0 black' }}
              >
                <Check size={36} className="text-black" />
              </div>
              <h2 className="font-display font-black text-2xl text-black uppercase mb-2">You're in!</h2>
              <p className="text-gray-500 text-sm">Redirecting to dashboard...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-display font-black text-3xl text-black uppercase">
                  {step === 0 ? 'Create Account' : 'Your Profile'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {step === 0 ? 'Set up your login credentials' : 'Tell us a bit about yourself'}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3.5 rounded-2xl border-2 border-red-300 bg-red-50 text-sm text-red-600 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}

              {step === 0 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-widest mb-2">Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" placeholder="you@odoo.com" value={form.email} onChange={set('email')} className="input pl-11" required autoComplete="email" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-widest mb-2">Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} className="input pl-11 pr-11" />
                      <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        {showPass ? <EyeOff size={13} className="text-gray-400" /> : <Eye size={13} className="text-gray-400" />}
                      </button>
                    </div>
                    {form.password && (
                      <div className="flex gap-1 mt-2">
                        {[2, 4, 6, 8].map(n => (
                          <div key={n} className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{ background: form.password.length >= n ? (n <= 2 ? '#F43F5E' : n <= 4 ? '#F59E0B' : n <= 6 ? '#0D9488' : '#10B981') : '#e5e7eb' }} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-widest mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} className="input pl-11"
                        style={{ borderColor: form.confirmPassword && form.confirmPassword !== form.password ? '#F43F5E' : '' }} />
                    </div>
                  </div>
                  <button
                    type="button" onClick={next}
                    className="w-full bg-black text-white py-4 rounded-full border-2 border-black font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 mt-1 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
                    style={{ boxShadow: '6px 6px 0px 0px rgba(0,0,0,0.2)' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '3px 3px 0px 0px rgba(0,0,0,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,0.2)')}
                  >
                    Continue <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {step === 1 && (
                <form onSubmit={submit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-widest mb-2">Full Name</label>
                    <div className="relative">
                      <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Aman Shah" value={form.name} onChange={set('name')} className="input pl-11" required autoComplete="name" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-widest mb-2">Phone <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} className="input pl-11" autoComplete="tel" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-widest mb-2">Organization</label>
                    <div className="relative">
                      <Building size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select value={form.organizationId} onChange={set('organizationId')} className="input pl-11 appearance-none">
                        {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full bg-black text-white py-4 rounded-full border-2 border-black font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 mt-1 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
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
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">Create Account <ArrowRight size={15} /></span>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="font-bold text-[#9c27b0] hover:underline">Sign in →</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
