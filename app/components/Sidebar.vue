<script setup lang="ts">
defineProps<{
  currentTab: string
  isOpen: boolean
  counts?: {
    subscribers?: number
    results?: number
  }
}>()

const emit = defineEmits<{
  (e: 'update:currentTab', tab: string): void
  (e: 'close'): void
  (e: 'openHealth'): void
  (e: 'logout'): void
}>()

const navItems = [
  { id: 'overview', label: 'Overview & Stats', icon: '📊' },
  { id: 'results', label: 'Announcements & Results', icon: '📋' },
  { id: 'publisher', label: 'Web Publisher', icon: '✍️', badge: 'New' },
  { id: 'subscribers', label: 'Bot Subscribers', icon: '👥' },
  { id: 'broadcast', label: 'Broadcast Studio', icon: '📣' }
]

function selectTab(id: string) {
  emit('update:currentTab', id)
  emit('close')
}
</script>

<template>
  <aside :class="['sidebar', { open: isOpen }]">
    <div class="sidebar-header">
      <div class="brand-badge">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="#e5a823" stroke-width="1.8"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="#10b981" stroke-width="1.8"/>
          <line x1="12" y1="22.08" x2="12" y2="12" stroke="#e5a823" stroke-width="1.8"/>
        </svg>
      </div>
      <div>
        <div class="brand-title">ET Results</div>
        <div class="brand-subtitle">Admin Suite</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section-title">Core Management</div>

      <button
        v-for="item in navItems"
        :key="item.id"
        :class="['nav-item', { active: currentTab === item.id }]"
        @click="selectTab(item.id)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
        <span v-if="item.id === 'subscribers' && counts?.subscribers !== undefined" class="nav-badge">
          {{ counts.subscribers }}
        </span>
        <span v-else-if="item.id === 'results' && counts?.results !== undefined" class="nav-badge">
          {{ counts.results }}
        </span>
        <span v-else-if="item.badge" class="badge badge-gold" style="margin-left: auto; font-size: 10px; padding: 1px 6px;">
          {{ item.badge }}
        </span>
      </button>

      <div class="nav-section-title" style="margin-top: 14px;">External Links</div>
      
      <a 
        href="https://et-results.onrender.com" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="nav-item"
        style="text-decoration: none;"
      >
        <span class="nav-icon">🌐</span>
        <span>Render Web Viewer</span>
        <span style="margin-left: auto; font-size: 11px; opacity: 0.6;">↗</span>
      </a>

      <a 
        href="https://t.me/et_results_bot" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="nav-item"
        style="text-decoration: none;"
      >
        <span class="nav-icon">✈️</span>
        <span>Telegram Bot</span>
        <span style="margin-left: auto; font-size: 11px; opacity: 0.6;">↗</span>
      </a>

      <a 
        href="https://corporate.ethiopianairlines.com/AboutEthiopian/careers/results" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="nav-item"
        style="text-decoration: none;"
      >
        <span class="nav-icon">🏛️</span>
        <span>Official ET Careers</span>
        <span style="margin-left: auto; font-size: 11px; opacity: 0.6;">↗</span>
      </a>
    </nav>

    <div class="sidebar-footer">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button class="btn btn-secondary btn-sm" style="width: 100%; justify-content: flex-start;" @click="emit('openHealth')">
          <span>🩺</span>
          <span>System Health Check</span>
        </button>

        <button class="btn btn-danger btn-sm" style="width: 100%; justify-content: flex-start;" @click="emit('logout')">
          <span>🔒</span>
          <span>Lock / Sign Out</span>
        </button>
      </div>
    </div>
  </aside>
</template>
