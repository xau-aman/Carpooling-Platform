import axios from 'axios'
import { tokenStore } from './tokenStore'

const api = axios.create({ baseURL: '/api/v1', withCredentials: true })

// Separate instance — no interceptors, used only for refresh to avoid infinite loop
const authApi = axios.create({ baseURL: '/api/v1', withCredentials: true })

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing: Promise<string> | null = null

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        if (!refreshing) {
          refreshing = authApi.post('/auth/refresh')
            .then(r => {
              const t = r.data.data.token
              tokenStore.set(t)
              return t
            })
            .finally(() => { refreshing = null })
        }
        const newToken = await refreshing
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
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
