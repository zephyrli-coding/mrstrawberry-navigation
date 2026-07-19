<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-card__title">重置密码</h1>
      <p class="auth-card__sub">请在统一账号系统中重置密码...{{ countdown }}</p>
      <div class="auth-links">
        <a href="#" @click.prevent="goToAuth" class="auth-link">立即跳转</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { AUTH_SERVICE_URL, AUTH_CLIENT_ID, getRedirectUri } from '@/api/client'

const countdown = ref(3)

function goToAuth() {
  const params = new URLSearchParams({
    client_id: AUTH_CLIENT_ID,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    state: Math.random().toString(36).substring(2),
  })
  window.location.href = `${AUTH_SERVICE_URL}/auth/reset-password?${params.toString()}`
}

onMounted(() => {
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      goToAuth()
    }
  }, 1000)
})
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-alt);
  padding: 24px;
}
.auth-card {
  background: var(--color-surface);
  width: 100%;
  max-width: 400px;
  padding: 48px 40px;
  border-radius: var(--radius-card);
  text-align: center;
}
.auth-card__title {
  font-size: 28px;
  font-weight: 500;
  color: var(--color-heading);
  margin-bottom: 8px;
}
.auth-card__sub {
  font-size: 14px;
  color: var(--color-tertiary);
  margin-bottom: 32px;
}
.auth-links {
  margin-top: 24px;
}
.auth-link {
  font-size: 13px;
  color: var(--color-primary);
  text-decoration: none;
}
</style>
