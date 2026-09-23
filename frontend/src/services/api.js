import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('recycora_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('recycora_token')
      localStorage.removeItem('recycora_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.detail || error?.message || fallback
}

// ---- Auth ----
export const authApi = {
  register: (payload) => api.post('/api/auth/register', payload),
  login: (payload) => api.post('/api/auth/login', payload),
  me: () => api.get('/api/auth/me'),
}

// ---- Scans ----
export const scanApi = {
  create: (file, onUploadProgress) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/scans', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
  },
  list: (limit = 50) => api.get(`/api/scans?limit=${limit}`),
  get: (id) => api.get(`/api/scans/${id}`),
}

// ---- Waste records ----
export const wasteApi = {
  create: (payload) => api.post('/api/waste-records', payload),
  list: (limit = 200) => api.get(`/api/waste-records?limit=${limit}`),
}

// ---- Analytics / dashboard ----
export const analyticsApi = {
  dashboard: () => api.get('/api/dashboard'),
  analytics: () => api.get('/api/analytics'),
  forecast: () => api.get('/api/forecast'),
  recommendations: () => api.get('/api/recommendations'),
  achievements: () => api.get('/api/achievements'),
}

// ---- Recycling centers ----
export const centersApi = {
  list: (params = {}) => api.get('/api/recycling-centers', { params }),
  get: (id) => api.get(`/api/recycling-centers/${id}`),
}

// ---- Business ----
export const businessApi = {
  dashboard: () => api.get('/api/business/dashboard'),
}

// ---- Admin ----
export const adminApi = {
  analytics: () => api.get('/api/admin/analytics'),
  users: () => api.get('/api/admin/users'),
  toggleUserActive: (id) => api.patch(`/api/admin/users/${id}/toggle-active`),
  scans: (limit = 50) => api.get(`/api/admin/scans?limit=${limit}`),
  createCenter: (payload) => api.post('/api/admin/recycling-centers', payload),
}

// ---- Assistant ----
export const assistantApi = {
  ask: (message) => api.post('/api/assistant/ask', { message }),
  suggestions: () => api.get('/api/assistant/suggestions'),
}

export function scanImageUrl(scan) {
  if (!scan?.image_url) return null
  if (API_URL) return `${API_URL}${scan.image_url}`
  return scan.image_url
}

export default api
