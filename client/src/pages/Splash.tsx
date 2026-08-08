import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'

export default function Splash() {
  const navigate = useNavigate()
  const logoRef = useRef<HTMLDivElement>(null)
  const taglineRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<SVGLineElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ onComplete: () => navigate('/login') })
    tl.fromTo(logoRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
      .fromTo(lineRef.current, { attr: { x2: 80 } }, { attr: { x2: 320 }, duration: 0.8, ease: 'power2.inOut' }, '-=0.2')
      .fromTo(dotRef.current, { attr: { cx: 80 } }, { attr: { cx: 320 }, duration: 0.8, ease: 'power2.inOut' }, '<')
      .fromTo(taglineRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2')
      .to({}, { duration: 1.2 })
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{ background: 'linear-gradient(160deg, #714B67 0%, #875A7B 50%, #1a0a14 100%)' }}>
      <div ref={logoRef} className="flex flex-col items-center gap-4">
        <img src="/only_logo.png" alt="GoTogether" className="w-20 h-20 rounded-3xl shadow-2xl" />
        <h1 className="font-display font-black text-6xl md:text-8xl text-white tracking-tighter">
          Go<span style={{ color: '#FCD34D' }}>Together</span>
        </h1>
      </div>

      <svg width="400" height="20" viewBox="0 0 400 20" className="overflow-visible">
        <line ref={lineRef} x1="80" y1="10" x2="80" y2="10" stroke="#FCD34D" strokeWidth="2" />
        <circle ref={dotRef} cx="80" cy="10" r="5" fill="#FCD34D" />
        <circle cx="80" cy="10" r="5" fill="white" />
        <circle cx="320" cy="10" r="5" fill="white" stroke="#FCD34D" strokeWidth="2" />
      </svg>

      <div ref={taglineRef} className="text-center opacity-0">
        <p className="font-display font-bold text-xl md:text-2xl text-white/70 tracking-widest uppercase">
          Ride Together.
        </p>
        <p className="font-display font-bold text-xl md:text-2xl tracking-widest uppercase" style={{ color: '#FCD34D' }}>
          Save Together.
        </p>
      </div>
    </div>
  )
}
