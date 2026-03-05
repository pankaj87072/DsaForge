import axios from 'axios'

// In production (Railway), VITE_API_URL is set to your backend Railway URL
// e.g. https://dsaforge-backend.up.railway.app
// In local dev, it's empty and we use the /api proxy via vite
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('dsaforge_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dsaforge_token')
      localStorage.removeItem('dsaforge_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
