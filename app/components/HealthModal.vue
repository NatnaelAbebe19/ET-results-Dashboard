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
    <div class="modal-card" style="max-width: 580px;">
      <div class="modal-header">
        <h2 style="font-size: 16px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary);">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span>System & Cloud Services Monitor</span>
        </h2>
        <button class="btn btn-secondary btn-sm" @click="emit('close')" style="padding: 5px 9px;">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="isChecking && !healthData" style="text-align: center; padding: 40px 0;">
          <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid rgba(70,95,255,0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <p class="text-muted" style="margin-top: 10px; font-size: 13px;">Pinging Neon DB, Telegram API, and Render...</p>
        </div>

        <div v-else-if="healthData" style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Overall Status (Taildrops clean pill banner) -->
          <div 
            style="padding: 14px 18px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between;"
            :style="{ 
              background: healthData.overallStatus === 'operational' ? 'var(--success-light)' : 'var(--warning-light)',
              border: healthData.overallStatus === 'operational' ? '1px solid var(--success-border)' : '1px solid var(--warning-border)'
            }"
          >
            <div>
              <div style="font-weight: 700; font-size: 14px;" :class="healthData.overallStatus === 'operational' ? 'text-green' : 'text-gold'">
                {{ healthData.overallStatus === 'operational' ? '● All Cloud Services Connected & Healthy' : '⚠️ System Status Degraded' }}
              </div>
              <div class="text-muted" style="font-size: 11.5px; margin-top: 2px;">
                Checked at {{ new Date(healthData.timestamp).toLocaleTimeString() }}
              </div>
            </div>

            <button class="btn btn-secondary btn-sm" :disabled="isChecking" @click="checkHealth">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ 'spin-animation': isChecking }">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>Re-check</span>
            </button>
          </div>

          <!-- Service 1: Neon DB -->
          <div class="card" style="padding: 14px 18px; background: var(--bg-surface-elevated);">
            <div class="flex-between">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 34px; height: 34px; border-radius: var(--radius-sm); background: var(--primary-subtle); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700;">
                  DB
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 13.5px; color: var(--text-primary);">{{ healthData.services.neonDatabase.name }}</div>
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
          <div class="card" style="padding: 14px 18px; background: var(--bg-surface-elevated);">
            <div class="flex-between">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 34px; height: 34px; border-radius: var(--radius-sm); background: var(--primary-subtle); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700;">
                  TG
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 13.5px; color: var(--text-primary);">{{ healthData.services.telegramBot.name }}</div>
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
          <div class="card" style="padding: 14px 18px; background: var(--bg-surface-elevated);">
            <div class="flex-between">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 34px; height: 34px; border-radius: var(--radius-sm); background: var(--primary-subtle); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700;">
                  WEB
                </div>
                <div>
                  <div style="font-weight: 600; font-size: 13.5px; color: var(--text-primary);">{{ healthData.services.renderWebApp.name }}</div>
                  <div class="text-muted" style="font-size: 11.5px;">
                    https://et-results.onrender.com
                  </div>
                </div>
              </div>

              <div class="flex-gap-2">
                <span class="font-mono text-muted" style="font-size: 11.5px;">{{ healthData.services.renderWebApp.latencyMs }}ms</span>
                <span :class="['badge', healthData.services.renderWebApp.status === 'healthy' ? 'badge-green' : 'badge-red']">
                  {{ healthData.services.renderWebApp.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-primary btn-sm" @click="emit('close')">
          Done
        </button>
      </div>
    </div>
  </div>
</template>
