import { useState, useEffect, useRef, ReactNode } from 'react'
import { User } from '../types'
import api, { authApi } from '../lib/api'
import { tokenStore } from '../lib/tokenStore'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    const savedToken = tokenStore.get()

    // If we have a saved token, try to get user info from it first
    if (savedToken) {
      api.get('/auth/me')
        .then(r => {
          const u = r.data.data as User
          setToken(savedToken)
          setUser(u)
        })
        .catch(() => {
          // Token expired — try refresh cookie
          authApi.post('/auth/refresh')
            .then(r => {
              const { token: t, user: u } = r.data.data
              tokenStore.set(t)
              setToken(t)
              setUser(u as User)
            })
            .catch(() => { tokenStore.set(null) })
        })
        .finally(() => setLoading(false))
    } else {
      // No saved token — try refresh cookie (local dev)
      authApi.post('/auth/refresh')
        .then(r => {
          const { token: t, user: u } = r.data.data
          tokenStore.set(t)
          setToken(t)
          setUser(u as User)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [])

  const login = (t: string, u: User) => {
    tokenStore.set(t)
    setToken(t)
    setUser(u)
  }

  const logout = () => {
    tokenStore.set(null)
    setToken(null)
    setUser(null)
    authApi.post('/auth/logout').catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
