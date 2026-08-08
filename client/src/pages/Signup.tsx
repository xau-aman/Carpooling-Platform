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

  const pwStrength = form.password.length === 0 ? 0 : form.password.length < 4 ? 1 : form.password.length < 6 ? 2 : form.password.length < 8 ? 3 : 4
  const pwColors = ['', '#F06050', '#F0A500', '#00A09D', '#10B981']
  const pwLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  return (
    <div className="min-h-screen flex bg-[#F8F7FF]">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #065f46 0%, #0d9488 40%, #714B67 80%, #875A7B 100%)' }}
      >
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10" />

        <div className="relative z-10 flex items-center gap-3">
          <img src="/only_logo.png" alt="GoTogether" className="w-11 h-11 rounded-2xl object-cover shadow-lg" />
          <div>
            <p className="font-display font-black text-2xl text-white tracking-tight">GoTogether</p>
            <p className="text-white/50 text-[10px] uppercase tracking-[0.2em] font-semibold">Enterprise Carpooling</p>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="font-display font-black text-5xl text-white leading-tight mb-5">
            Ride smarter,<br />
            <span className="text-yellow-300">save more.</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-10 max-w-sm">
            Join your organization's carpooling network and save up to ₹3,000/month on commute costs.
          </p>
          <div className="space-y-3">
            {[
              { icon: '🤝', text: 'Match with colleagues on your route' },
              { icon: '💰', text: 'Split fuel costs automatically' },
              { icon: '🌱', text: 'Track your CO₂ savings in real-time' },
              { icon: '📍', text: 'Live GPS tracking & in-app chat' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-base shrink-0">
                  {f.icon}
                </div>
                <p className="text-white/70 text-sm font-medium">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-xs font-bold tracking-[0.2em] uppercase">
          © 2025 GoTogether · Odoo Hackathon
        </p>
      </div>

      {/* ── Right — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md py-4">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/only_logo.png" alt="GoTogether" className="w-10 h-10 rounded-2xl object-cover" />
            <span className="font-display font-black text-2xl text-[#212529]">GoTogether</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {['Credentials', 'Profile'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all border-2"
                  style={{
                    background: done ? '#10B981' : i < step ? '#714B67' : i === step ? '#714B67' : '#F5F5F5',
                    borderColor: done ? '#10B981' : i <= step ? '#714B67' : '#DEE2E6',
                    color: i <= step || done ? 'white' : '#868E96',
                  }}
                >
                  {done || i < step ? <Check size={13} /> : i + 1}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${i === step && !done ? 'text-[#212529]' : 'text-[#868E96]'}`}>{s}</span>
                {i < 1 && <div className="w-8 h-0.5 bg-[#DEE2E6] mx-1" />}
              </div>
            ))}
          </div>

          {done ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, #714B67, #875A7B)' }}>
                <Check size={36} className="text-white" />
              </div>
              <h2 className="font-display font-black text-2xl text-[#212529] mb-2">You're in!</h2>
              <p className="text-[#868E96]">Redirecting to dashboard...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-display font-black text-3xl text-[#212529]">
                  {step === 0 ? 'Create Account' : 'Your Profile'}
                </h2>
                <p className="text-[#868E96] mt-1.5">
                  {step === 0 ? 'Set up your login credentials' : 'Tell us a bit about yourself'}
                </p>
              </div>

              {error && (
                <div className="mb-5 p-4 rounded-2xl border border-red-200 bg-red-50 text-sm text-red-600 font-semibold flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}

              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#495057] mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868E96]" />
                      <input type="email" placeholder="you@gotogether.com" value={form.email} onChange={set('email')}
                        className="input pl-11" required autoComplete="email" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#495057] mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868E96]" />
                      <input type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                        value={form.password} onChange={set('password')} className="input pl-11 pr-11" />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[#F5F5F5]">
                        {showPass ? <EyeOff size={14} className="text-[#868E96]" /> : <Eye size={14} className="text-[#868E96]" />}
                      </button>
                    </div>
                    {form.password && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1">
                          {[1,2,3,4].map(n => (
                            <div key={n} className="h-1 flex-1 rounded-full transition-all duration-300"
                              style={{ background: n <= pwStrength ? pwColors[pwStrength] : '#E9ECEF' }} />
                          ))}
                        </div>
                        <p className="text-xs font-semibold" style={{ color: pwColors[pwStrength] }}>{pwLabels[pwStrength]}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#495057] mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868E96]" />
                      <input type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')}
                        className="input pl-11"
                        style={{ borderColor: form.confirmPassword && form.confirmPassword !== form.password ? '#F06050' : '' }} />
                    </div>
                    {form.confirmPassword && form.confirmPassword !== form.password && (
                      <p className="text-xs text-[#F06050] font-semibold mt-1">Passwords don't match</p>
                    )}
                  </div>
                  <button type="button" onClick={next} className="btn btn-primary w-full flex items-center justify-center gap-2 mt-2">
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {step === 1 && (
                <form onSubmit={submit} className="space-y-4">
                  <button type="button" onClick={() => setStep(0)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#868E96] hover:text-[#212529] transition-colors mb-2">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <div>
                    <label className="block text-sm font-semibold text-[#495057] mb-1.5">Full Name</label>
                    <div className="relative">
                      <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868E96]" />
                      <input type="text" placeholder="Aman Shah" value={form.name} onChange={set('name')}
                        className="input pl-11" required autoComplete="name" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#495057] mb-1.5">
                      Phone <span className="text-[#868E96] font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868E96]" />
                      <input type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')}
                        className="input pl-11" autoComplete="tel" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#495057] mb-1.5">Organization</label>
                    <div className="relative">
                      <Building size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#868E96]" />
                      <select value={form.organizationId} onChange={set('organizationId')} className="input pl-11 appearance-none">
                        {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn btn-primary w-full flex items-center justify-center gap-2 mt-2">
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                    ) : (
                      <>Create Account <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 pt-5 border-t border-[#DEE2E6] text-center">
                <p className="text-sm text-[#868E96]">
                  Already have an account?{' '}
                  <Link to="/login" className="font-bold hover:underline" style={{ color: '#714B67' }}>Sign in →</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
