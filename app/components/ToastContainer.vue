<script setup lang="ts">
export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

defineProps<{
  toasts: ToastItem[]
}>()

const emit = defineEmits<{
  (e: 'dismiss', id: number): void
}>()
</script>

<template>
  <div class="toast-container">
    <div 
      v-for="toast in toasts" 
      :key="toast.id" 
      :class="['toast', toast.type]"
    >
      <span style="font-size: 16px;">
        {{ toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️' }}
      </span>
      <div style="flex: 1; font-size: 13px; font-weight: 500; color: #fff;">
        {{ toast.message }}
      </div>
      <button 
        @click="emit('dismiss', toast.id)" 
        style="opacity: 0.6; cursor: pointer; color: #fff; font-size: 12px; margin-left: 8px;"
      >
        ✕
      </button>
    </div>
  </div>
</template>
