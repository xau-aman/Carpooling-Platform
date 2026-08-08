import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../lib/api'

interface User {
  id: string; email: string; name: string; phone?: string
  role: 'ADMIN' | 'EMPLOYEE'; profilePhoto?: string
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

  useEffect(() => {
    const t = localStorage.getItem('wz_token')
    if (!t) { setLoading(false); return }
    setToken(t)
    api.get('/auth/me')
      .then(r => setUser(r.data.data))
      .catch(() => { localStorage.removeItem('wz_token') })
      .finally(() => setLoading(false))
  }, [])

  const login = (t: string, u: User) => {
    localStorage.setItem('wz_token', t)
    setToken(t); setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('wz_token')
    setToken(null); setUser(null)
  }

  return <Ctx.Provider value={{ user, token, loading, login, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
