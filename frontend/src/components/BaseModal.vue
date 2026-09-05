<template>
  <Teleport to="body"
    ><dialog
      ref="dialog"
      class="dialog"
      tabindex="-1"
      @keydown="trapFocus"
      :aria-labelledby="titleId"
      :aria-busy="busy"
      @cancel.prevent="close"
      @click="backdropClick"
    >
      <div class="dialog-header">
        <h2 :id="titleId">{{ title }}</h2>
        <button
          class="icon-button"
          :disabled="busy"
          aria-label="关闭弹窗"
          @click="close"
        >
          <AppIcon name="close" />
        </button>
      </div>
      <div class="dialog-body"><slot /></div></dialog
  ></Teleport>
</template>
<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted, useId } from 'vue'
import AppIcon from './AppIcon.vue'
const props = defineProps<{
  modelValue: boolean
  title: string
  busy?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const dialog = ref<HTMLDialogElement | null>(null),
  titleId = useId()
let previous: HTMLElement | null = null
function trapFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab' || !dialog.value) return
  const elements = Array.from(
    dialog.value.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
    ),
  ).filter((el) => el.getClientRects().length)
  const first = elements[0],
    last = elements[elements.length - 1]
  if (!first) {
    event.preventDefault()
    dialog.value.focus()
    return
  }
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      document.activeElement === dialog.value)
  ) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
function close() {
  if (!props.busy) emit('update:modelValue', false)
}
function backdropClick(e: MouseEvent) {
  const el = dialog.value
  if (!el || e.target !== el) return
  const r = el.getBoundingClientRect()
  if (
    e.clientX < r.left ||
    e.clientX > r.right ||
    e.clientY < r.top ||
    e.clientY > r.bottom
  )
    close()
}
watch(
  () => props.modelValue,
  async (open) => {
    await nextTick()
    if (open && !dialog.value?.open) {
      previous = document.activeElement as HTMLElement
      dialog.value?.showModal()
      dialog.value
        ?.querySelector<HTMLElement>('input, select, textarea')
        ?.focus()
    } else if (!open && dialog.value?.open) {
      dialog.value.close()
      if (previous?.isConnected) previous.focus()
    }
  },
  { immediate: true },
)
onUnmounted(() => dialog.value?.close())
</script>
<style scoped>
.dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  width: 480px;
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 0;
  background: white;
  color: var(--color-body);
  box-shadow: 0 25px 100px #1f344128;
}
.dialog::backdrop {
  background: var(--color-overlay);
}
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px 12px;
}
.dialog-header h2 {
  font-size: 18px;
  font-weight: 600;
}
.dialog-body {
  padding: 8px 24px 24px;
  overflow-wrap: anywhere;
}
@media (max-width: 500px) {
  .dialog-header {
    padding: 18px 18px 12px;
  }
  .dialog-body {
    padding: 8px 18px 20px;
  }
}
</style>
