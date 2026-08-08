import { createContext, useContext, useState, type ReactNode, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'
interface Toast { id: number; message: string; type: ToastType }
interface ToastCtx { toast: (msg: string, type?: ToastType) => void }

const Ctx = createContext<ToastCtx>({} as ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }, [])

  const colors: Record<ToastType, string> = {
    success: '#16a34a', error: '#dc2626', info: '#714B67', warning: '#f97316',
  }

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed top-0 left-0 right-0 z-[9999] flex flex-col gap-2 p-4 pointer-events-none" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className="mx-auto w-full max-w-sm px-4 py-3 rounded-2xl text-white text-sm font-semibold shadow-lg"
            style={{ background: colors[t.type], animation: 'slideDown 0.2s ease' }}
          >
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
