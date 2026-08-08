import { useEffect, useState } from 'react'
import { Plus, TrendingUp, TrendingDown, CreditCard, Wallet as WalletIcon } from 'lucide-react'
import api from '../lib/api'
import { useToast } from '../context/ToastContext'
import Button from '../components/Button'
import { PageHeader, LoadingState, Badge } from '../components/ui'
import { Wallet as WalletType, WalletTransaction } from '../types'

const QUICK_AMOUNTS = [200, 500, 1000, 2000]

export default function WalletPage() {
  const { toast } = useToast()
  const [wallet, setWallet] = useState<WalletType | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('500')
  const [recharging, setRecharging] = useState(false)
  const [showRecharge, setShowRecharge] = useState(false)
  const [payMethod, setPayMethod] = useState<'wallet_direct' | 'razorpay'>('wallet_direct')

  const load = () => api.get('/wallet').then(r => setWallet(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const rechargeViaRazorpay = async () => {
    setRecharging(true)
    try {
      const orderRes = await api.post('/payments/order', { amount: parseFloat(amount) })
      const order = orderRes.data.data

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: order.amount,
        currency: 'INR',
        name: 'GoTogether Wallet',
        description: 'Wallet Recharge',
        order_id: order.id,
        handler: async () => {
          // On success, credit wallet
          await api.post('/wallet/recharge', { amount: parseFloat(amount) })
          await load()
          toast(`₹${amount} added to wallet!`, 'success')
          setShowRecharge(false)
        },
        theme: { color: '#f97316' },
        modal: { ondismiss: () => setRecharging(false) },
      }
      // @ts-expect-error Razorpay global
      if (!window.Razorpay) throw new Error('Razorpay script not loaded')
      // @ts-expect-error Razorpay global
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => { toast('Payment failed', 'error'); setRecharging(false) })
      rzp.open()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg || 'Razorpay order failed', 'error')
    } finally {
      setRecharging(false)
    }
  }

  const directRecharge = async () => {
    setRecharging(true)
    try {
      await api.post('/wallet/recharge', { amount: parseFloat(amount) })
      await load()
      toast(`₹${amount} added to wallet!`, 'success')
      setShowRecharge(false)
    } catch { toast('Recharge failed', 'error') }
    finally { setRecharging(false) }
  }

  const handleRecharge = () => {
    if (!amount || parseFloat(amount) <= 0) return toast('Enter valid amount', 'error')
    if (payMethod === 'razorpay') rechargeViaRazorpay()
    else directRecharge()
  }

  if (loading) return <LoadingState />

  const txIcon = (tx: WalletTransaction) =>
    tx.type === 'CREDIT'
      ? <TrendingUp size={14} className="text-[#16a34a]" />
      : <TrendingDown size={14} className="text-[#dc2626]" />

  const txBadge = (tx: WalletTransaction) =>
    tx.type === 'CREDIT'
      ? <span className="font-bold text-[#16a34a]">+₹{tx.amount}</span>
      : <span className="font-bold text-[#dc2626]">-₹{tx.amount}</span>

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Wallet" />

      {/* Balance card */}
      <div className="neo-card-lg p-8 mb-6 bg-[#0f0f0f] text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#f97316]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <WalletIcon size={24} className="text-[#f97316] mx-auto mb-3" />
        <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Available Balance</p>
        <p className="font-display font-black text-5xl text-[#f97316] mb-1">₹{wallet?.balance ?? 0}</p>
        <p className="text-xs text-white/40 mb-6">GoTogether Wallet</p>
        <Button
          variant="primary" size="sm"
          icon={<Plus size={14} />}
          onClick={() => setShowRecharge(v => !v)}
        >
          Add Money
        </Button>
      </div>

      {/* Recharge panel */}
      {showRecharge && (
        <div className="neo-card p-5 mb-6">
          <p className="font-display font-bold text-sm uppercase mb-4">Add Money to Wallet</p>

          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {QUICK_AMOUNTS.map(a => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                className={`neo-btn text-xs py-2 ${amount === String(a) ? 'bg-[#0f0f0f] text-white' : 'bg-white text-[#0f0f0f]'}`}
              >
                ₹{a}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] font-bold">₹</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="neo-input pl-7"
                placeholder="Custom amount"
                min="1"
              />
            </div>
          </div>

          {/* Payment method */}
          <p className="text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-2">Pay via</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setPayMethod('wallet_direct')}
              className={`neo-btn flex-col gap-1 py-3 text-xs ${payMethod === 'wallet_direct' ? 'bg-[#0f0f0f] text-white' : 'bg-white'}`}
            >
              <WalletIcon size={16} />
              Demo / Test
            </button>
            <button
              onClick={() => setPayMethod('razorpay')}
              className={`neo-btn flex-col gap-1 py-3 text-xs ${payMethod === 'razorpay' ? 'bg-[#0f0f0f] text-white' : 'bg-white'}`}
            >
              <CreditCard size={16} />
              Razorpay
            </button>
          </div>

          <Button variant="primary" fullWidth loading={recharging} onClick={handleRecharge}>
            Add ₹{amount} →
          </Button>
        </div>
      )}

      {/* Transactions */}
      <div>
        <p className="font-display font-bold text-xs uppercase tracking-widest text-[#6b6b6b] mb-3">
          Transaction History
        </p>
        {!wallet?.transactions?.length ? (
          <div className="neo-card p-8 text-center text-sm text-[#6b6b6b]">No transactions yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {wallet.transactions.map(tx => (
              <div key={tx.id} className="neo-card p-4 flex items-center gap-3">
                <div className={`w-9 h-9 border-2 border-[#0f0f0f] flex items-center justify-center shrink-0 ${tx.type === 'CREDIT' ? 'bg-[#f0fdf4]' : 'bg-[#fef2f2]'}`}>
                  {txIcon(tx)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{tx.note || tx.reason.replace('_', ' ')}</p>
                  <p className="text-xs text-[#6b6b6b]">
                    {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {txBadge(tx)}
                  <Badge variant={tx.type === 'CREDIT' ? 'success' : 'default'}>
                    {tx.reason.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
