<script setup lang="ts">
const props = defineProps<{
  currentTab: string
  healthStatus?: 'operational' | 'degraded' | 'down' | 'loading'
  isRefreshing?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
  (e: 'openHealth'): void
  (e: 'refresh'): void
  (e: 'logout'): void
}>()

const tabTitles: Record<string, { title: string; icon: string; desc: string }> = {
  overview: { title: 'Executive Overview', icon: '📊', desc: 'Real-time telemetry and database analytics' },
  results: { title: 'Announcements & Results', icon: '📋', desc: 'Tracked job positions and candidate lists' },
  publisher: { title: 'Live Announcement Publisher', icon: '✍️', desc: 'Parse announcement text & publish to Neon DB' },
  subscribers: { title: 'Telegram Subscribers', icon: '👥', desc: 'Active bot users receiving instant notifications' },
  broadcast: { title: 'Telegram Broadcast Studio', icon: '📣', desc: 'Compose and dispatch alerts to bot subscribers' }
}

const activeInfo = computed(() => {
  return tabTitles[props.currentTab] || { title: 'Dashboard', icon: '✈️', desc: 'Ethiopian Airlines Results' }
})
</script>

<template>
  <header class="top-header">
    <div class="header-left">
      <button class="mobile-menu-btn" @click="emit('toggleSidebar')" aria-label="Toggle menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <div>
        <h1 class="page-title">
          <span>{{ activeInfo.icon }}</span>
          <span>{{ activeInfo.title }}</span>
        </h1>
      </div>
    </div>

    <div class="header-right">
      <button 
        class="btn btn-secondary btn-sm" 
        :disabled="isRefreshing" 
        @click="emit('refresh')"
        title="Refresh Data"
      >
        <span :style="{ display: 'inline-block', transform: isRefreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s' }">
          🔄
        </span>
        <span class="hide-mobile">Refresh</span>
      </button>

      <!-- Live Service Health Status Pill -->
      <button 
        :class="['health-pill', healthStatus === 'degraded' ? 'degraded' : healthStatus === 'down' ? 'down' : '']"
        @click="emit('openHealth')"
        title="Click to view live service status"
      >
        <span class="pulse-dot"></span>
        <span>{{ healthStatus === 'down' ? 'System Offline' : healthStatus === 'degraded' ? 'Degraded' : 'All Systems Operational' }}</span>
      </button>

      <button 
        class="btn btn-secondary btn-sm" 
        @click="emit('logout')" 
        title="Lock Dashboard"
        style="padding: 7px 10px;"
      >
        <span>🔒</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
@media (max-width: 640px) {
  .hide-mobile {
    display: none;
  }
}
</style>
