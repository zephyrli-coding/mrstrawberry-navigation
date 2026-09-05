<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.link" />
  </svg>
</template>
<script setup lang="ts">
defineProps<{ name: string }>()
const paths: Record<string, string> = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  list: 'M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  folder: 'M3 7V4h7l2 3h9v13H3z',
  compass: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M16 8l-3 5-5 3 3-5z',
  edit: 'M15 4l5 5M3 21l5-1L21 7l-5-5L3 15z',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  arrow: 'M7 17L17 7M7 7h10v10',
  up: 'M6 14l6-6 6 6',
  down: 'M6 10l6 6 6-6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  settings: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M4 4h16v16H4z',
  clock: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 6v6l4 2',
  link: 'M10 13l4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
  lock: 'M6 10h12v11H6z M8 10V6a4 4 0 0 1 8 0v4',
  drag: 'M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2',
  logout: 'M9 3H3v18h6M9 12h12M17 8l4 4-4 4',
}
</script>
<style scoped>
svg {
  width: 18px;
  height: 18px;
  display: block;
  flex-shrink: 0;
}
</style>
