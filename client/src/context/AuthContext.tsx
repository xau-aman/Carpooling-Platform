import { createContext, useContext } from 'react'
import { User } from '../types'

export interface AuthCtx {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  loading: boolean
}

export const AuthContext = createContext<AuthCtx>({} as AuthCtx)

export const useAuth = () => useContext(AuthContext)
