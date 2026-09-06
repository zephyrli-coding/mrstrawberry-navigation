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
      :class="['sidebar', 'cu-sidebar', { open: mobileOpen }]"
      :role="mobileOpen ? 'dialog' : undefined"
      :aria-modal="mobileOpen ? true : undefined"
      aria-label="导航菜单"
      @keydown="sidebarKeys"
    >
      <RouterLink to="/" class="brand cu-brand" @click="closeSidebar"
        ><img class="brand-logo" src="/brand-strawberry-a.png" alt="快刀切草莓君" width="40" height="40" /><span>Compound</span></RouterLink
      >
      <details class="cu-disclosure cu-product" data-popover="product">
        <summary aria-label="切换产品" aria-expanded="false"><span class="cu-product-icon"><AppIcon name="compass" /></span><span class="cu-product-copy"><strong>Navigation</strong><small>常用工具与书签</small></span><AppIcon class="cu-chevron" name="down" /></summary>
        <nav class="cu-menu" aria-label="切换产品"><a v-for="product in products" :key="product.id" :href="product.id === 'account' ? `${AUTH_SERVICE_URL}/auth/profile` : product.id === 'navigation' ? '/' : (local ? product.localUrl : product.productionUrl)" :aria-current="product.id === 'navigation' ? 'page' : undefined"><AppIcon :name="product.icon" /><span class="cu-product-copy"><strong>{{ product.name }}</strong><small>{{ product.description }}</small></span><span v-if="product.id === 'navigation'" class="cu-current">当前</span></a></nav>
      </details>
      <p class="nav-label cu-nav-label">工作空间</p>
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
          ><AppIcon name="user" />账号中心</a
        >
        <p class="cu-sidebar-note">独立应用 · 统一账号</p>
      </div>
    </aside>
    <div class="workspace" :inert="mobileOpen">
      <Navbar :title="title" :menu-expanded="mobileOpen" @menu="openSidebar">
        <template v-if="$slots.search" #search><slot name="search" /></template>
      </Navbar>
      <div id="main-content" tabindex="-1" class="content cu-content"><slot /></div>
      <footer class="cu-footer"><span>Compound · Navigation</span><span>独立应用 · 统一账号</span></footer>
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
import products from '@/shared/products.json'
defineProps<{ title: string }>()
const route = useRoute()
const store = useBookmarksStore()
const mobileOpen = ref(false)
const sidebar = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null
const local = ['localhost', '127.0.0.1'].includes(
  new URL(AUTH_SERVICE_URL).hostname,
)
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
const desktop = window.matchMedia('(min-width: 960px)')
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

  display: flex;
  flex-direction: column;
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

  margin: 0 auto;
  flex: 1;
}
.content:focus {
  outline: none;
}
footer {
  padding: 20px 32px;
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

  }
}
@media (max-width: 959px) {
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

  }
  footer {
    padding: 20px 16px;
  }
}
.brand-logo { display: block; flex: 0 0 40px; width: 40px; height: 40px; object-fit: contain; }
</style>
