<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toast', msg: string, type: 'success' | 'error' | 'info'): void
}>()

const healthData = ref<any>(null)
const isChecking = ref(false)

async function checkHealth() {
  isChecking.value = true
  try {
    const res: any = await $fetch('/api/system/health')
    healthData.value = res
  } catch (err: any) {
    emit('toast', `Health check failed: ${err.message}`, 'error')
  } finally {
    isChecking.value = false
  }
}

onMounted(() => {
  checkHealth()
})
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-dialog">
      <div class="modal-header">
        <h2 style="font-size: 16.5px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <span>🩺</span>
          <span>System & Cloud Services Monitor</span>
        </h2>
        <button class="btn btn-secondary btn-sm" @click="emit('close')" style="padding: 4px 8px;">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="isChecking && !healthData" style="text-align: center; padding: 30px 0;">
          <div style="font-size: 28px; animation: pulse 1s infinite;">🩺</div>
          <p class="text-muted" style="margin-top: 8px;">Pinging Neon DB, Telegram API, and Render...</p>
        </div>

        <div v-else-if="healthData" style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Overall Status -->
          <div 
            style="padding: 14px 18px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between;"
            :style="{ 
              background: healthData.overallStatus === 'operational' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(229, 168, 35, 0.1)',
              border: healthData.overallStatus === 'operational' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(229, 168, 35, 0.3)'
            }"
          >
            <div>
              <div style="font-weight: 700; font-size: 14.5px;" :class="healthData.overallStatus === 'operational' ? 'text-green' : 'text-gold'">
                {{ healthData.overallStatus === 'operational' ? '● All Cloud Services Connected & Healthy' : '⚠️ System Status Degraded' }}
              </div>
              <div class="text-muted" style="font-size: 11.5px; margin-top: 2px;">
                Checked at: {{ new Date(healthData.timestamp).toLocaleTimeString() }}
              </div>
            </div>

            <button class="btn btn-secondary btn-sm" :disabled="isChecking" @click="checkHealth">
              <span>🔄</span>
              <span>Re-check</span>
            </button>
          </div>

          <!-- Service 1: Neon DB -->
          <div class="card" style="padding: 14px; background: rgba(0, 0, 0, 0.2);">
            <div class="flex-between">
              <div class="flex-gap-2">
                <span>🐘</span>
                <div>
                  <div style="font-weight: 600; font-size: 13.5px;">{{ healthData.services.neonDatabase.name }}</div>
                  <div class="text-muted" style="font-size: 11.5px;">AWS us-east-2 pooler endpoint</div>
                </div>
              </div>

              <div class="flex-gap-2">
                <span class="font-mono text-muted" style="font-size: 11.5px;">{{ healthData.services.neonDatabase.latencyMs }}ms</span>
                <span :class="['badge', healthData.services.neonDatabase.status === 'healthy' ? 'badge-green' : 'badge-red']">
                  {{ healthData.services.neonDatabase.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Service 2: Telegram Bot -->
          <div class="card" style="padding: 14px; background: rgba(0, 0, 0, 0.2);">
            <div class="flex-between">
              <div class="flex-gap-2">
                <span>✈️</span>
                <div>
                  <div style="font-weight: 600; font-size: 13.5px;">{{ healthData.services.telegramBot.name }}</div>
                  <div class="text-muted" style="font-size: 11.5px;">
                    Bot: @{{ healthData.services.telegramBot.username || 'et_results_bot' }}
                  </div>
                </div>
              </div>

              <div class="flex-gap-2">
                <span class="font-mono text-muted" style="font-size: 11.5px;">{{ healthData.services.telegramBot.latencyMs }}ms</span>
                <span :class="['badge', healthData.services.telegramBot.status === 'healthy' ? 'badge-green' : 'badge-red']">
                  {{ healthData.services.telegramBot.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Service 3: Render Web App -->
          <div class="card" style="padding: 14px; background: rgba(0, 0, 0, 0.2);">
            <div class="flex-between">
              <div class="flex-gap-2">
                <span>🌐</span>
                <div>
                  <div style="font-weight: 600; font-size: 13.5px;">{{ healthData.services.renderWebService.name }}</div>
                  <div class="text-muted" style="font-size: 11.5px;">{{ healthData.services.renderWebService.url }}</div>
                </div>
              </div>

              <div class="flex-gap-2">
                <span class="font-mono text-muted" style="font-size: 11.5px;">{{ healthData.services.renderWebService.latencyMs }}ms</span>
                <span :class="['badge', healthData.services.renderWebService.status === 'healthy' ? 'badge-green' : 'badge-red']">
                  HTTP {{ healthData.services.renderWebService.statusCode || 'down' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-primary btn-sm" @click="emit('close')">Done</button>
      </div>
    </div>
  </div>
</template>
