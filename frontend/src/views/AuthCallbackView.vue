<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-card__title">{{ title }}</h1>
      <p class="auth-card__sub">{{ message }}</p>
      <div v-if="error" class="auth-form__error" role="alert">{{ error }}</div>
      <div v-if="error" class="auth-links">
        <a href="#" @click.prevent="auth.login" class="auth-link">返回登录</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { consumeReturnTo } from '@/utils/returnTo'
import { errorMessage } from '@/utils/feedback'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const title = ref('登录中')
const message = ref('正在完成认证，请稍候...')
const error = ref('')

onMounted(async () => {
  const code = route.query.code as string
  const state = route.query.state as string

  if (!code) {
    title.value = '登录失败'
    error.value = '缺少授权码，请重新登录'
    return
  }

  // 校验 state 防止 CSRF；读取后立即删除，确保只能使用一次。
  const storedState = localStorage.getItem('oauth_state')
  localStorage.removeItem('oauth_state')
  if (!state || !storedState || state !== storedState) {
    title.value = '登录失败'
    error.value = '状态校验失败，请重新登录'
    return
  }

  try {
    await auth.handleCallback(code)
    title.value = '登录成功'
    message.value = '正在进入导航站...'
    router.replace(consumeReturnTo())
  } catch (e: any) {
    title.value = '登录失败'
    message.value = ''
    error.value = errorMessage(e, '认证失败，请重试')
  }
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
.auth-form__error {
  font-size: 13px;
  color: var(--color-error);
  padding: 10px 12px;
  background: #ffeaea;
  border-radius: var(--radius-btn);
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
