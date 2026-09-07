<template>
  <BaseModal
    :model-value="modelValue"
    :title="bookmark ? '编辑书签' : '添加书签'"
    :busy="loading"
    @update:model-value="close"
    ><form class="form" @submit.prevent="submit">
      <BaseInput
        v-model="form.title"
        label="标题"
        placeholder="网站名称"
        :error="errors.title"
        :disabled="loading"
      /><BaseInput
        v-model="form.url"
        label="网址"
        placeholder="https://example.com"
        :error="errors.url"
        :disabled="loading"
      /><BaseInput
        v-model="form.description"
        label="描述（可选）"
        placeholder="这个网站能帮你做什么"
        :disabled="loading"
      />
      <div class="select-field">
        <label for="bookmark-category">分类</label
        ><select
          id="bookmark-category"
          v-model="form.category_id"
          :disabled="loading"
        >
          <option :value="null">未分类</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>
      <p v-if="saveError" class="notice error" role="alert">{{ saveError }}</p>
      <div class="actions">
        <BaseButton variant="secondary" :disabled="loading" @click="close"
          >取消</BaseButton
        ><BaseButton type="submit" :loading="loading">{{
          bookmark ? '保存' : '添加'
        }}</BaseButton>
      </div>
    </form></BaseModal
  >
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseInput from './BaseInput.vue'
import BaseButton from './BaseButton.vue'
import type { Bookmark, BookmarkCreate } from '@/api/bookmarks'
import type { Category } from '@/api/categories'
import { errorMessage, safeWebUrl } from '@/utils/feedback'
const props = defineProps<{
  modelValue: boolean
  bookmark?: Bookmark | null
  categories: Category[]
  defaultCategory?: number | null
  saveAction: (data: BookmarkCreate) => Promise<unknown>
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const loading = ref(false),
  saveError = ref('')
const form = ref({
  title: '',
  url: '',
  description: '',
  category_id: null as number | null,
})
const errors = ref({ title: '', url: '' })
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = {
        title: props.bookmark?.title || '',
        url: props.bookmark?.url || '',
        description: props.bookmark?.description || '',
        category_id: props.bookmark
          ? props.bookmark.category_id
          : (props.defaultCategory ?? null),
      }
      errors.value = { title: '', url: '' }
      saveError.value = ''
    }
  },
)
async function submit() {
  if (loading.value) return
  errors.value = {
    title: form.value.title.trim() ? '' : '请输入标题',
    url: safeWebUrl(form.value.url.trim())
      ? ''
      : '请输入有效的 http 或 https 网址',
  }
  if (errors.value.title || errors.value.url) return
  loading.value = true
  saveError.value = ''
  try {
    await props.saveAction({
      ...form.value,
      title: form.value.title.trim(),
      url: form.value.url.trim(),
      description: form.value.description.trim(),
    })
    emit('update:modelValue', false)
  } catch (e) {
    saveError.value = errorMessage(e, '书签保存失败，请重试。')
  } finally {
    loading.value = false
  }
}
function close() {
  if (!loading.value) emit('update:modelValue', false)
}
</script>
<style scoped>
.form {
  display: grid;
  gap: 18px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 6px;
}
.select-field {
  display: grid;
  gap: 7px;
  font-size: 12px;
  font-weight: 500;
}
select {
  width: 100%;
  padding: 9px 11px;
  font-size: 13px;
  line-height: 20px;
  min-height: 40px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 7px;
  background: white;
  color: var(--color-heading);
}
</style>
