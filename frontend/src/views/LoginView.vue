<template>
  <main class="auth-page">
    <div class="auth-card">
      <span class="auth-mark"><AppIcon name="compass" /></span>
      <p class="eyebrow">COMPOUND / NAVIGATION</p>
      <h1>
        {{
          loggedOut ? '已退出登录' : expired ? '请重新登录' : '回到你的书签空间'
        }}
      </h1>
      <p class="auth-sub" role="status">
        {{
          loggedOut
            ? '你已退出统一账号，可随时重新登录。'
            : expired
              ? '当前会话已失效，请通过统一账号重新登录后继续。'
              : `即将前往统一登录页面… ${countdown}`
        }}
      </p>
      <BaseButton full @click="goToAuth">{{
        loggedOut || expired ? '重新登录' : '前往统一登录'
      }}</BaseButton>
      <p class="auth-note">注册即可使用，书签仅对你可见。</p>
    </div>
  </main>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { redirectToAuthLogin } from '@/api/client'
import AppIcon from '@/components/AppIcon.vue'
import BaseButton from '@/components/BaseButton.vue'
const route = useRoute(),
  countdown = ref(3)
const loggedOut = route.query.logged_out === '1',
  expired = route.query.expired === '1'
let timer: ReturnType<typeof setInterval>
function goToAuth() {
  clearInterval(timer)
  redirectToAuthLogin()
}
onMounted(() => {
  if (loggedOut || expired) return
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) goToAuth()
  }, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>
<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
.auth-card {
  width: 420px;
  max-width: 100%;
  padding: 38px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 14px;
}
.auth-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  background: var(--color-blue-soft);
  color: var(--color-primary);
  border-radius: 10px;
  margin-bottom: 27px;
}
.auth-mark svg {
  width: 24px;
  height: 24px;
}
h1 {
  font-size: 26px;
  letter-spacing: -0.5px;
  font-weight: 600;
  margin: 10px 0;
}
.auth-sub {
  font-size: 13px;
  color: var(--color-placeholder);
  line-height: 1.8;
  margin-bottom: 26px;
}
.auth-note {
  font-size: 11px;
  color: var(--color-placeholder);
  margin-top: 22px;
  text-align: center;
}
@media (max-width: 500px) {
  .auth-card {
    padding: 28px;
  }
}
</style>
