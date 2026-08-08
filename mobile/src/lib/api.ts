import axios from 'axios'
import { tokenStore } from './tokenStore'

const BASE = import.meta.env.VITE_API_URL || 'http://10.24.142.126:3001/api/v1'

const api = axios.create({ baseURL: BASE, withCredentials: true })
const authApi = axios.create({ baseURL: BASE, withCredentials: true })

api.interceptors.request.use(cfg => {
  const t = tokenStore.get()
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

let refreshing: Promise<string> | null = null

api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true
      try {
        if (!refreshing) {
          refreshing = authApi.post('/auth/refresh')
            .then(r => { const t = r.data.data.token; tokenStore.set(t); return t })
            .finally(() => { refreshing = null })
        }
        const t = await refreshing
        orig.headers.Authorization = `Bearer ${t}`
        return api(orig)
      } catch {
        tokenStore.set(null)
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export { authApi }
export default api
