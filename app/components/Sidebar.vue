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

function selectTab(id: string) {
  emit('update:currentTab', id)
  emit('close')
}
</script>

<template>
  <aside :class="['sidebar', { open: isOpen }]">
    <!-- Brand Header -->
    <div class="sidebar-header">
      <div class="brand-badge">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
        </svg>
      </div>
      <div>
        <div class="brand-title">ET Results</div>
        <div class="brand-subtitle">Admin Suite</div>
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="sidebar-nav">
      <div class="nav-section-title">Main Menu</div>

      <!-- Overview -->
      <button
        :class="['nav-item', { active: currentTab === 'overview' }]"
        @click="selectTab('overview')"
      >
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </span>
        <span>Overview</span>
      </button>

      <!-- Announcements & Results -->
      <button
        :class="['nav-item', { active: currentTab === 'results' }]"
        @click="selectTab('results')"
      >
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </span>
        <span>Announcements</span>
        <span v-if="counts?.results !== undefined" class="nav-badge">
          {{ counts.results }}
        </span>
      </button>

      <!-- Web Publisher -->
      <button
        :class="['nav-item', { active: currentTab === 'publisher' }]"
        @click="selectTab('publisher')"
      >
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </span>
        <span>Live Publisher</span>
      </button>

      <div class="nav-section-title" style="margin-top: 14px;">Telegram Bot</div>

      <!-- Subscribers -->
      <button
        :class="['nav-item', { active: currentTab === 'subscribers' }]"
        @click="selectTab('subscribers')"
      >
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </span>
        <span>Subscribers</span>
        <span v-if="counts?.subscribers !== undefined" class="nav-badge">
          {{ counts.subscribers }}
        </span>
      </button>

      <!-- Broadcast Studio -->
      <button
        :class="['nav-item', { active: currentTab === 'broadcast' }]"
        @click="selectTab('broadcast')"
      >
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 11 18-5-5 18-4-7-9-6z"></path>
            <path d="M13 13 21 6"></path>
          </svg>
        </span>
        <span>Broadcast Studio</span>
      </button>

      <div class="nav-section-title" style="margin-top: 14px;">External Portals</div>
      
      <!-- Render App Link -->
      <a 
        href="https://et-results.onrender.com" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="nav-item"
      >
        <span class="nav-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
        </span>
        <span>Web Results App</span>
        <span style="margin-left: auto; font-size: 11px; opacity: 0.5;">↗</span>
      </a>

      <!-- Telegram Bot Link -->
      <a 
        href="https://t.me/et_results_bot" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="nav-item"
      >
        <span class="nav-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </span>
        <span>@et_results_bot</span>
        <span style="margin-left: auto; font-size: 11px; opacity: 0.5;">↗</span>
      </a>

      <!-- Official ET Careers Link -->
      <a 
        href="https://corporate.ethiopianairlines.com/AboutEthiopian/careers/results" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="nav-item"
      >
        <span class="nav-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        </span>
        <span>ET Official Careers</span>
        <span style="margin-left: auto; font-size: 11px; opacity: 0.5;">↗</span>
      </a>
    </nav>

    <!-- Sidebar Bottom Footer -->
    <div class="sidebar-footer">
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button class="btn btn-secondary btn-sm" style="width: 100%; justify-content: flex-start;" @click="emit('openHealth')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span>System Health</span>
        </button>

        <button class="btn btn-danger btn-sm" style="width: 100%; justify-content: flex-start;" @click="emit('logout')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Lock Dashboard</span>
        </button>
      </div>
    </div>
  </aside>
</template>
