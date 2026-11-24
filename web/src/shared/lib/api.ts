import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

// URL relativa para que o MSW (service worker) consiga interceptar.
// Em dev, o proxy do Vite encaminha /api → VITE_API_URL (backend real).
// Em prod, o servidor serve /api diretamente.
export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// Attach JWT from localStorage on every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('ng_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('ng_refresh_token')

      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken })
          localStorage.setItem('ng_access_token', data.accessToken)
          localStorage.setItem('ng_refresh_token', data.refreshToken)
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return api(original)
        } catch {
          localStorage.removeItem('ng_access_token')
          localStorage.removeItem('ng_refresh_token')
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  },
)

export default api
