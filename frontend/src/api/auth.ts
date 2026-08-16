import client from './client'

export interface UserResponse {
  id: number
  email: string
  nickname: string | null
  is_active: boolean
  created_at: string
}

export interface CallbackResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: UserResponse
}

export const authApi = {
  exchangeCode(code: string) {
    return client.post<CallbackResponse>('/auth/callback', null, { params: { code } })
  },
  getMe() {
    return client.get<UserResponse>('/auth/me')
  },
  updateProfile(nickname: string) {
    return client.put<UserResponse>('/auth/me', null, { params: { nickname } })
  },
  logout() {
    return client.post('/auth/logout')
  },
}
