import axios from 'axios'

// Same server — change this to your server IP for device testing
const BASE_URL = import.meta.env.VITE_API_URL || 'http://10.24.142.126:3001/api/v1'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('wz_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export default api
