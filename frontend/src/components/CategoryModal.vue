<template>
  <BaseModal
    :model-value="modelValue"
    :title="category ? '编辑分类' : '新建分类'"
    :busy="loading"
    @update:model-value="close"
    ><form class="form" @submit.prevent="submit">
      <BaseInput
        v-model="name"
        label="分类名称"
        placeholder="例如：工作工具、投资研究"
        :error="error"
        :disabled="loading"
      />
      <p v-if="saveError" class="notice error" role="alert">{{ saveError }}</p>
      <div class="actions">
        <BaseButton variant="secondary" :disabled="loading" @click="close"
          >取消</BaseButton
        ><BaseButton type="submit" :loading="loading">{{
          category ? '保存' : '创建'
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
import type { Category } from '@/api/categories'
import { errorMessage } from '@/utils/feedback'
const props = defineProps<{
  modelValue: boolean
  category?: Category | null
  saveAction: (name: string) => Promise<unknown>
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const name = ref(''),
  error = ref(''),
  saveError = ref(''),
  loading = ref(false)
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      name.value = props.category?.name || ''
      error.value = ''
      saveError.value = ''
    }
  },
)
async function submit() {
  if (loading.value) return
  error.value = name.value.trim() ? '' : '请输入分类名称'
  if (error.value) return
  loading.value = true
  saveError.value = ''
  try {
    await props.saveAction(name.value.trim())
    emit('update:modelValue', false)
  } catch (e) {
    saveError.value = errorMessage(e, '分类保存失败，请重试。')
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
}
</style>
