<template>
  <div class="search-field">
    <AppIcon name="search" />
    <input
      ref="input"
      v-model="search"
      type="search"
      aria-label="搜索书签"
      placeholder="搜索书签…"
    />
    <button
      v-if="search"
      class="icon-button"
      aria-label="清除搜索"
      @click="clearSearch"
    >
      <AppIcon name="close" />
    </button>
    <kbd v-else>⌘ / Ctrl K</kbd>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppIcon from './AppIcon.vue'

const search = defineModel<string>({ required: true })
const input = ref<HTMLInputElement | null>(null)
function focus() {
  input.value?.focus()
}
function clearSearch() {
  search.value = ''
  focus()
}
function keyboard(e: KeyboardEvent) {
  if (
    (e.metaKey || e.ctrlKey) &&
    e.key.toLowerCase() === 'k' &&
    !document.querySelector('dialog[open]') &&
    !input.value?.closest('[inert]')
  ) {
    e.preventDefault()
    focus()
  }
}
defineExpose({ focus })
onMounted(() => document.addEventListener('keydown', keyboard))
onUnmounted(() => document.removeEventListener('keydown', keyboard))
</script>
<style scoped>
.search-field {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
  min-width: 0;
  max-width: 520px;
  height: 36px;
  margin-left: auto;
  padding: 0 10px;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: 7px;
  color: var(--color-placeholder);
}
.search-field:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px #3567d814;
}
.search-field > svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}
.search-field input {
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  color: var(--color-heading);
  outline: none;
}
.search-field input::-webkit-search-cancel-button {
  display: none;
}
.search-field .icon-button {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}
.search-field kbd {
  font: 10px var(--font-family);
  white-space: nowrap;
  border: 1px solid var(--color-border);
  padding: 2px 5px;
  border-radius: 4px;
}
@media (max-width: 1100px) {
  .search-field kbd {
    display: none;
  }
}
</style>
