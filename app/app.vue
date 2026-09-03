<script setup lang="ts">
import type { ToastItem } from '~/components/ToastContainer.vue'

const config = useRuntimeConfig()
const renderBaseUrl = config.public.renderAppUrl || 'https://et-results.onrender.com'

// State
const isAuthenticated = ref(true) // assume true until auth check returns
const currentTab = ref('overview')
const isSidebarOpen = ref(false)
const isRefreshing = ref(false)

// Global 401 handler — called by any child component that receives Unauthorized
function handleUnauthorized() {
  isAuthenticated.value = false
}
provide('handleUnauthorized', handleUnauthorized)

// Modals
const viewingResultId = ref<string | null>(null)
const isHealthModalOpen = ref(false)
const directChatId = ref('')

// Overview telemetry
const overviewData = ref<any>(null)
const isOverviewLoading = ref(false)
const healthStatus = ref<'operational' | 'degraded' | 'down' | 'loading'>('loading')

// Toasts
const toasts = ref<ToastItem[]>([])
let toastCounter = 0

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const id = ++toastCounter
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    dismissToast(id)
  }, 4500)
}

function dismissToast(id: number) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// Authentication Check
async function checkAuth() {
  try {
    const res: any = await $fetch('/api/auth')
    isAuthenticated.value = res.authenticated
    if (isAuthenticated.value) {
      loadOverviewData()
      checkSystemHealth()
    }
  } catch {
    isAuthenticated.value = false
  }
}

// Load Overview Stats
async function loadOverviewData() {
  isOverviewLoading.value = true
  try {
    const res: any = await $fetch('/api/overview')
    overviewData.value = res
  } catch (err: any) {
    if (err.statusCode === 401) {
      isAuthenticated.value = false
    } else {
      showToast(`Could not load stats: ${err.message}`, 'error')
    }
  } finally {
    isOverviewLoading.value = false
  }
}

// Quick Health Ping
async function checkSystemHealth() {
  try {
    const res: any = await $fetch('/api/system/health')
    healthStatus.value = res.overallStatus
  } catch {
    healthStatus.value = 'degraded'
  }
}

async function handleRefresh() {
  isRefreshing.value = true
  await Promise.all([
    loadOverviewData(),
    checkSystemHealth()
  ])
  isRefreshing.value = false
  showToast('Dashboard telemetry synchronized', 'success')
}

async function handleLogout() {
  try {
    await $fetch('/api/auth', { method: 'DELETE' })
  } catch (e) {
    // ignore
  }
  isAuthenticated.value = false
  showToast('Signed out of admin dashboard', 'info')
}

function handleDirectMessage(chatId: string) {
  directChatId.value = chatId
  currentTab.value = 'broadcast'
}

const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
  checkAuth()
})
</script>

<template>
  <div class="app-container">
    <!-- Login Gate if unauthenticated -->
    <LoginModal 
      v-if="!isAuthenticated" 
      @authenticated="checkAuth" 
      @toast="showToast" 
    />

    <!-- Main Dashboard when authenticated -->
    <template v-else>
      <!-- Sidebar Navigation -->
      <Sidebar 
        v-model:currentTab="currentTab"
        :isOpen="isSidebarOpen"
        :counts="{
          subscribers: overviewData?.stats?.totalSubscribers,
          results: overviewData?.stats?.totalTrackedResults
        }"
        @close="isSidebarOpen = false"
        @openHealth="isHealthModalOpen = true"
        @logout="handleLogout"
      />

      <!-- Main Layout Body -->
      <div class="main-content-area">
        <Navbar 
          :currentTab="currentTab"
          :healthStatus="healthStatus"
          :isRefreshing="isRefreshing"
          @toggleSidebar="isSidebarOpen = !isSidebarOpen"
          @openHealth="isHealthModalOpen = true"
          @refresh="handleRefresh"
          @logout="handleLogout"
        />

        <main class="view-body">
          <!-- 1. Executive Overview -->
          <OverviewView 
            v-if="currentTab === 'overview'" 
            :data="overviewData"
            :isLoading="isOverviewLoading"
            @navigate="currentTab = $event"
            @viewResult="viewingResultId = $event"
          />

          <!-- 2. Results & Announcements -->
          <ResultsView 
            v-else-if="currentTab === 'results'" 
            :renderBaseUrl="renderBaseUrl"
            @viewCandidates="viewingResultId = $event"
            @toast="showToast"
          />

          <!-- 3. Web Publisher -->
          <PublisherView 
            v-else-if="currentTab === 'publisher'"
            :renderBaseUrl="renderBaseUrl"
            @published="loadOverviewData"
            @toast="showToast"
          />

          <!-- 4. Telegram Subscribers -->
          <SubscribersView 
            v-else-if="currentTab === 'subscribers'"
            @directMessage="handleDirectMessage"
            @navigate="currentTab = $event"
            @toast="showToast"
          />

          <!-- 5. Telegram Broadcast Studio -->
          <BroadcastView 
            v-else-if="currentTab === 'broadcast'"
            :initialChatId="directChatId"
            :renderBaseUrl="renderBaseUrl"
            @toast="showToast"
          />
        </main>
      </div>

      <!-- Candidate Modal Viewer -->
      <CandidateModal 
        v-if="viewingResultId"
        :resultId="viewingResultId"
        :renderBaseUrl="renderBaseUrl"
        @close="viewingResultId = null"
        @toast="showToast"
      />

      <!-- Health Monitor Modal -->
      <HealthModal 
        v-if="isHealthModalOpen"
        @close="isHealthModalOpen = false"
        @toast="showToast"
      />
    </template>

    <!-- Global Floating Toasts -->
    <ToastContainer 
      :toasts="toasts" 
      @dismiss="dismissToast" 
    />
  </div>
</template>
