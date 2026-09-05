<template>
  <BaseModal
    :model-value="modelValue"
    :title="title"
    :busy="loading"
    @update:model-value="$emit('update:modelValue', $event)"
    ><p class="message">{{ message }}</p>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <div class="actions">
      <BaseButton
        variant="secondary"
        :disabled="loading"
        @click="$emit('update:modelValue', false)"
        >取消</BaseButton
      ><BaseButton
        :variant="danger === false ? 'primary' : 'danger'"
        :loading="loading"
        @click="$emit('confirm')"
        >{{ confirmLabel || '确认删除' }}</BaseButton
      >
    </div></BaseModal
  >
</template>
<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
defineProps<{
  modelValue: boolean
  title: string
  message: string
  loading?: boolean
  error?: string
  confirmLabel?: string
  danger?: boolean
}>()
defineEmits<{ 'update:modelValue': [value: boolean]; confirm: [] }>()
</script>
<style scoped>
.message {
  font-size: 14px;
  line-height: 1.8;
  overflow-wrap: anywhere;
  margin-bottom: 20px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 20px;
}
</style>
