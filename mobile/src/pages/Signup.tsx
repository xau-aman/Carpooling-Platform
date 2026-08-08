import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api, { authApi } from '../lib/api'

interface Org { id: string; name: string }

export default function Signup() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [orgs, setOrgs] = useState<Org[]>([])
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '', organizationId: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    authApi.get('/auth/organizations').then(r => {
      setOrgs(r.data.data)
      if (r.data.data.length) setForm(f => ({ ...f, organizationId: r.data.data[0].id }))
    }).catch(() => toast('Could not load organizations', 'error'))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const next = () => {
    if (!form.email) return toast('Email is required', 'error')
    if (form.password.length < 6) return toast('Password must be at least 6 characters', 'error')
    if (form.password !== form.confirmPassword) return toast('Passwords do not match', 'error')
    setStep(1)
  }

  const submit = async () => {
    if (!form.name.trim()) return toast('Name is required', 'error')
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        name: form.name, phone: form.phone, email: form.email,
        password: form.password, organizationId: form.organizationId,
      })
      login(res.data.data.token, res.data.data.user)
      setDone(true)
      setTimeout(() => navigate('/home', { replace: true }), 1200)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const pwStrength = form.password.length === 0 ? 0 : form.password.length < 4 ? 1 : form.password.length < 6 ? 2 : form.password.length < 8 ? 3 : 4
  const pwColors = ['', '#F06050', '#F0A500', '#00A09D', '#10B981']
  const pwLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden">
      {/* Top branding */}
      <div className="flex items-center justify-center px-8 py-10" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 40px)' }}>
        <img src="/only_logo.png" alt="GoTogether" className="w-16 h-16 rounded-2xl" />
      </div>

      {/* Bottom sheet */}
      <div className="flex-1 bg-white rounded-t-[32px] px-6 pt-7 overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 24px)' }}>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {['Credentials', 'Profile'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all"
                style={{
                  background: done ? '#10B981' : i <= step ? '#714B67' : '#F5F5F5',
                  borderColor: done ? '#10B981' : i <= step ? '#714B67' : '#DEE2E6',
                  color: i <= step || done ? 'white' : '#868E96',
                }}
              >
                {done || i < step ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${i === step && !done ? 'text-[#0f0f0f]' : 'text-[#9ca3af]'}`}>{s}</span>
              {i < 1 && <div className="w-6 h-0.5 bg-[#e5e5e5] mx-1" />}
            </div>
          ))}
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #714B67, #875A7B)' }}>
              <Check size={36} className="text-white" />
            </div>
            <h2 className="font-display font-black text-2xl text-[#0f0f0f]">You're in!</h2>
            <p className="text-[#6b6b6b]">Redirecting...</p>
          </div>
        ) : (
          <>
            <h2 className="font-display font-bold text-2xl text-[#0f0f0f] mb-1">
              {step === 0 ? 'Create Account' : 'Your Profile'}
            </h2>
            <p className="text-sm text-[#6b6b6b] mb-5">
              {step === 0 ? 'Set up your login credentials' : 'Tell us about yourself'}
            </p>

            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-2 block">Email</label>
                  <input className="m-input" type="email" placeholder="you@odoo.com" value={form.email} onChange={set('email')} autoComplete="email" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-2 block">Password</label>
                  <div className="relative">
                    <input className="m-input pr-12" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b6b6b]">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(n => (
                          <div key={n} className="h-1 flex-1 rounded-full transition-all" style={{ background: n <= pwStrength ? pwColors[pwStrength] : '#E9ECEF' }} />
                        ))}
                      </div>
                      <p className="text-xs font-semibold" style={{ color: pwColors[pwStrength] }}>{pwLabels[pwStrength]}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-2 block">Confirm Password</label>
                  <input
                    className="m-input"
                    type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')}
                    style={{ borderColor: form.confirmPassword && form.confirmPassword !== form.password ? '#F06050' : '' }}
                  />
                  {form.confirmPassword && form.confirmPassword !== form.password && (
                    <p className="text-xs text-[#F06050] font-semibold mt-1">Passwords don't match</p>
                  )}
                </div>
                <button onClick={next} className="m-btn m-btn-primary m-btn-full mt-2">
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-sm font-semibold text-[#6b6b6b] mb-1">
                  <ArrowLeft size={14} /> Back
                </button>
                <div>
                  <label className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-2 block">Full Name</label>
                  <input className="m-input" type="text" placeholder="Aman Shah" value={form.name} onChange={set('name')} autoComplete="name" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-2 block">Phone <span className="normal-case font-normal">(optional)</span></label>
                  <input className="m-input" type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} autoComplete="tel" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-2 block">Organization</label>
                  <select className="m-input" value={form.organizationId} onChange={set('organizationId')}>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <button onClick={submit} disabled={loading} className="m-btn m-btn-primary m-btn-full mt-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Create Account <ArrowRight size={18} /></>}
                </button>
              </div>
            )}

            <p className="text-center text-sm text-[#6b6b6b] mt-6">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="font-bold text-[#714B67]">Sign In</button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
