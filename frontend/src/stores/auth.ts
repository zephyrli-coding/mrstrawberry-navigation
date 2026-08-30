import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type UserResponse } from '@/api/auth'
import { redirectToAuthLogin, redirectToGlobalLogout } from '@/api/client'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserResponse | null>(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  // 显示名称：优先使用昵称，其次是邮箱前缀
  const displayName = computed(() => {
    if (user.value?.nickname) return user.value.nickname
    if (user.value?.email) return user.value.email.split('@')[0]
    return ''
  })

  async function fetchMe() {
    try {
      const res = await authApi.getMe()
      user.value = res.data
    } catch {
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  async function handleCallback(code: string) {
    const res = await authApi.exchangeCode(code)
    user.value = res.data
    initialized.value = true
  }

  function login() {
    redirectToAuthLogin()
  }

  function register() {
    redirectToAuthLogin()
  }

  async function updateProfile(nickname: string) {
    const res = await authApi.updateProfile(nickname)
    user.value = res.data
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      user.value = null
      initialized.value = true
      redirectToGlobalLogout()
    }
  }

  return {
    user,
    initialized,
    isAuthenticated,
    displayName,
    fetchMe,
    handleCallback,
    login,
    register,
    updateProfile,
    logout,
  }
})
