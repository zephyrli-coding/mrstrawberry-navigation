<template>
  <div class="shell">
    <a class="skip-link" href="#main-content">跳到主要内容</a>
    <button
      v-if="mobileOpen"
      class="backdrop"
      tabindex="-1"
      aria-label="关闭导航菜单"
      @click="closeSidebar"
    />
    <aside
      ref="sidebar"
      :class="['sidebar', { open: mobileOpen }]"
      :role="mobileOpen ? 'dialog' : undefined"
      :aria-modal="mobileOpen ? true : undefined"
      aria-label="导航菜单"
      @keydown="sidebarKeys"
    >
      <RouterLink to="/" class="brand" @click="closeSidebar"
        ><img class="brand-logo" src="/brand-strawberry.png" alt="快刀切草莓君" width="40" height="40" />compound</RouterLink
      >
      <details class="workspace-selector">
        <summary>
          <span class="workspace-icon"><AppIcon name="compass" /></span
          ><span><strong>Navigation</strong><small>网址导航</small></span
          ><AppIcon name="down" />
        </summary>
        <div class="workspace-links">
          <a :href="fundUrl">Fund Manager</a><a :href="dataUrl">Data Terminal</a
          ><a :href="`${AUTH_SERVICE_URL}/auth/profile`">统一账号中心</a>
        </div>
      </details>
      <p class="nav-label">工作空间</p>
      <nav class="side-nav" aria-label="工作空间">
        <RouterLink
          to="/"
          :class="{
            active:
              route.path === '/' &&
              !store.activeCategoryId &&
              store.sortMode !== 'recent',
          }"
          @click="selectHome"
          ><AppIcon name="grid" /><span>全部书签</span
          ><small v-if="route.path === '/'">{{
            store.bookmarks.length
          }}</small></RouterLink
        >
        <RouterLink
          to="/?sort=recent"
          :class="{ active: route.path === '/' && store.sortMode === 'recent' }"
          @click="selectRecent"
          ><AppIcon name="clock" /><span>最近添加</span></RouterLink
        >
      </nav>
      <div class="sidebar-content"><slot name="sidebar" /></div>
      <div class="sidebar-bottom">
        <RouterLink
          to="/profile"
          :class="{ active: route.path === '/profile' }"
          @click="closeSidebar"
          ><AppIcon name="settings" />个人设置与备份</RouterLink
        ><a :href="`${AUTH_SERVICE_URL}/auth/profile`"
          ><AppIcon name="user" />统一账号中心</a
        >
        <p><AppIcon name="lock" /><span>你的书签，你的空间</span></p>
      </div>
    </aside>
    <div class="workspace" :inert="mobileOpen">
      <Navbar :title="title" :menu-expanded="mobileOpen" @menu="openSidebar">
        <template v-if="$slots.search" #search><slot name="search" /></template>
      </Navbar>
      <div id="main-content" tabindex="-1" class="content"><slot /></div>
      <footer>
        © {{ new Date().getFullYear() }} 快刀切草莓君
        <span>闽ICP备18004703号-1</span>
      </footer>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBookmarksStore } from '@/stores/bookmarks'
import { AUTH_SERVICE_URL } from '@/api/client'
import Navbar from './Navbar.vue'
import AppIcon from './AppIcon.vue'
defineProps<{ title: string }>()
const route = useRoute()
const store = useBookmarksStore()
const mobileOpen = ref(false)
const sidebar = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null
const local = ['localhost', '127.0.0.1'].includes(
  new URL(AUTH_SERVICE_URL).hostname,
)
const fundUrl = local
  ? 'http://localhost:20260'
  : 'https://vestoria.mr-strawberry.com/fund/'
const dataUrl = local
  ? 'http://localhost:20262'
  : 'https://vestoria.mr-strawberry.com/data/'
async function openSidebar() {
  previousFocus = document.activeElement as HTMLElement
  mobileOpen.value = true
  await nextTick()
  sidebar.value?.querySelector<HTMLElement>('a')?.focus()
}
async function closeSidebar() {
  if (mobileOpen.value) {
    mobileOpen.value = false
    await nextTick()
    previousFocus?.focus()
  }
}
function selectHome() {
  store.activeCategoryId = null
  store.search = ''
  store.sortMode = 'manual'
  closeSidebar()
}
function selectRecent() {
  store.activeCategoryId = null
  store.search = ''
  store.sortMode = 'recent'
  closeSidebar()
}
function sidebarKeys(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    sidebar.value
      ?.querySelectorAll('details[open]')
      .forEach((d) => d.removeAttribute('open'))
    closeSidebar()
  }
  if (e.key !== 'Tab' || !mobileOpen.value) return
  const items = Array.from(
    sidebar.value?.querySelectorAll<HTMLElement>('a, button, summary') || [],
  ).filter((el) => el.getClientRects().length)
  const first = items[0],
    last = items[items.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last?.focus()
  }
  if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first?.focus()
  }
}
watch(() => [route.fullPath, store.activeCategoryId], closeSidebar)
const desktop = window.matchMedia('(min-width: 741px)')
function handleResize() {
  if (desktop.matches) closeSidebar()
}
watch(mobileOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
onMounted(() => desktop.addEventListener('change', handleResize))
onUnmounted(() => {
  desktop.removeEventListener('change', handleResize)
  document.body.style.overflow = ''
})
</script>
<style scoped>
.shell {
  min-height: 100vh;
}
.sidebar {
  width: 214px;
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 100;
  background: var(--color-sidebar);
  border-right: 1px solid var(--color-border);
  padding: 26px 16px 18px;
  display: flex;
  flex-direction: column;
}
.brand {
  font-size: 23px;
  font-weight: 600;
  letter-spacing: -1.1px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 10px;
  margin-bottom: 28px;
}
.brand-mark {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  transform: skewY(-8deg);
}
.brand-mark i {
  display: block;
  width: 6px;
  border-radius: 2px;
  background: var(--color-primary);
  height: 13px;
}
.brand-mark i:nth-child(2) {
  height: 20px;
}
.brand-mark i:nth-child(3) {
  height: 26px;
}
.workspace-selector {
  position: relative;
}
.workspace-selector summary {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 10px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
}
.workspace-selector summary::-webkit-details-marker {
  display: none;
}
.workspace-selector summary > span:nth-child(2) {
  flex: 1;
}
.workspace-selector strong {
  font-size: 12px;
  display: block;
}
.workspace-selector small {
  font-size: 10px;
  color: var(--color-placeholder);
  display: block;
}
.workspace-icon {
  display: grid;
  place-items: center;
  background: var(--color-blue-soft);
  color: var(--color-primary);
  width: 29px;
  height: 29px;
  border-radius: 6px;
}
.workspace-links {
  position: absolute;
  z-index: 110;
  top: 65px;
  left: 0;
  width: 220px;
  max-width: calc(100vw - 40px);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 6px;
  box-shadow: 0 8px 30px #25344a18;
}
.workspace-links a {
  display: block;
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
}
.workspace-links a:hover {
  background: var(--color-blue-soft);
}
.nav-label {
  font-size: 11px;
  color: var(--color-placeholder);
  padding: 24px 12px 10px;
}
.side-nav {
  display: grid;
  gap: 4px;
}
.side-nav a,
.sidebar-bottom > a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 7px;
  min-height: 40px;
  font-size: 13px;
}
.side-nav small {
  margin-left: auto;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--color-placeholder);
}
.side-nav .active,
.sidebar-bottom .active {
  background: var(--color-blue-soft);
  color: var(--color-primary);
  font-weight: 600;
}
.side-nav a:hover,
.sidebar-bottom > a:hover {
  background: #eef2f7;
}
.sidebar-content {
  min-height: 0;
  overflow: auto;
  margin-top: 16px;
  flex: 1;
}
.sidebar-bottom {
  padding-top: 12px;
  margin-top: auto;
}
.sidebar-bottom p {
  display: flex;
  gap: 8px;
  align-items: center;
  border-top: 1px solid var(--color-border);
  padding: 17px 10px 0;
  margin-top: 12px;
  font-size: 10px;
  color: var(--color-placeholder);
}
.sidebar-bottom p svg {
  width: 14px;
  height: 14px;
}
.workspace {
  margin-left: 214px;
  min-width: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.content {
  width: 100%;
  max-width: 1450px;
  padding: 32px 35px;
  margin: 0 auto;
  flex: 1;
}
.content:focus {
  outline: none;
}
footer {
  padding: 20px 35px;
  color: var(--color-placeholder);
  font-size: 10px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.backdrop {
  display: none;
}
@media (max-width: 1100px) {
  .content {
    padding: 28px 24px;
  }
}
@media (max-width: 740px) {
  .sidebar {
    visibility: hidden;
    transform: translateX(-100%);
    width: 260px;
    max-width: calc(100vw - 48px);
  }
  .sidebar.open {
    visibility: visible;
    transform: translateX(0);
  }
  .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: var(--color-overlay);
    z-index: 90;
  }
  .workspace {
    margin-left: 0;
  }
  .content {
    padding: 24px 18px;
  }
  footer {
    padding: 20px 18px;
  }
}
.brand-logo { display: block; flex: 0 0 40px; width: 40px; height: 40px; object-fit: contain; }
</style>
