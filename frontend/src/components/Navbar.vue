<template>
  <header class="navbar">
    <div class="breadcrumb">
      <button
        class="icon-button mobile-menu"
        aria-label="打开导航菜单"
        :aria-expanded="menuExpanded"
        @click="$emit('menu')"
      >
        <AppIcon name="menu" /></button
      ><span class="workspace-name">个人空间</span><span class="slash">/</span
      ><strong>{{ title }}</strong>
    </div>
    <div ref="menuRef" class="account" @keydown.esc="closeMenu">
      <button
        ref="trigger"
        class="avatar-btn"
        :aria-expanded="menuOpen"
        aria-label="账号菜单"
        @click="menuOpen = !menuOpen"
      >
        <span class="avatar">{{ displayInitial }}</span
        ><span class="account-name">{{ auth.displayName }}</span
        ><AppIcon name="down" />
      </button>
      <div v-if="menuOpen" class="dropdown">
        <p>{{ auth.user?.email }}</p>
        <RouterLink to="/profile" @click="menuOpen = false"
          ><AppIcon name="settings" />个人设置与备份</RouterLink
        >
        <a :href="`${AUTH_SERVICE_URL}/auth/profile`"
          ><AppIcon name="user" />统一账号中心</a
        >
        <button @click="handleLogout"><AppIcon name="logout" />退出登录</button>
      </div>
    </div>
  </header>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { AUTH_SERVICE_URL } from '@/api/client'
import AppIcon from './AppIcon.vue'
defineProps<{ title?: string; menuExpanded?: boolean }>()
defineEmits<{ menu: [] }>()
const auth = useAuthStore()
const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const displayInitial = computed(
  () => auth.displayName.charAt(0).toUpperCase() || '?',
)
function closeMenu() {
  menuOpen.value = false
  trigger.value?.focus()
}
function outside(e: MouseEvent) {
  if (!menuRef.value?.contains(e.target as Node)) menuOpen.value = false
}
async function handleLogout() {
  menuOpen.value = false
  await auth.logout()
}
onMounted(() => document.addEventListener('click', outside))
onUnmounted(() => document.removeEventListener('click', outside))
</script>
<style scoped>
.navbar {
  height: 67px;
  border-bottom: 1px solid var(--color-border);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 35px;
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
.workspace-name,
.slash {
  color: var(--color-placeholder);
  white-space: nowrap;
}
.account {
  position: relative;
  flex-shrink: 0;
}
.avatar-btn {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 5px;
  border-radius: 7px;
  font-size: 12px;
}
.avatar {
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--color-primary);
  background: var(--color-blue-soft);
  font-weight: 600;
}
.account-name {
  max-width: 140px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  width: 240px;
  max-width: calc(100vw - 32px);
  padding: 7px;
  z-index: 60;
  box-shadow: 0 8px 28px #25344a18;
}
.dropdown p {
  padding: 10px;
  font-size: 12px;
  overflow-wrap: anywhere;
  color: var(--color-placeholder);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 5px;
}
.dropdown a,
.dropdown button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 10px;
  border-radius: 6px;
  font-size: 13px;
  text-align: left;
}
.dropdown a:hover,
.dropdown button:hover {
  background: var(--color-blue-soft);
}
.dropdown button {
  color: var(--color-error);
}
.mobile-menu {
  display: none;
}
@media (max-width: 740px) {
  .navbar {
    height: 59px;
    padding: 0 16px;
    gap: 8px;
  }
  .mobile-menu {
    display: flex;
  }
  .workspace-name,
  .slash,
  .account-name {
    display: none;
  }
  .breadcrumb {
    gap: 8px;
  }
}
</style>
