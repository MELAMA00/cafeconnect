import axios from 'axios'

export function getAuthToken() {
  return localStorage.getItem('token') || ''
}

const baseURL = import.meta.env.DEV
  ? 'http://localhost:4000/api'
  : window.location.origin + '/api'

export const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
