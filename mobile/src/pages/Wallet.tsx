import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useToast } from '../context/ToastContext'

interface Tx { id: string; type: 'CREDIT' | 'DEBIT'; reason: string; amount: number; note?: string; createdAt: string }
interface Wallet { balance: number; transactions: Tx[] }

export default function WalletPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [rechargeAmt, setRechargeAmt] = useState('')
  const [recharging, setRecharging] = useState(false)
  const [showRecharge, setShowRecharge] = useState(false)

  const load = () => api.get('/wallet').then(r => setWallet(r.data.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const recharge = async () => {
    const amt = parseFloat(rechargeAmt)
    if (!amt || amt < 10) return toast('Min ₹10', 'error')
    setRecharging(true)
    try {
      await api.post('/wallet/recharge', { amount: amt })
      toast(`₹${amt} added!`, 'success')
      setShowRecharge(false); setRechargeAmt('')
      load()
    } catch { toast('Recharge failed', 'error') }
    finally { setRecharging(false) }
  }

  const quickAmounts = [100, 250, 500, 1000]

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]">
      <div className="bg-white px-4 py-4 shadow-sm shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 16px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-[#f5f5f5] flex items-center justify-center active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-xl">Wallet</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto safe-bottom">
        {/* Balance card */}
        <div className="m-4">
          <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #714B67, #875A7B)' }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <p className="text-white/70 text-sm mb-1">Available Balance</p>
            <p className="font-display font-black text-5xl text-white">₹{wallet?.balance ?? 0}</p>
            <button
              onClick={() => setShowRecharge(v => !v)}
              className="mt-4 flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-white text-sm font-bold active:scale-95"
            >
              <Plus size={16} /> Add Money
            </button>
          </div>
        </div>

        {/* Recharge panel */}
        {showRecharge && (
          <div className="mx-4 mb-4 bg-white rounded-3xl p-4">
            <p className="text-sm font-bold text-[#0f0f0f] mb-3">Add Money</p>
            <div className="flex gap-2 mb-3 flex-wrap">
              {quickAmounts.map(a => (
                <button key={a} onClick={() => setRechargeAmt(String(a))}
                  className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all active:scale-95 ${rechargeAmt === String(a) ? 'bg-[#714B67] text-white border-[#714B67]' : 'border-[#e5e5e5] text-[#0f0f0f]'}`}>
                  ₹{a}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={rechargeAmt}
              onChange={e => setRechargeAmt(e.target.value)}
              placeholder="Enter amount"
              className="m-input mb-3"
            />
            <button onClick={recharge} disabled={recharging} className="m-btn m-btn-primary m-btn-full">
              {recharging ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Add Money'}
            </button>
          </div>
        )}

        {/* Transactions */}
        <div className="mx-4 mb-4">
          <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wider mb-3">Transactions</p>
          {loading && [1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-2xl mb-2" />)}
          {!loading && (!wallet?.transactions?.length) && (
            <div className="text-center py-8 text-[#6b6b6b] text-sm">No transactions yet</div>
          )}
          <div className="space-y-2">
            {wallet?.transactions?.map(tx => (
              <div key={tx.id} className="bg-white rounded-2xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'CREDIT' ? 'bg-[#f0fdf4]' : 'bg-[#fef2f2]'}`}>
                  {tx.type === 'CREDIT'
                    ? <ArrowDownLeft size={18} className="text-[#16a34a]" />
                    : <ArrowUpRight size={18} className="text-[#dc2626]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#0f0f0f] capitalize">{tx.reason.replace('_', ' ').toLowerCase()}</p>
                  {tx.note && <p className="text-xs text-[#6b6b6b] truncate">{tx.note}</p>}
                  <p className="text-xs text-[#9ca3af] mt-0.5">
                    {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <p className={`font-display font-black text-lg shrink-0 ${tx.type === 'CREDIT' ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
