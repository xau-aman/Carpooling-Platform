import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'ghost' | 'outline' | 'danger' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
}

const variants = {
  primary: 'bg-[#714B67] text-white hover:bg-[#875A7B]',
  secondary: 'bg-[#00A09D] text-white hover:bg-[#00BDB9]',
  accent: 'bg-[#F06050] text-white hover:bg-[#e04f40]',
  dark: 'bg-[#212529] text-white hover:bg-[#343A40]',
  ghost: 'bg-transparent text-[#495057] hover:bg-[#F5F5F5]',
  outline: 'bg-transparent text-[#714B67] border-2 border-[#714B67] hover:bg-[#714B67] hover:text-white',
  danger: 'bg-[#D9534F] text-white hover:bg-[#C9302C]',
}

const sizes = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

export default function Button({ variant = 'primary', size = 'md', loading, icon, fullWidth, children, className = '', disabled, ...props }: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`btn ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-55 cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
