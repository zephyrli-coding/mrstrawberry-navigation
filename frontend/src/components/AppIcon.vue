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
import sharedIcons from '@/shared/icons.json'
const paths: Record<string, string> = sharedIcons
</script>
<style scoped>
svg {
  width: 18px;
  height: 18px;
  display: block;
  flex-shrink: 0;
}
</style>
