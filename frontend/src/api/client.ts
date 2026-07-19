const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:20263'
const AUTH_CLIENT_ID = import.meta.env.VITE_AUTH_CLIENT_ID || 'navigation'

function getRedirectUri(): string {
  return `${window.location.origin}/auth/callback`
}

export function redirectToAuthLogin() {
  const params = new URLSearchParams({
    client_id: AUTH_CLIENT_ID,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    state: Math.random().toString(36).substring(2),
  })
  window.location.href = `${AUTH_SERVICE_URL}/auth/login?${params.toString()}`
}

import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      redirectToAuthLogin()
    }
    return Promise.reject(err)
  }
)

export default client
export { AUTH_SERVICE_URL, AUTH_CLIENT_ID, getRedirectUri }
