import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, AlertCircle, Info, X, Bell } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'notification'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} })
export const useToast = () => useContext(ToastContext)

const config: Record<ToastType, { icon: ReactNode; bg: string; border: string; text: string }> = {
  success: {
    icon: <CheckCircle size={18} />,
    bg: '#F0FDF4',
    border: '#86EFAC',
    text: '#15803D',
  },
  error: {
    icon: <AlertCircle size={18} />,
    bg: '#FFF5F5',
    border: '#FCA5A5',
    text: '#DC2626',
  },
  info: {
    icon: <Info size={18} />,
    bg: '#EFF6FF',
    border: '#93C5FD',
    text: '#2563EB',
  },
  notification: {
    icon: <Bell size={18} />,
    bg: '#FAF5FF',
    border: '#C4B5FD',
    text: '#714B67',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500)
  }, [])

  const remove = (id: string) => setToasts(t => t.filter(x => x.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map(t => {
          const c = config[t.type]
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-lg border text-sm font-medium"
              style={{ background: c.bg, borderColor: c.border, color: c.text }}
            >
              <span className="shrink-0 mt-0.5" style={{ color: c.text }}>{c.icon}</span>
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
