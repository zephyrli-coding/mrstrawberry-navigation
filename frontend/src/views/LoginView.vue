<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-card__title">正在跳转</h1>
      <p class="auth-card__sub">即将前往统一登录页面...{{ countdown }}</p>
      <div class="auth-links">
        <a href="#" @click.prevent="goToAuth" class="auth-link">立即跳转</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { redirectToAuthLogin } from '@/api/client'

const countdown = ref(3)

function goToAuth() {
  redirectToAuthLogin()
}

onMounted(() => {
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      redirectToAuthLogin()
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
