<template>
    <details class="cu-disclosure cu-account" :class="{ 'cu-account--sidebar': placement === 'sidebar' }" data-popover="account">
      <summary aria-label="账号菜单" aria-expanded="false"><span class="cu-avatar">{{ displayInitial }}</span><span v-if="placement === 'sidebar'" class="cu-account-copy"><span class="cu-account-caption">账号中心</span><strong class="cu-account-name">{{ auth.displayName }}</strong><small class="cu-account-role">个人书签</small></span><span v-else class="cu-account-name">{{ auth.displayName }}</span><AppIcon class="cu-chevron" :name="placement === 'sidebar' ? 'up' : 'down'" /></summary>
      <div class="cu-menu"><p class="cu-account-email"><strong class="cu-menu-name">{{ auth.displayName }}</strong>{{ auth.user?.email }}<small class="cu-account-role">个人书签</small></p><a :href="`${AUTH_SERVICE_URL}/auth/profile`"><AppIcon name="user" />账号中心</a><RouterLink to="/profile"><AppIcon name="settings" />个人设置与备份</RouterLink><button class="cu-logout" :disabled="leaving" @click="handleLogout"><AppIcon name="logout" />{{ leaving ? '正在退出…' : '退出所有应用' }}</button><p v-if="error" role="alert" class="cu-account-email">{{ error }}</p></div>
    </details>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { AUTH_SERVICE_URL } from '@/api/client'
import AppIcon from './AppIcon.vue'
withDefaults(defineProps<{ placement?: 'sidebar' | 'header' }>(), { placement: 'sidebar' })
const auth = useAuthStore()
const leaving = ref(false)
const error = ref('')
const displayInitial = computed(() => auth.displayName.charAt(0).toUpperCase() || '?')
async function handleLogout() {
  leaving.value = true
  error.value = ''
  try { await auth.logout() } catch { error.value = '退出未完成，请重试。' } finally { leaving.value = false }
}
</script>
