import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { authApi } from '../lib/api'
import { tokenStore } from '../lib/tokenStore'
import { requestNotificationPermission } from '../lib/notifications'
import { connectSocket, setSocketUserId } from '../lib/socket'
import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'

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

  const requestPerms = () => {
    // Only ask once — track in localStorage so we don't prompt on every launch
    const asked = localStorage.getItem('gt_perms_asked')
    if (!asked) {
      localStorage.setItem('gt_perms_asked', '1')
      requestNotificationPermission()
      if (Capacitor.isNativePlatform()) Geolocation.requestPermissions().catch(() => {})
    } else {
      // Already asked before — just silently re-check/grant channels without prompting
      requestNotificationPermission()
    }
  }

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    const saved = tokenStore.load()
    const savedUser = localStorage.getItem('gt_user')
    if (saved && savedUser) {
      try {
        const u = JSON.parse(savedUser)
        tokenStore.set(saved); setToken(saved); setUser(u)
        setLoading(false)
        requestPerms()
        connectSocket(); setSocketUserId(u.id)
        return
      } catch {}
    }

    authApi.post('/auth/refresh')
      .then(r => {
        const { token: t, user: u } = r.data.data
        tokenStore.set(t); setToken(t); setUser(u)
        localStorage.setItem('gt_user', JSON.stringify(u))
        requestPerms()
        connectSocket(); setSocketUserId(u.id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = (t: string, u: User) => {
    tokenStore.set(t); setToken(t); setUser(u)
    localStorage.setItem('gt_user', JSON.stringify(u))
    requestPerms()
    connectSocket(); setSocketUserId(u.id)
  }

  const logout = () => {
    tokenStore.set(null); setToken(null); setUser(null)
    localStorage.removeItem('gt_user')
    authApi.post('/auth/logout').catch(() => {})
  }

  return <Ctx.Provider value={{ user, token, loading, login, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
