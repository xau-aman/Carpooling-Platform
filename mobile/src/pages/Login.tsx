import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../lib/api'

export default function Login() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !password) return toast('Fill all fields', 'error')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      login(res.data.data.token, res.data.data.user)
      navigate('/home', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg || 'Network error — check WiFi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const demos = [
    { label: 'Admin', email: 'admin@gotogether.com' },
    { label: 'Driver', email: 'driver@gotogether.com' },
    { label: 'User', email: 'user@gotogether.com' },
  ]

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden">
      {/* Top branding */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 48px)' }}>
        <img src="/only_logo.png" alt="GoTogether" className="w-20 h-20 rounded-2xl mb-4" />
        <h1 className="font-display font-black text-4xl text-white tracking-tight">GoTogether</h1>
        <p className="text-white/50 text-sm mt-2">Enterprise Carpooling</p>
      </div>

      {/* Bottom sheet */}
      <div className="bg-white rounded-t-[32px] px-6 pt-8 pb-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 24px)' }}>
        <h2 className="font-display font-bold text-2xl text-[#0f0f0f] mb-6">Sign In</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-2 block">Email</label>
            <input
              className="m-input"
              type="email"
              placeholder="you@odoo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-2 block">Password</label>
            <div className="relative">
              <input
                className="m-input pr-12"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="m-btn m-btn-primary m-btn-full mb-4 text-base"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Sign In <ArrowRight size={18} /></>
          )}
        </button>

        {/* Demo accounts */}
        <div className="border-t border-[#f0f0f0] pt-4">
          <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-3 text-center">Demo Accounts</p>
          <div className="flex gap-2">
            {demos.map(d => (
              <button
                key={d.email}
                onClick={() => { setEmail(d.email); setPassword('Demo@1234') }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-[#e5e5e5] text-[#714B67] bg-[#f9f5ff] active:scale-95 transition-transform"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-[#6b6b6b] mt-4">
          No account?{' '}
          <button onClick={() => navigate('/signup')} className="font-bold text-[#714B67]">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  )
}
