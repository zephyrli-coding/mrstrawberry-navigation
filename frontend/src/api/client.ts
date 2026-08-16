/// <reference types="vite/client" />

const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:20263'
const AUTH_CLIENT_ID = import.meta.env.VITE_AUTH_CLIENT_ID || 'navigation'

function getRedirectUri(): string {
  return `${window.location.origin}/auth/callback`
}

function createOAuthState(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function storeOAuthState(state: string) {
  // localStorage survives the cross-origin round trip more consistently than
  // sessionStorage in embedded/in-app browsers. The callback consumes it once.
  localStorage.setItem('oauth_state', state)
}

export function redirectToAuthLogin() {
  const state = createOAuthState()
  storeOAuthState(state)
  const params = new URLSearchParams({
    client_id: AUTH_CLIENT_ID,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    state,
  })
  window.location.href = `${AUTH_SERVICE_URL}/auth/login?${params.toString()}`
}

export function redirectToAuthForgotPassword() {
  const state = createOAuthState()
  storeOAuthState(state)
  const params = new URLSearchParams({
    client_id: AUTH_CLIENT_ID,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    state,
  })
  window.location.href = `${AUTH_SERVICE_URL}/auth/forgot-password?${params.toString()}`
}

export function redirectToGlobalLogout() {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = `${AUTH_SERVICE_URL}/auth/logout`
  const returnTo = document.createElement('input')
  returnTo.type = 'hidden'
  returnTo.name = 'return_to'
  returnTo.value = `${window.location.origin}/login?logged_out=1`
  form.appendChild(returnTo)
  document.body.appendChild(form)
  form.submit()
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
