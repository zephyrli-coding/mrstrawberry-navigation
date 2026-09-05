<template>
  <section class="categories" aria-label="分类管理">
    <div class="heading">
      <button
        class="heading-label"
        :aria-expanded="!collapsed"
        @click="collapsed = !collapsed"
      >
        <AppIcon :name="collapsed ? 'arrow' : 'down'" />我的分类
      </button>
      <div>
        <button
          class="icon-button"
          :aria-pressed="sortMode"
          aria-label="排序分类"
          title="排序分类"
          @click="toggleSortMode"
        >
          <AppIcon name="list" /></button
        ><button
          class="icon-button"
          aria-label="新建分类"
          title="新建分类"
          @click="$emit('add')"
        >
          <AppIcon name="plus" />
        </button>
      </div>
    </div>
    <template v-if="!collapsed">
      <p v-if="sortMode" class="hint">拖动分类，或用上下箭头排序</p>
      <ul ref="list" :key="revision" class="category-list">
        <li
          v-for="(cat, index) in categories"
          :key="cat.id"
          :data-id="cat.id"
          :class="['category-row', { active: activeId === cat.id }]"
        >
          <button
            v-if="sortMode"
            class="icon-button drag-handle"
            :aria-label="`拖动分类 ${cat.name}`"
            tabindex="-1"
          >
            <AppIcon name="drag" />
          </button>
          <button
            class="category-name"
            :title="cat.name"
            :aria-current="activeId === cat.id ? 'page' : undefined"
            @click="$emit('select', cat.id)"
          >
            <AppIcon v-if="!sortMode" name="folder" /><span>{{
              cat.name
            }}</span>
          </button>
          <div class="row-actions">
            <template v-if="sortMode"
              ><button
                class="icon-button"
                :disabled="index === 0 || busy"
                :aria-label="`上移分类 ${cat.name}`"
                @click="move(index, -1)"
              >
                <AppIcon name="up" /></button
              ><button
                class="icon-button"
                :disabled="index === categories.length - 1 || busy"
                :aria-label="`下移分类 ${cat.name}`"
                @click="move(index, 1)"
              >
                <AppIcon name="down" /></button
            ></template>
            <template v-else
              ><button
                class="icon-button"
                :aria-label="`编辑分类 ${cat.name}`"
                @click="$emit('edit', cat)"
              >
                <AppIcon name="edit" /></button
              ><button
                class="icon-button danger"
                :aria-label="`删除分类 ${cat.name}`"
                @click="$emit('delete', cat)"
              >
                <AppIcon name="trash" /></button
            ></template>
          </div>
        </li>
      </ul>
      <p v-if="!categories.length" class="hint">还没有分类，点击 + 新建</p>
    </template>
  </section>
</template>
<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import Sortable from 'sortablejs'
import AppIcon from './AppIcon.vue'
import type { Category } from '@/api/categories'
const props = defineProps<{
  categories: Category[]
  activeId: number | null
  busy?: boolean
}>()
const emit = defineEmits<{
  select: [id: number | null]
  add: []
  edit: [cat: Category]
  delete: [cat: Category]
  sort: [ids: number[]]
}>()
const collapsed = ref(false),
  sortMode = ref(false),
  list = ref<HTMLElement | null>(null),
  revision = ref(0)
let sortable: Sortable | null = null
function toggleSortMode() {
  sortMode.value = !sortMode.value
  collapsed.value = false
}
function move(index: number, direction: number) {
  const ids = props.categories.map((c) => c.id)
  const [id] = ids.splice(index, 1)
  ids.splice(index + direction, 0, id)
  emit('sort', ids)
}
watch(
  () => [
    sortMode.value,
    collapsed.value,
    props.categories,
    props.busy,
    revision.value,
  ],
  async () => {
    sortable?.destroy()
    sortable = null
    await nextTick()
    if (list.value && sortMode.value && !props.busy)
      sortable = new Sortable(list.value, {
        animation: 150,
        handle: '.drag-handle',
        draggable: '.category-row',
        ghostClass: 'sort-ghost',
        onEnd: (evt) => {
          if (evt.oldIndex === evt.newIndex) return
          const ids = Array.from(
            list.value!.querySelectorAll<HTMLElement>('[data-id]'),
          ).map((el) => Number(el.dataset.id))
          revision.value++ // Restore Vue's DOM before applying the persisted order.
          emit('sort', ids)
        },
      })
  },
  { flush: 'post' },
)
onUnmounted(() => sortable?.destroy())
</script>
<style scoped>
.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1px 8px 8px;
  gap: 4px;
}
.heading-label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--color-placeholder);
  font-size: 11px;
  white-space: nowrap;
}
.heading-label svg {
  width: 12px;
  height: 12px;
}
.heading > div {
  display: flex;
}
.heading .icon-button {
  width: 27px;
  height: 28px;
}
.heading .icon-button svg {
  width: 15px;
  height: 15px;
}
.category-list {
  list-style: none;
  display: grid;
  gap: 3px;
}
.category-row {
  display: flex;
  align-items: center;
  min-width: 0;
  border-radius: 7px;
  min-height: 40px;
}
.category-row.active {
  background: var(--color-blue-soft);
  color: var(--color-primary);
}
.category-name {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 4px 10px 12px;
  min-width: 0;
  flex: 1;
  text-align: left;
  font-size: 12px;
}
.category-name svg {
  width: 16px;
  height: 16px;
}
.category-name span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.row-actions {
  display: flex;
  flex-shrink: 0;
}
.row-actions .icon-button {
  width: 25px;
  height: 30px;
}
.row-actions svg {
  width: 13px;
  height: 13px;
}
.row-actions {
  opacity: 0;
}
.category-row:hover .row-actions,
.category-row:focus-within .row-actions {
  opacity: 1;
}
.category-row:hover {
  background: #eef2f7;
}
.hint {
  font-size: 11px;
  color: var(--color-placeholder);
  padding: 8px 10px;
}
.drag-handle {
  width: 20px;
  cursor: grab;
}
.sort-ghost {
  opacity: 0.35;
}
@media (hover: none) {
  .row-actions {
    opacity: 1;
  }
}
</style>
