interface Props {
  passengerOtp: string | null
  otpInput: string
  onOtpInput: (v: string) => void
  onVerify: () => void
  loading: boolean
  isDriver: boolean
  tripStatus: string
}

export default function OtpCard({ passengerOtp, otpInput, onOtpInput, onVerify, loading, isDriver, tripStatus }: Props) {
  if (isDriver && tripStatus === 'STARTED') return (
    <div className="mx-4 rounded-2xl p-4" style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd' }}>
      <p className="font-bold text-sm text-[#0f0f0f] mb-0.5">Enter Passenger OTP</p>
      <p className="text-xs text-[#6b6b6b] mb-4">Ask passenger for their 4-digit OTP</p>
      <input
        type="tel" maxLength={4} placeholder="0 0 0 0"
        value={otpInput} onChange={e => onOtpInput(e.target.value.replace(/\D/g, ''))}
        className="w-full bg-white rounded-2xl px-4 py-4 text-center font-mono text-3xl tracking-[0.5em] outline-none border-2 border-[#e5e5e5] focus:border-[#714B67] mb-3"
      />
      <button
        onClick={onVerify} disabled={loading || otpInput.length !== 4}
        className="m-btn m-btn-primary m-btn-full disabled:opacity-50">
        {loading
          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : 'Verify & Start Ride'}
      </button>
    </div>
  )

  if (!isDriver && passengerOtp && tripStatus === 'STARTED') return (
    <div className="mx-4 rounded-2xl p-4" style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
      <p className="font-bold text-sm text-[#0f0f0f] mb-0.5">Your Ride OTP</p>
      <p className="text-xs text-[#6b6b6b] mb-4">Share this with your driver to start the ride</p>
      <div className="bg-white rounded-2xl py-6 text-center" style={{ border: '2px dashed #f97316' }}>
        <p className="font-mono font-black text-5xl tracking-[0.5em] text-[#0f0f0f] pl-[0.5em]">{passengerOtp}</p>
      </div>
      <p className="text-xs text-center text-[#6b6b6b] mt-3">Valid until driver verifies</p>
    </div>
  )

  return null
}
