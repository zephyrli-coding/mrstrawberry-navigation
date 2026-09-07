<template>
  <button
    :type="type"
    :class="[
      'btn',
      `btn--${variant}`,
      { 'btn--full': full, 'btn--loading': loading },
    ]"
    :disabled="loading || disabled"
  >
    <span v-if="loading" class="btn__spinner" />
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'text' | 'danger'
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
    full?: boolean
  }>(),
  { variant: 'primary', type: 'button' },
)
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: var(--cu-control-height);
  padding: 8px 14px;
  border-radius: var(--radius-btn);
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  font-family: var(--font-family);
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background-color var(--transition),
    color var(--transition),
    border-color var(--transition);
  white-space: nowrap;
}

.btn--full {
  width: 100%;
}

.btn--primary {
  background: var(--color-primary);
  color: #fff;
}
.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn--secondary {
  background: var(--color-surface);
  color: var(--color-body);
  border-color: var(--color-border-subtle);
}
.btn--secondary:hover:not(:disabled) {
  border-color: var(--color-body);
}

.btn--text {
  background: transparent;
  color: var(--color-tertiary);
  min-height: unset;
  padding: 4px 8px;
}
.btn--text:hover:not(:disabled) {
  color: var(--color-heading);
}

.btn--danger {
  background: var(--color-error);
  color: #fff;
}
.btn--danger:hover:not(:disabled) {
  background: #b71c1c;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.btn--secondary .btn__spinner,
.btn--text .btn__spinner {
  border-color: rgba(0, 0, 0, 0.2);
  border-top-color: var(--color-body);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
