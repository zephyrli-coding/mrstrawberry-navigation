<template>
  <article
    :class="['bookmark-card', `bookmark-card--${mode}`]"
    :data-id="bookmark.id"
  >
    <div class="card-top">
      <span v-if="mode !== 'simple'" class="favicon"
        ><img
          v-if="faviconUrl && !faviconError"
          :src="faviconUrl"
          alt=""
          loading="lazy"
          referrerpolicy="no-referrer"
          @error="faviconError = true"
        /><span v-else>{{
          bookmark.title.slice(0, 1).toUpperCase()
        }}</span></span
      ><a
        v-if="safeUrl"
        :href="safeUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="card-title"
        :title="bookmark.title"
        >{{ bookmark.title }}</a
      ><span v-else class="card-title" :title="bookmark.title">{{
        bookmark.title
      }}</span
      ><AppIcon v-if="mode === 'card'" class="open-icon" name="arrow" />
    </div>
    <div class="card-bottom">
      <span
        v-if="mode !== 'simple'"
        class="card-host"
        :title="description || bookmark.url"
        >{{
          description ||
          (safeUrl ? displayUrl : '网址不可打开，请编辑为 http / https')
        }}</span
      >
      <div class="card-actions">
        <template v-if="sortable"
          ><button
            class="icon-button drag-handle"
            tabindex="-1"
            :aria-label="`拖动书签 ${bookmark.title}`"
            title="拖动排序"
          >
            <AppIcon name="drag" /></button
          ><button
            class="icon-button"
            :disabled="first || busy"
            :aria-label="`上移书签 ${bookmark.title}`"
            @click="$emit('move', -1)"
          >
            <AppIcon name="up" /></button
          ><button
            class="icon-button"
            :disabled="last || busy"
            :aria-label="`下移书签 ${bookmark.title}`"
            @click="$emit('move', 1)"
          >
            <AppIcon name="down" /></button></template
        ><button
          class="icon-button"
          :aria-label="`编辑书签 ${bookmark.title}`"
          @click="$emit('edit', bookmark)"
        >
          <AppIcon name="edit" /></button
        ><button
          class="icon-button danger"
          :aria-label="`删除书签 ${bookmark.title}`"
          @click="$emit('delete', bookmark)"
        >
          <AppIcon name="trash" />
        </button>
      </div>
    </div>
  </article>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Bookmark } from '@/api/bookmarks'
import { safeWebUrl } from '@/utils/feedback'
import AppIcon from './AppIcon.vue'
const props = withDefaults(
  defineProps<{
    bookmark: Bookmark
    mode?: 'card' | 'list' | 'simple'
    sortable?: boolean
    first?: boolean
    last?: boolean
    busy?: boolean
  }>(),
  { mode: 'card' },
)
defineEmits<{
  edit: [b: Bookmark]
  delete: [b: Bookmark]
  move: [direction: number]
}>()
const faviconError = ref(false)
const description = computed(() => props.bookmark.description?.trim())
const safeUrl = computed(() => safeWebUrl(props.bookmark.url))
const displayUrl = computed(() =>
  safeUrl.value
    ? new URL(safeUrl.value).hostname.replace(/^www\./, '')
    : props.bookmark.url,
)
const faviconUrl = computed(() =>
  props.bookmark.favicon_url
    ? safeWebUrl(props.bookmark.favicon_url)
    : safeUrl.value
      ? `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(new URL(safeUrl.value).hostname)}`
      : undefined,
)
watch(
  () => props.bookmark.url,
  () => {
    faviconError.value = false
  },
)
</script>
<style scoped>
.bookmark-card {
  min-width: 0;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px 14px;
  transition: border-color 0.16s;
  display: flex;
  flex-direction: column;
}
.bookmark-card:hover {
  border-color: #ccd8ed;
}
.card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.favicon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: #f0f4fb;
  color: #5579b4;
  border-radius: 8px;
  font-weight: 600;
}
.favicon img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}
.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.card-title:hover {
  color: var(--color-primary);
}
.open-icon {
  width: 14px;
  color: #a1adc0;
}
.card-bottom {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  min-width: 0;
}
.card-host {
  color: var(--color-placeholder);
  font-size: 11px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1;
}
.card-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
}
.card-actions .icon-button {
  width: 27px;
  height: 28px;
}
.card-actions svg {
  width: 14px;
  height: 14px;
}
.drag-handle {
  cursor: grab;
}
.bookmark-card--list {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(210px, 1fr);
  gap: 18px;
  padding: 10px 14px;
  align-items: center;
  border-radius: 8px;
}
.bookmark-card--list .card-bottom {
  margin: 0;
}
.bookmark-card--simple {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  padding: 8px 12px;
  border-radius: 7px;
}
.bookmark-card--simple .card-top {
  flex: 1;
  min-width: 0;
}
.bookmark-card--simple .card-bottom {
  margin: 0;
}
.bookmark-card--simple .card-title {
  font-weight: 400;
}
.sort-ghost {
  opacity: 0.3;
}
@media (max-width: 740px) {
  .bookmark-card--list {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .bookmark-card--simple {
    padding: 10px;
  }
  .bookmark-card--simple .card-actions .drag-handle {
    display: none;
  }
  .card-actions .icon-button {
    width: 32px;
    height: 32px;
  }
}
</style>
