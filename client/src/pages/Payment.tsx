import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Wallet, CreditCard, Smartphone, Banknote, CheckCircle } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../context/ToastContext'
import Button from '../components/Button'
import { PageHeader } from '../components/ui'
import { PaymentMethod } from '../types'

export default function Payment() {
  const { bookingId, tripId, amount } = useParams<{ bookingId: string; tripId: string; amount: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [method, setMethod] = useState<PaymentMethod>('WALLET')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const pay = async () => {
    setError('')
    setLoading(true)
    try {
      if (method === 'WALLET' || method === 'CASH') {
        await api.post('/payments/pay', { bookingId, tripId, amount: parseFloat(amount || '0'), method })
        setDone(true)
      } else {
        // Razorpay flow
        const orderRes = await api.post('/payments/order', { amount: parseFloat(amount || '0') })
        const order = orderRes.data.data

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
          amount: order.amount,
          currency: 'INR',
          name: 'GoTogether',
          description: 'Ride Payment',
          order_id: order.id,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            await api.post('/payments/pay', {
              bookingId, tripId,
              amount: parseFloat(amount || '0'),
              method,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPayId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            setDone(true)
          },
          theme: { color: '#f97316' },
        }

        // @ts-expect-error Razorpay global
        if (!window.Razorpay) throw new Error('Razorpay script not loaded')
        // @ts-expect-error Razorpay global
        const rzp = new window.Razorpay(options)
        rzp.open()
      }
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
      <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-20 h-20 bg-[#16a34a] border-2 border-[#0f0f0f] flex items-center justify-center">
          <CheckCircle size={40} className="text-white" />
        </div>
        <div className="text-center">
          <h2 className="font-display font-bold text-2xl uppercase">Payment Successful!</h2>
          <p className="text-[#6b6b6b] mt-1">₹{amount} paid via {method}</p>
        </div>
        <Button variant="dark" onClick={() => navigate('/history')}>View Ride History →</Button>
      </div>
    )
  }

  const methods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { id: 'WALLET', label: 'Wallet', icon: <Wallet size={18} /> },
    { id: 'CASH', label: 'Cash', icon: <Banknote size={18} /> },
    { id: 'UPI', label: 'UPI', icon: <Smartphone size={18} /> },
    { id: 'CARD', label: 'Card', icon: <CreditCard size={18} /> },
  ]

  return (
    <div className="max-w-md mx-auto">
      <PageHeader title="Payment" subtitle={`Amount due: ₹${amount}`} />

      <div className="neo-card-lg p-6">
        {error && <div className="mb-4 p-3 border-2 border-[#dc2626] bg-[#fef2f2] text-[#dc2626] text-sm">{error}</div>}

        <p className="text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-3">Payment Method</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {methods.map(m => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`neo-btn flex-col gap-2 py-4 ${method === m.id ? 'bg-[#0f0f0f] text-white' : 'bg-white text-[#0f0f0f]'}`}
            >
              {m.icon}
              <span className="text-xs">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 bg-[#f0ede6] border-2 border-[#0f0f0f] mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-[#6b6b6b]">Ride Fare</span>
            <span className="font-bold">₹{amount}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-[#6b6b6b]">Platform Fee</span>
            <span className="font-bold">₹0</span>
          </div>
          <div className="flex justify-between font-bold mt-2 pt-2 border-t border-[#0f0f0f]/20">
            <span>Total</span>
            <span className="text-[#f97316]">₹{amount}</span>
          </div>
        </div>

        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={pay}>
          Pay ₹{amount} →
        </Button>
      </div>
    </div>
  )
}
