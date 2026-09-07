<template>
  <div class="field">
    <label v-if="label" :for="inputId">{{ label }}</label
    ><input
      :id="inputId"
      v-bind="$attrs"
      :type="type || 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${inputId}-error` : undefined"
      @input="
        $emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
    /><span
      v-if="error"
      :id="`${inputId}-error`"
      class="field-error"
      role="alert"
      >{{ error }}</span
    >
  </div>
</template>
<script setup lang="ts">
import { useId } from 'vue'
defineOptions({ inheritAttrs: false })
defineProps<{
  label?: string
  modelValue: string
  type?: string
  placeholder?: string
  error?: string
}>()
defineEmits<{ 'update:modelValue': [value: string] }>()
const inputId = useId()
</script>
<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.field label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-heading);
}
input {
  width: 100%;
  border: 1px solid var(--color-border-subtle);
  border-radius: 7px;
  background: white;
  padding: 9px 11px;
  color: var(--color-heading);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  min-height: 40px;
}
input::placeholder {
  color: var(--color-placeholder);
}
input:focus {
  border-color: var(--color-primary);
}
input[aria-invalid='true'] {
  border-color: var(--color-error);
}
.field-error {
  font-size: 12px;
  color: var(--color-error);
}
</style>
