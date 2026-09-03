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

const tabTitles: Record<string, { title: string; category: string }> = {
  overview: { title: 'Overview & Telemetry', category: 'Dashboard' },
  results: { title: 'Announcements & Results', category: 'Management' },
  publisher: { title: 'Announcement Publisher', category: 'Tools' },
  subscribers: { title: 'Telegram Subscribers', category: 'Audience' },
  broadcast: { title: 'Broadcast Studio', category: 'Dispatch' }
}

const activeInfo = computed(() => {
  return tabTitles[props.currentTab] || { title: 'Dashboard', category: 'Admin' }
})
const { theme, toggleTheme } = useTheme()
</script>

<template>
  <header class="top-header">
    <div class="header-left">
      <button class="mobile-menu-btn" @click="emit('toggleSidebar')" aria-label="Toggle menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <div>
        <div class="header-breadcrumb">
          <span>{{ activeInfo.category }}</span>
          <span style="opacity: 0.5;">/</span>
          <span class="crumb-active">{{ activeInfo.title }}</span>
        </div>
        <h1 class="page-title" style="margin-top: 2px;">
          {{ activeInfo.title }}
        </h1>
      </div>
    </div>

    <div class="header-right">
      <!-- Dark / Day Mode Toggle Button (TailAdmin / Taildrops style) -->
      <button 
        class="btn btn-secondary btn-sm"
        @click="toggleTheme"
        :title="theme === 'dark' ? 'Switch to Day / Light Mode' : 'Switch to Dark Mode'"
        style="padding: 7px 11px; display: flex; align-items: center; gap: 6px;"
      >
        <!-- Sun icon (shown in dark mode to switch to day) -->
        <svg 
          v-if="theme === 'dark'" 
          width="15" 
          height="15" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          style="color: #fbbf24;"
        >
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>

        <!-- Moon icon (shown in light mode to switch to dark) -->
        <svg 
          v-else 
          width="15" 
          height="15" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          style="color: var(--primary);"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
        <span class="hide-mobile" style="font-size: 12px; font-weight: 500;">
          {{ theme === 'dark' ? 'Day' : 'Dark' }}
        </span>
      </button>

      <!-- Sync / Refresh Button -->
      <button 
        class="btn btn-secondary btn-sm" 
        :disabled="isRefreshing" 
        @click="emit('refresh')"
        title="Synchronize data from Neon DB"
      >
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          :class="{ 'spin-animation': isRefreshing }"
        >
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
        </svg>
        <span class="hide-mobile">Sync</span>
      </button>

      <!-- Live Service Health Status Pill (TailAdmin status style) -->
      <button 
        :class="['health-pill', healthStatus === 'degraded' ? 'degraded' : healthStatus === 'down' ? 'down' : '']"
        @click="emit('openHealth')"
        title="Click to inspect live services status"
      >
        <span class="pulse-dot"></span>
        <span class="hide-mobile">{{ healthStatus === 'down' ? 'System Offline' : healthStatus === 'degraded' ? 'Degraded' : 'All Systems Operational' }}</span>
        <span class="show-mobile-only">{{ healthStatus === 'down' ? 'Offline' : 'Online' }}</span>
      </button>

      <!-- Lock / Sign Out Button -->
      <button 
        class="btn btn-secondary btn-sm" 
        @click="emit('logout')" 
        title="Lock Dashboard / Sign Out"
        style="padding: 7px 11px;"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.spin-animation {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.show-mobile-only {
  display: none;
}

@media (max-width: 640px) {
  .hide-mobile {
    display: none;
  }
  .show-mobile-only {
    display: inline;
  }
}
</style>
