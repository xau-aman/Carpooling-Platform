import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface RazorpayOptions {
  orderId: string
  amount: number       // rupees
  name: string
  description: string
  prefillName?: string
  prefillEmail?: string
  prefillPhone?: string
}

interface Props {
  options: RazorpayOptions
  onSuccess: (data: { razorpayOrderId: string; razorpayPayId: string; razorpaySignature: string }) => void
  onDismiss: () => void
}

const RAZORPAY_KEY = 'rzp_test_TNArC1VdlKrzoS'

export default function RazorpayCheckout({ options, onSuccess, onDismiss }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Build URL with query params — iframe loads /razorpay.html (same origin)
  const params = new URLSearchParams({
    key:          RAZORPAY_KEY,
    orderId:      options.orderId,
    amount:       String(Math.round(options.amount * 100)),
    name:         options.name,
    description:  options.description,
    prefillName:  options.prefillName  ?? '',
    prefillEmail: options.prefillEmail ?? '',
    prefillPhone: options.prefillPhone ?? '',
  })
  const src = `/razorpay.html?${params.toString()}`

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (!data?.type) return
        if (data.type === 'rzp_success') {
          onSuccess({
            razorpayOrderId:   data.razorpayOrderId,
            razorpayPayId:     data.razorpayPayId,
            razorpaySignature: data.razorpaySignature,
          })
        } else if (data.type === 'rzp_dismiss') {
          onDismiss()
        }
      } catch {}
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onSuccess, onDismiss])

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-black/70"
      style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <p className="text-white font-bold text-sm">Secure Payment · Razorpay</p>
        <button onClick={onDismiss}
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center active:scale-95">
          <X size={18} className="text-white" />
        </button>
      </div>
      <iframe
        ref={iframeRef}
        src={src}
        className="flex-1 w-full border-0 bg-white rounded-t-3xl"
        allow="payment"
        title="Razorpay Payment"
      />
    </div>
  )
}
