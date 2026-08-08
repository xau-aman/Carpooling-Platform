interface Props {
  otp: string | null        // driver sees this
  passengerOtp: string | null // passenger sees this
  otpInput: string
  onOtpInput: (v: string) => void
  onVerify: () => void
  loading: boolean
  isDriver: boolean
}

export default function OtpCard({ otp, passengerOtp, otpInput, onOtpInput, onVerify, loading, isDriver }: Props) {
  if (isDriver) return (
    <div className="mx-4 mb-4 m-card p-4" style={{ background: '#f0f9ff' }}>
      <p className="font-bold text-sm mb-3">🔑 OTP Verification</p>
      {otp && (
        <div className="bg-white rounded-2xl p-3 text-center mb-3">
          <p className="text-xs text-[#6b6b6b] mb-1">OTP sent to passenger</p>
          <p className="font-mono font-black text-4xl tracking-[0.3em]">{otp}</p>
        </div>
      )}
      <p className="text-xs text-[#6b6b6b] mb-2">Enter OTP from passenger:</p>
      <div className="flex gap-2">
        <input
          type="tel" maxLength={4} placeholder="0000"
          value={otpInput} onChange={e => onOtpInput(e.target.value.replace(/\D/g, ''))}
          className="flex-1 bg-white rounded-2xl px-4 py-3 text-center font-mono text-2xl tracking-widest outline-none border-2 border-[#e5e5e5] focus:border-[#714B67]"
        />
        <button
          onClick={onVerify} disabled={loading || otpInput.length !== 4}
          className="m-btn m-btn-primary px-5 disabled:opacity-50"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verify'}
        </button>
      </div>
    </div>
  )

  if (passengerOtp) return (
    <div className="mx-4 mb-4 m-card p-4" style={{ background: '#fffbeb' }}>
      <p className="font-bold text-sm mb-1">🔑 Share this OTP with driver</p>
      <p className="text-xs text-[#6b6b6b] mb-3">Driver will enter this to start the ride</p>
      <div className="bg-white rounded-2xl py-5 text-center">
        <p className="font-mono font-black text-5xl tracking-[0.4em] text-[#0f0f0f]">{passengerOtp}</p>
      </div>
    </div>
  )

  return null
}
