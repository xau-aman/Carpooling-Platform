import { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'
import { AlertCircle, Inbox, Loader2 } from 'lucide-react'

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-[#495057]">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#868E96]">{icon}</span>}
        <input
          {...props}
          className={`input ${icon ? 'pl-10' : ''} ${error ? 'border-[#D9534F]' : ''} ${className}`}
        />
      </div>
      {error && <span className="text-xs text-[#D9534F]">{error}</span>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-[#495057]">{label}</label>}
      <select {...props} className={`input bg-white ${error ? 'border-[#D9534F]' : ''} ${className}`}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span className="text-xs text-[#D9534F]">{error}</span>}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'brand'

const badgeColors: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: '#F0FDF4', color: '#15803D' },
  warning: { bg: '#FFFBEB', color: '#B45309' },
  danger: { bg: '#FFF5F5', color: '#DC2626' },
  info: { bg: '#EFF6FF', color: '#2563EB' },
  default: { bg: '#F5F5F5', color: '#495057' },
  brand: { bg: 'rgba(113,75,103,0.1)', color: '#714B67' },
}

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: BadgeVariant }) {
  const c = badgeColors[variant]
  return (
    <span className="badge" style={{ background: c.bg, color: c.color }}>
      {children}
    </span>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
const statAccents = ['#714B67', '#00A09D', '#F06050', '#6CC1ED', '#F0A500']
let statIdx = 0

export function StatCard({ label, value, icon, accent, color }: { label: string; value: string | number; icon?: ReactNode; accent?: boolean; color?: string }) {
  const bg = color || (accent ? '#714B67' : 'white')
  const isColored = accent || !!color
  return (
    <div className="card p-5" style={{ background: bg }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: isColored ? 'rgba(255,255,255,0.7)' : '#868E96' }}>{label}</p>
          <p className="text-2xl font-bold mt-1.5 font-display" style={{ color: isColored ? 'white' : '#212529' }}>{value}</p>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isColored ? 'rgba(255,255,255,0.15)' : 'rgba(113,75,103,0.1)', color: isColored ? 'white' : '#714B67' }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#212529]">{title}</h1>
        {subtitle && <p className="text-sm text-[#868E96] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Loading ───────────────────────────────────────────────────────────────────
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 size={32} className="animate-spin" style={{ color: '#714B67' }} />
      <p className="text-sm text-[#868E96] font-medium">{message}</p>
    </div>
  )
}

// ── Empty ─────────────────────────────────────────────────────────────────────
export function EmptyState({ message, icon }: { message: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <span className="text-[#DEE2E6]">{icon || <Inbox size={48} />}</span>
      <p className="text-sm text-[#868E96] font-medium">{message}</p>
    </div>
  )
}

// ── Error ─────────────────────────────────────────────────────────────────────
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertCircle size={40} style={{ color: '#D9534F' }} />
      <p className="text-sm font-medium" style={{ color: '#D9534F' }}>{message}</p>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>
}
