<template>
  <header class="navbar">
    <div class="navbar__inner">
      <RouterLink to="/" class="navbar__logo">
        <img src="/logo.png" alt="logo" class="navbar__logo-img" />
        <span class="navbar__logo-text">Mr.Strawberry's House</span>
      </RouterLink>

      <div class="navbar__actions">
        <!-- 视图切换按钮 -->
        <button 
          class="view-toggle-btn" 
          @click="store.toggleViewMode()" 
          :title="store.isSimpleMode ? '切换到正常版' : '切换到简化版'"
        >
          <!-- 正常视图显示列表图标（点击切换到简化版） -->
          <svg v-if="!store.isSimpleMode" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <!-- 简化视图显示网格图标（点击切换到正常版） -->
          <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/>
            <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/>
            <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/>
            <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/>
          </svg>
        </button>
        
        <!-- 头像下拉 -->
        <div class="avatar-menu" ref="menuRef">
          <button class="avatar-btn" @click="menuOpen = !menuOpen" :aria-expanded="menuOpen">
            <span class="avatar-btn__circle">{{ displayInitial }}</span>
            <svg class="avatar-btn__caret" :class="{ 'avatar-btn__caret--open': menuOpen }"
              width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <Transition name="dropdown">
            <div v-if="menuOpen" class="dropdown">
              <div class="dropdown__header">
                <span v-if="auth.displayName" class="dropdown__name">{{ auth.displayName }}</span>
                <span class="dropdown__email">{{ auth.user?.email ?? '...' }}</span>
              </div>
              <div class="dropdown__divider" />
              <RouterLink to="/profile" class="dropdown__item" @click="menuOpen = false">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.4"/>
                  <path d="M2 13c0-3 2-5 6-5s6 2 6 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
                个人中心
              </RouterLink>
              <div class="dropdown__divider" />
              <button class="dropdown__item dropdown__item--danger" @click="handleLogout">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                退出登录
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBookmarksStore } from '@/stores/bookmarks'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const store = useBookmarksStore()
const router = useRouter()
const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!auth.user) auth.fetchMe()
  document.addEventListener('click', onOutsideClick)
})
onUnmounted(() => document.removeEventListener('click', onOutsideClick))

function onOutsideClick(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}

const displayInitial = computed(() => {
  // 优先使用昵称首字母，其次是邮箱首字母
  const name = auth.user?.nickname || auth.user?.email || ''
  return name.charAt(0).toUpperCase() || '?'
})

async function handleLogout() {
  menuOpen.value = false
  await auth.logout()
}
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}

.navbar__inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Custom font for logo */
@font-face {
  font-family: 'ClastonScript';
  src: url('@/assets/fonts/ClastonScript.ttf') format('truetype');
  font-style: normal;
  font-weight: normal;
}

.navbar__logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.navbar__logo-img {
  height: 30px;
  width: auto;
}

.navbar__logo-text {
  font-family: 'ClastonScript', cursive;
  font-size: 20px;
  color: var(--color-heading);
  letter-spacing: 0.02em;
}

.navbar__actions {
  display: flex;
  align-items: center;
}

/* Avatar button */
.avatar-menu {
  position: relative;
}

.avatar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-btn);
  transition: background-color var(--transition);
}
.avatar-btn:hover { background: var(--color-surface-alt); }

.avatar-btn__circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-btn__caret {
  color: var(--color-tertiary);
  transition: transform var(--transition);
}
.avatar-btn__caret--open { transform: rotate(180deg); }

/* Dropdown */
.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 220px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
  z-index: 200;
}

.dropdown__header {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dropdown__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown__email {
  font-size: 12px;
  color: var(--color-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown__divider {
  height: 1px;
  background: var(--color-border);
}

.dropdown__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  font-size: 14px;
  color: var(--color-body);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: background-color var(--transition);
  text-align: left;
}
.dropdown__item:hover { background: var(--color-surface-alt); }
.dropdown__item--danger { color: var(--color-error); }
.dropdown__item--danger:hover { background: #fff5f5; }

/* View toggle button */
.view-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: none;
  color: var(--color-tertiary);
  cursor: pointer;
  transition: all var(--transition);
  margin-right: 8px;
}
.view-toggle-btn:hover {
  background: var(--color-surface-alt);
  color: var(--color-primary);
}

/* Transition */
.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
