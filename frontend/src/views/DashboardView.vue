<template>
  <AppShell :title="activeLabel">
    <template #sidebar
      ><CategoryPanel
        :categories="store.categories"
        :active-id="store.activeCategoryId"
        :busy="sorting"
        @select="selectCategory"
        @add="openCategory(null)"
        @edit="openCategory"
        @delete="deleteCategory"
        @sort="sortCategories"
    /></template>
    <main>
      <div class="page-head">
        <div>
          <p class="eyebrow">{{ today }}</p>
          <h1>{{ activeLabel }}</h1>
          <p class="subtitle">常用工具、研究资料与日常灵感，都在一处。</p>
        </div>
        <BaseButton
          :disabled="store.loading || !!store.error"
          @click="openBookmark(null)"
          ><AppIcon name="plus" />添加书签</BaseButton
        >
      </div>
      <div class="search-field">
        <AppIcon name="search" /><input
          ref="searchInput"
          v-model="store.search"
          type="search"
          aria-label="搜索书签"
          placeholder="搜索书签、网址、描述或分类…"
        /><button
          v-if="store.search"
          class="icon-button"
          aria-label="清除搜索"
          @click="clearSearch"
        >
          <AppIcon name="close" /></button
        ><kbd v-else>⌘ / Ctrl K</kbd>
      </div>
      <div class="toolbar">
        <div class="result-summary" role="status">
          {{ store.filteredBookmarks.length }} 个书签<span v-if="store.search">
            · 搜索结果</span
          ><span v-else> · {{ store.categories.length }} 个分类</span>
        </div>
        <div class="toolbar-actions">
          <label class="sort-select"
            ><span class="sr-only">书签排序</span
            ><select
              :value="store.sortMode"
              aria-label="书签排序"
              @change="
                setSort(($event.target as HTMLSelectElement).value as SortMode)
              "
            >
              <option value="manual">自定义排序</option>
              <option value="title">标题排序</option>
              <option value="recent">最近添加</option>
            </select></label
          >
          <div class="view-switch" aria-label="视图切换">
            <button
              :aria-pressed="store.viewMode === 'card'"
              aria-label="网格视图"
              title="网格视图"
              @click="store.setViewMode('card')"
            >
              <AppIcon name="grid" /></button
            ><button
              :aria-pressed="store.viewMode === 'list'"
              aria-label="列表视图"
              title="列表视图"
              @click="store.setViewMode('list')"
            >
              <AppIcon name="list" /></button
            ><button
              :aria-pressed="store.viewMode === 'simple'"
              aria-label="简化视图"
              title="简化视图"
              @click="store.setViewMode('simple')"
            >
              简
            </button>
          </div>
        </div>
      </div>
      <div
        v-if="notice"
        :class="['notice', noticeError ? 'error' : 'success']"
        role="status"
      >
        {{ notice
        }}<button class="dismiss" aria-label="关闭提示" @click="notice = ''">
          ×
        </button>
      </div>
      <div
        v-if="store.loading"
        class="loading-state"
        role="status"
        aria-busy="true"
      >
        <span class="spinner" />正在加载你的书签…
      </div>
      <div v-else-if="store.error" class="empty-state">
        <AppIcon name="link" />
        <h2>暂时无法加载</h2>
        <p class="notice error" role="alert">{{ store.error }}</p>
        <BaseButton variant="secondary" @click="store.fetchAll"
          >重新加载</BaseButton
        >
      </div>
      <div v-else-if="!store.filteredBookmarks.length" class="empty-state">
        <AppIcon :name="store.search ? 'search' : 'compass'" />
        <h2>
          {{
            store.search
              ? '没有找到匹配的书签'
              : store.activeCategoryId
                ? '这个分类还没有书签'
                : '收藏你的第一个好去处'
          }}
        </h2>
        <p>
          {{
            store.search
              ? '换个关键词，或清除搜索查看所有书签。'
              : '添加常用网址，让每次出发都更轻松。'
          }}
        </p>
        <BaseButton
          variant="secondary"
          @click="store.search ? clearSearch() : openBookmark(null)"
          >{{ store.search ? '清除搜索' : '添加书签' }}</BaseButton
        >
      </div>
      <div
        v-else
        ref="results"
        :key="revision"
        class="results"
        :aria-busy="sorting"
      >
        <section v-for="group in groups" :key="group.key" class="group">
          <div
            v-if="
              store.activeCategoryId === null && store.sortMode === 'manual'
            "
            class="group-heading"
          >
            <h2>{{ group.name }}</h2>
            <span>{{ group.bookmarks.length }}</span>
          </div>
          <div
            :class="[
              'bookmark-collection',
              `bookmark-collection--${store.viewMode}`,
            ]"
            :data-group="group.key"
          >
            <BookmarkCard
              v-for="(bm, index) in group.bookmarks"
              :key="bm.id"
              :bookmark="bm"
              :mode="store.viewMode"
              :sortable="canSort"
              :first="index === 0"
              :last="index === group.bookmarks.length - 1"
              :busy="sorting"
              @edit="openBookmark"
              @delete="deleteBookmark"
              @move="moveBookmark(group.bookmarks, index, $event)"
            />
          </div>
        </section>
      </div>
      <p v-if="canSort && store.filteredBookmarks.length" class="sort-hint">
        <AppIcon name="drag" />拖动手柄调整顺序，也可使用卡片上的上下箭头。
      </p>
    </main>
    <BookmarkModal
      v-model="bookmarkOpen"
      :bookmark="editingBookmark"
      :categories="store.categories"
      :default-category="store.activeCategoryId"
      :save-action="saveBookmark"
    />
    <CategoryModal
      v-model="categoryOpen"
      :category="editingCategory"
      :save-action="saveCategory"
    />
    <ConfirmModal
      v-model="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :loading="confirmLoading"
      :error="confirmError"
      @confirm="confirm"
    />
  </AppShell>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sortable from 'sortablejs'
import { useBookmarksStore, type SortMode } from '@/stores/bookmarks'
import {
  bookmarksApi,
  type Bookmark,
  type BookmarkCreate,
} from '@/api/bookmarks'
import { categoriesApi, type Category } from '@/api/categories'
import { errorMessage } from '@/utils/feedback'
import AppShell from '@/components/AppShell.vue'
import AppIcon from '@/components/AppIcon.vue'
import CategoryPanel from '@/components/CategoryPanel.vue'
import BookmarkCard from '@/components/BookmarkCard.vue'
import BookmarkModal from '@/components/BookmarkModal.vue'
import CategoryModal from '@/components/CategoryModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import BaseButton from '@/components/BaseButton.vue'
const store = useBookmarksStore(),
  route = useRoute(),
  router = useRouter()
const searchInput = ref<HTMLInputElement | null>(null),
  results = ref<HTMLElement | null>(null),
  revision = ref(0),
  sorting = ref(false)
const today = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())
const activeLabel = computed(() =>
  store.activeCategoryId !== null
    ? store.categories.find((c) => c.id === store.activeCategoryId)?.name ||
      '书签'
    : store.sortMode === 'recent'
      ? '最近添加'
      : '全部书签',
)
const canSort = computed(
  () => store.sortMode === 'manual' && !store.search.trim() && !sorting.value,
)
const groups = computed(() => {
  if (store.activeCategoryId !== null || store.sortMode !== 'manual')
    return [
      {
        key: 'selected',
        name: activeLabel.value,
        bookmarks: store.filteredBookmarks,
      },
    ]
  const grouped = store.categories
    .map((c) => ({
      key: String(c.id),
      name: c.name,
      bookmarks: store.filteredBookmarks.filter((b) => b.category_id === c.id),
    }))
    .filter((g) => g.bookmarks.length)
  const unclassified = store.filteredBookmarks.filter(
    (b) =>
      b.category_id === null ||
      !store.categories.some((c) => c.id === b.category_id),
  )
  if (unclassified.length)
    grouped.push({
      key: 'uncategorized',
      name: '未分类',
      bookmarks: unclassified,
    })
  return grouped
})
function readQuery() {
  const id = Number(route.query.category)
  store.activeCategoryId = Number.isInteger(id) && id > 0 ? id : null
  store.sortMode =
    route.query.sort === 'title' || route.query.sort === 'recent'
      ? route.query.sort
      : 'manual'
}
watch(() => route.query, readQuery, { immediate: true })
function selectCategory(id: number | null) {
  store.setActiveCategory(id)
  router.replace({ query: { ...route.query, category: id ?? undefined } })
}
function setSort(sort: SortMode) {
  store.sortMode = sort
  router.replace({
    query: { ...route.query, sort: sort === 'manual' ? undefined : sort },
  })
}
function clearSearch() {
  store.search = ''
  searchInput.value?.focus()
}
function keyboard(e: KeyboardEvent) {
  if (
    (e.metaKey || e.ctrlKey) &&
    e.key.toLowerCase() === 'k' &&
    !document.querySelector('dialog[open]')
  ) {
    e.preventDefault()
    searchInput.value?.focus()
  }
}
onMounted(() => {
  store.fetchAll()
  document.addEventListener('keydown', keyboard)
})
const notice = ref(''),
  noticeError = ref(false)
function notify(message: string, error = false) {
  notice.value = message
  noticeError.value = error
}
const bookmarkOpen = ref(false),
  editingBookmark = ref<Bookmark | null>(null)
function openBookmark(bookmark: Bookmark | null) {
  editingBookmark.value = bookmark
  bookmarkOpen.value = true
}
async function saveBookmark(data: BookmarkCreate) {
  if (editingBookmark.value)
    await store.updateBookmark(editingBookmark.value.id, data)
  else await store.createBookmark(data)
  notify(editingBookmark.value ? '书签已保存' : '书签已添加')
}
const categoryOpen = ref(false),
  editingCategory = ref<Category | null>(null)
function openCategory(category: Category | null) {
  editingCategory.value = category
  categoryOpen.value = true
}
async function saveCategory(name: string) {
  if (
    store.categories.some(
      (c) => c.name === name && c.id !== editingCategory.value?.id,
    )
  )
    throw { response: { data: { detail: '分类名称已存在' } } }
  if (editingCategory.value)
    await store.updateCategory(editingCategory.value.id, name)
  else await store.createCategory(name)
  notify('分类已保存')
}
const confirmOpen = ref(false),
  confirmTitle = ref(''),
  confirmMessage = ref(''),
  confirmError = ref(''),
  confirmLoading = ref(false)
let confirmAction: (() => Promise<void>) | null = null
function deleteBookmark(b: Bookmark) {
  confirmTitle.value = '删除书签'
  confirmMessage.value = `确定删除「${b.title}」？此操作无法撤销。`
  confirmError.value = ''
  confirmAction = () => store.deleteBookmark(b.id)
  confirmOpen.value = true
}
function deleteCategory(c: Category) {
  confirmTitle.value = '删除分类'
  confirmMessage.value = `确定删除「${c.name}」？分类内的书签会保留并归入未分类。`
  confirmError.value = ''
  confirmAction = async () => {
    await store.deleteCategory(c.id)
    if (String(route.query.category) === String(c.id)) selectCategory(null)
  }
  confirmOpen.value = true
}
async function confirm() {
  if (!confirmAction || confirmLoading.value) return
  confirmLoading.value = true
  confirmError.value = ''
  try {
    await confirmAction()
    confirmOpen.value = false
    notify('删除完成')
  } catch (e) {
    confirmError.value = errorMessage(e, '删除失败，请重试。')
  } finally {
    confirmLoading.value = false
  }
}
async function sortCategories(ids: number[]) {
  if (sorting.value) return
  sorting.value = true
  try {
    await categoriesApi.updateSortOrder(
      ids.map((id, sort_order) => ({ id, sort_order })),
    )
    await store.fetchAll()
    if (store.error) throw new Error()
    notify('分类顺序已保存')
  } catch (e) {
    notify(errorMessage(e, '分类排序失败，请重新加载后重试。'), true)
  } finally {
    sorting.value = false
  }
}
async function sortBookmarks(ids: number[]) {
  if (sorting.value) return
  sorting.value = true
  try {
    await bookmarksApi.updateSortOrder(
      ids.map((id, sort_order) => ({ id, sort_order })),
    )
    await store.fetchAll()
    if (store.error) throw new Error()
    notify('书签顺序已保存')
  } catch (e) {
    notify(errorMessage(e, '书签排序失败，请重新加载后重试。'), true)
  } finally {
    sorting.value = false
    revision.value++
  }
}
async function moveBookmark(
  items: Bookmark[],
  index: number,
  direction: number,
) {
  if (!canSort.value) return
  const ids = items.map((b) => b.id)
  const [id] = ids.splice(index, 1)
  ids.splice(index + direction, 0, id)
  await sortBookmarks(ids)
  await nextTick()
  results.value
    ?.querySelector<HTMLElement>(`[data-id="${id}"] .card-title`)
    ?.focus()
}
let sortables: Sortable[] = [],
  initVersion = 0
async function initSort() {
  const version = ++initVersion
  sortables.forEach((s) => s.destroy())
  sortables = []
  await nextTick()
  if (version !== initVersion || !canSort.value || !results.value) return
  results.value.querySelectorAll<HTMLElement>('[data-group]').forEach((el) =>
    sortables.push(
      new Sortable(el, {
        animation: 150,
        handle: '.drag-handle',
        draggable: '.bookmark-card',
        ghostClass: 'sort-ghost',
        onEnd: (evt) => {
          if (evt.oldIndex === evt.newIndex) return
          const ids = Array.from(el.children).map((node) =>
            Number((node as HTMLElement).dataset.id),
          )
          revision.value++
          sortBookmarks(ids)
        },
      }),
    ),
  )
}
watch(
  () => [
    groups.value,
    store.loading,
    store.viewMode,
    canSort.value,
    revision.value,
  ],
  initSort,
  { flush: 'post' },
)
onUnmounted(() => {
  document.removeEventListener('keydown', keyboard)
  initVersion++
  sortables.forEach((s) => s.destroy())
})
</script>
<style scoped>
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin: 4px 0 26px;
}
.page-head h1 {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.7px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.page-head > div {
  min-width: 0;
}
.page-head > .btn {
  flex-shrink: 0;
  margin-top: 7px;
}
.subtitle {
  font-size: 12px;
  color: var(--color-placeholder);
  margin-top: 8px;
}
.search-field {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 5px 16px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  color: var(--color-placeholder);
}
.search-field:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px #3567d814;
}
.search-field input {
  width: 100%;
  padding: 13px 0;
  border: none;
  background: none;
  font-size: 13px;
  color: var(--color-heading);
  outline: none;
  min-width: 0;
}
.search-field input::-webkit-search-cancel-button {
  display: none;
}
.search-field kbd {
  font: 10px var(--font-family);
  white-space: nowrap;
  border: 1px solid var(--color-border);
  padding: 2px 6px;
  border-radius: 4px;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 24px 0 20px;
}
.result-summary {
  font-size: 12px;
  color: var(--color-tertiary);
  font-variant-numeric: tabular-nums;
}
.result-summary span {
  color: var(--color-placeholder);
}
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}
.sort-select select {
  border: none;
  font-size: 12px;
  background: transparent;
  color: var(--color-tertiary);
  cursor: pointer;
  padding: 7px 4px;
}
.view-switch {
  display: flex;
  gap: 3px;
  background: #eef0f4;
  border-radius: 7px;
  padding: 3px;
}
.view-switch button {
  padding: 6px 8px;
  min-width: 31px;
  border-radius: 5px;
  color: var(--color-placeholder);
  font-size: 12px;
  display: grid;
  place-items: center;
}
.view-switch button[aria-pressed='true'] {
  background: white;
  color: var(--color-primary);
  box-shadow: 0 1px 4px #253c5814;
}
.view-switch svg {
  width: 15px;
  height: 15px;
}
.group + .group {
  margin-top: 25px;
}
.group-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.group-heading h2 {
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.group-heading span {
  font-size: 11px;
  color: var(--color-placeholder);
  font-variant-numeric: tabular-nums;
}
.bookmark-collection {
  display: grid;
  gap: 14px;
}
.bookmark-collection--card {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.bookmark-collection--list,
.bookmark-collection--simple {
  gap: 8px;
}
.notice {
  margin-bottom: 18px;
}
.dismiss {
  float: right;
  font-size: 20px;
  line-height: 20px;
  margin-left: 8px;
}
.empty-state {
  border: 1px dashed var(--color-border-subtle);
  border-radius: 12px;
  background: #ffffff70;
  padding: 65px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
}
.empty-state > svg {
  width: 30px;
  height: 30px;
  color: #859bc0;
}
.empty-state h2 {
  font-size: 18px;
}
.empty-state p {
  font-size: 13px;
  color: var(--color-placeholder);
}
.loading-state {
  padding: 80px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 13px;
  color: var(--color-placeholder);
}
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.sort-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-placeholder);
  padding-top: 30px;
}
.sort-hint svg {
  width: 15px;
  height: 15px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (min-width: 1550px) {
  .bookmark-collection--card {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (max-width: 1150px) {
  .bookmark-collection--card {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 740px) {
  .page-head {
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 0;
  }
  .page-head h1 {
    font-size: 25px;
  }
  .page-head > .btn {
    margin-top: 0;
  }
  .search-field {
    padding: 3px 12px;
  }
  .search-field kbd {
    display: none;
  }
  .toolbar {
    flex-wrap: wrap;
    gap: 12px;
    margin: 20px 0;
  }
  .toolbar-actions {
    gap: 6px;
  }
  .bookmark-collection--card {
    grid-template-columns: 1fr;
  }
  .sort-hint {
    align-items: flex-start;
  }
  .sort-hint svg {
    flex-shrink: 0;
  }
}
</style>
