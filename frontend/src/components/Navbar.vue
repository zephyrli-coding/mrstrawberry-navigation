<template>
  <header class="navbar cu-topbar" :class="{ 'navbar--search': !!$slots.search }">
    <div class="breadcrumb">
      <button
        class="icon-button mobile-menu"
        aria-label="打开导航菜单"
        :aria-expanded="menuExpanded"
        @click="$emit('menu')"
      >
        <AppIcon name="menu" /></button
      ><span class="workspace-name">工作空间</span><span class="slash">/</span
      ><strong>{{ title }}</strong>
    </div>
    <slot name="search" />
    <details class="cu-disclosure cu-account" data-popover="account">
      <summary aria-label="账号菜单" aria-expanded="false"><span class="cu-avatar">{{ displayInitial }}</span><span class="cu-account-name">{{ auth.displayName }}</span><AppIcon class="cu-chevron" name="down" /></summary>
      <div class="cu-menu"><p class="cu-account-email">{{ auth.user?.email }}</p><a :href="`${AUTH_SERVICE_URL}/auth/profile`"><AppIcon name="user" />账号中心</a><RouterLink to="/profile"><AppIcon name="settings" />个人设置与备份</RouterLink><button class="cu-logout" :disabled="leaving" @click="handleLogout"><AppIcon name="logout" />{{ leaving ? '正在退出…' : '退出所有应用' }}</button><p v-if="error" role="alert" class="cu-account-email">{{ error }}</p></div>
    </details>
  </header>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { AUTH_SERVICE_URL } from '@/api/client'
import AppIcon from './AppIcon.vue'
defineProps<{ title?: string; menuExpanded?: boolean }>()
defineEmits<{ menu: [] }>()
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
<style scoped>
.navbar {

  border-bottom: 1px solid var(--color-border);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 16px;
}
.breadcrumb {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  min-width: 0;
}
.breadcrumb strong {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.navbar--search .breadcrumb {
  max-width: 240px;
}
.workspace-name,
.slash {
  color: var(--color-placeholder);
  white-space: nowrap;
}
.mobile-menu {
  display: none;
}
@media (max-width: 1100px) {
  .navbar--search .workspace-name,
  .navbar--search .slash,
  .navbar--search .cu-account-name {
    display: none;
  }
}
@media (max-width: 959px) {
  .navbar {


    gap: 8px;
  }
  .mobile-menu {
    display: flex;
  }
  .workspace-name,
  .slash,
  .cu-account-name {
    display: none;
  }
  .breadcrumb {
    gap: 8px;
  }
  .navbar--search .breadcrumb {
    flex-shrink: 0;
  }
  .navbar--search .breadcrumb strong {
    display: none;
  }
}
</style>
