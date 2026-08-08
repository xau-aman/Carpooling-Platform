import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { authApi } from '../lib/api'
import { tokenStore } from '../lib/tokenStore'

interface User {
  id: string; email: string; name: string; phone?: string
  role: 'ADMIN' | 'EMPLOYEE'; profilePhoto?: string
  wallet?: { balance: number }
}

interface AuthCtx {
  user: User | null; token: string | null; loading: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const Ctx = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    // Try localStorage first (works on Android without cookies)
    const saved = tokenStore.load()
    const savedUser = localStorage.getItem('gt_user')
    if (saved && savedUser) {
      try {
        const u = JSON.parse(savedUser)
        tokenStore.set(saved); setToken(saved); setUser(u)
        setLoading(false)
        return
      } catch {}
    }

    // Fallback: try cookie-based refresh (works on web)
    authApi.post('/auth/refresh')
      .then(r => {
        const { token: t, user: u } = r.data.data
        tokenStore.set(t); setToken(t); setUser(u)
        localStorage.setItem('gt_user', JSON.stringify(u))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = (t: string, u: User) => {
    tokenStore.set(t); setToken(t); setUser(u)
    localStorage.setItem('gt_user', JSON.stringify(u))
  }

  const logout = () => {
    tokenStore.set(null); setToken(null); setUser(null)
    localStorage.removeItem('gt_user')
    authApi.post('/auth/logout').catch(() => {})
  }

  return <Ctx.Provider value={{ user, token, loading, login, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
