import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  bookmarksApi,
  type Bookmark,
  type BookmarkCreate,
} from '@/api/bookmarks'
import { categoriesApi, type Category } from '@/api/categories'
import { errorMessage } from '@/utils/feedback'

export type ViewMode = 'card' | 'list' | 'simple'
export type SortMode = 'manual' | 'title' | 'recent'
export const useBookmarksStore = defineStore('bookmarks', () => {
  const bookmarks = ref<Bookmark[]>([])
  const categories = ref<Category[]>([])
  const activeCategoryId = ref<number | null>(null)
  const loading = ref(false)
  const error = ref('')
  const search = ref('')
  const sortMode = ref<SortMode>('manual')
  const savedView = localStorage.getItem('view_mode')
  const viewMode = ref<ViewMode>(
    savedView === 'list' || savedView === 'simple' ? savedView : 'card',
  )
  const isSimpleMode = computed(() => viewMode.value === 'simple')
  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
    localStorage.setItem('view_mode', mode)
  }
  function toggleViewMode() {
    setViewMode(isSimpleMode.value ? 'card' : 'simple')
  }
  const filteredBookmarks = computed(() => {
    const query = search.value.trim().toLocaleLowerCase()
    const list = bookmarks.value.filter(
      (b) =>
        (activeCategoryId.value === null ||
          b.category_id === activeCategoryId.value) &&
        (!query ||
          [
            b.title,
            b.url,
            b.description,
            categories.value.find((c) => c.id === b.category_id)?.name,
          ]
            .join(' ')
            .toLocaleLowerCase()
            .includes(query)),
    )
    if (sortMode.value === 'title')
      list.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
    if (sortMode.value === 'recent')
      list.sort(
        (a, b) =>
          Date.parse(b.created_at) - Date.parse(a.created_at) || b.id - a.id,
      )
    return list
  })
  async function fetchAll() {
    loading.value = true
    error.value = ''
    try {
      const [bRes, cRes] = await Promise.all([
        bookmarksApi.list(),
        categoriesApi.list(),
      ])
      bookmarks.value = bRes.data
      categories.value = cRes.data
      if (
        activeCategoryId.value !== null &&
        !categories.value.some((c) => c.id === activeCategoryId.value)
      )
        activeCategoryId.value = null
    } catch (e) {
      error.value = errorMessage(e, '暂时无法加载书签，请检查连接后重试。')
      bookmarks.value = []
      categories.value = []
    } finally {
      loading.value = false
    }
  }
  async function fetchCategories() {
    categories.value = (await categoriesApi.list()).data
  }
  async function createCategory(name: string) {
    const res = await categoriesApi.create(name)
    categories.value.push(res.data)
    return res.data
  }
  async function updateCategory(id: number, name: string) {
    const res = await categoriesApi.update(id, { name })
    categories.value = categories.value.map((c) => (c.id === id ? res.data : c))
    return res.data
  }
  async function deleteCategory(id: number) {
    // The current SQLite API does not enable foreign-key SET NULL on all
    // deployments. Persist reassignment through the existing owned-bookmark API
    // before deletion, so a refresh cannot strand the category's bookmarks.
    const current = await bookmarksApi.list(id)
    for (const bookmark of current.data) {
      await updateBookmark(bookmark.id, { category_id: null })
    }
    await categoriesApi.remove(id)
    categories.value = categories.value.filter((c) => c.id !== id)
    bookmarks.value = bookmarks.value.map((b) =>
      b.category_id === id ? { ...b, category_id: null } : b,
    )
    if (activeCategoryId.value === id) activeCategoryId.value = null
  }
  async function createBookmark(data: BookmarkCreate) {
    const res = await bookmarksApi.create(data)
    bookmarks.value.push(res.data)
    bookmarks.value.sort(
      (a, b) =>
        a.sort_order - b.sort_order ||
        Date.parse(a.created_at) - Date.parse(b.created_at) ||
        a.id - b.id,
    )
    return res.data
  }
  async function updateBookmark(id: number, data: Partial<BookmarkCreate>) {
    const res = await bookmarksApi.update(id, data)
    bookmarks.value = bookmarks.value.map((b) => (b.id === id ? res.data : b))
    return res.data
  }
  async function deleteBookmark(id: number) {
    await bookmarksApi.remove(id)
    bookmarks.value = bookmarks.value.filter((b) => b.id !== id)
  }
  function setActiveCategory(id: number | null) {
    activeCategoryId.value = id
  }
  return {
    bookmarks,
    categories,
    activeCategoryId,
    loading,
    error,
    search,
    sortMode,
    viewMode,
    isSimpleMode,
    filteredBookmarks,
    fetchAll,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    setActiveCategory,
    toggleViewMode,
    setViewMode,
  }
})
