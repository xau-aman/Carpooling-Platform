import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Wallet, CreditCard, Smartphone, Banknote, CheckCircle } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../context/ToastContext'

type PayMethod = 'WALLET' | 'CASH' | 'UPI' | 'CARD'

export default function Payment() {
  const { bookingId, tripId, amount } = useParams<{ bookingId: string; tripId: string; amount: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [method, setMethod] = useState<PayMethod>('WALLET')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const pay = async () => {
    setError('')
    setLoading(true)
    try {
      await api.post('/payments/pay', { bookingId, tripId, amount: parseFloat(amount || '0'), method })
      setDone(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Payment failed')
      toast(msg || 'Payment failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 gap-6 bg-white">
        <div className="w-24 h-24 rounded-full bg-[#f0fdf4] flex items-center justify-center">
          <CheckCircle size={48} className="text-[#16a34a]" />
        </div>
        <div className="text-center">
          <h2 className="font-display font-black text-2xl text-[#0f0f0f]">Payment Successful!</h2>
          <p className="text-[#6b6b6b] mt-1">₹{amount} paid via {method}</p>
        </div>
        <button onClick={() => navigate('/trips')} className="m-btn m-btn-primary">
          View My Trips →
        </button>
      </div>
    )
  }

  const methods: { id: PayMethod; label: string; icon: React.ReactNode }[] = [
    { id: 'WALLET', label: 'Wallet', icon: <Wallet size={20} /> },
    { id: 'CASH',   label: 'Cash',   icon: <Banknote size={20} /> },
    { id: 'UPI',    label: 'UPI',    icon: <Smartphone size={20} /> },
    { id: 'CARD',   label: 'Card',   icon: <CreditCard size={20} /> },
  ]

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      <div className="bg-white px-4 py-4 shadow-sm shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display font-bold text-xl">Payment</h1>
            <p className="text-xs text-[#6b6b6b]">Amount due: ₹{amount}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 24px)' }}>
        {error && (
          <div className="p-4 rounded-2xl bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-sm font-semibold">{error}</div>
        )}

        {/* Amount summary */}
        <div className="bg-white rounded-3xl p-5">
          <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-3">Summary</p>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#6b6b6b]">Ride Fare</span>
            <span className="font-bold">₹{amount}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#6b6b6b]">Platform Fee</span>
            <span className="font-bold">₹0</span>
          </div>
          <div className="flex justify-between font-bold pt-3 border-t border-[#f5f5f5]">
            <span>Total</span>
            <span className="text-[#f97316] font-display font-black text-xl">₹{amount}</span>
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-3xl p-5">
          <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-3">Payment Method</p>
          <div className="grid grid-cols-2 gap-3">
            {methods.map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all active:scale-95"
                style={{
                  borderColor: method === m.id ? '#714B67' : '#f0f0f0',
                  background: method === m.id ? '#714B67' : 'white',
                  color: method === m.id ? 'white' : '#0f0f0f',
                }}
              >
                {m.icon}
                <span className="text-xs font-bold">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button onClick={pay} disabled={loading} className="m-btn m-btn-primary m-btn-full text-base">
          {loading
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : `Pay ₹${amount} →`}
        </button>
      </div>
    </div>
  )
}
