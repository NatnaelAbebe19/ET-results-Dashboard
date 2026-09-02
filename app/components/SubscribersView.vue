<script setup lang="ts">
const emit = defineEmits<{
  (e: 'toast', msg: string, type: 'success' | 'error' | 'info'): void
  (e: 'directMessage', chatId: string): void
}>()

const subscribers = ref<any[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const newChatId = ref('')
const isAdding = ref(false)

async function fetchSubscribers() {
  isLoading.value = true
  try {
    const res: any = await $fetch('/api/subscribers', {
      query: { q: searchQuery.value }
    })
    subscribers.value = res.subscribers || []
  } catch (err: any) {
    emit('toast', `Failed to load subscribers: ${err.message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

watch(searchQuery, () => {
  fetchSubscribers()
})

onMounted(() => {
  fetchSubscribers()
})

async function addSubscriber() {
  const id = newChatId.value.trim()
  if (!id || isNaN(Number(id))) {
    emit('toast', 'Please enter a valid numeric Telegram Chat ID', 'error')
    return
  }

  isAdding.value = true
  try {
    await $fetch('/api/subscribers', {
      method: 'POST',
      body: { chat_id: id }
    })
    emit('toast', `Chat ID ${id} added to subscribers!`, 'success')
    newChatId.value = ''
    fetchSubscribers()
  } catch (err: any) {
    emit('toast', `Failed to add subscriber: ${err.data?.statusMessage || err.message}`, 'error')
  } finally {
    isAdding.value = false
  }
}

async function removeSubscriber(chatId: string) {
  if (!confirm(`Are you sure you want to remove subscriber ${chatId}?`)) {
    return
  }

  try {
    await $fetch('/api/subscribers', {
      method: 'DELETE',
      body: { chat_id: chatId }
    })
    emit('toast', `Subscriber ${chatId} removed`, 'info')
    fetchSubscribers()
  } catch (err: any) {
    emit('toast', `Failed to remove subscriber: ${err.message}`, 'error')
  }
}

function copyChatId(chatId: string) {
  navigator.clipboard.writeText(chatId)
  emit('toast', `Copied Chat ID ${chatId} to clipboard!`, 'info')
}

function exportCsv() {
  if (subscribers.value.length === 0) return
  const headers = ['Chat_ID', 'Subscribed_At']
  const rows = subscribers.value.map(s => [s.chat_id, `"${s.subscribed_at || ''}"`])
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', 'et_subscribers.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  emit('toast', 'Exported subscribers CSV', 'success')
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

defineExpose({ refresh: fetchSubscribers })
</script>

<template>
  <div>
    <!-- Top Row: Stats & Manual Add -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
      <!-- Total Subscribers Card -->
      <div class="card" style="display: flex; align-items: center; gap: 18px;">
        <div class="stat-icon-wrapper" style="--accent-bg: rgba(16, 185, 129, 0.15); --accent-color: #10b981; --accent-border: rgba(16, 185, 129, 0.3); width: 54px; height: 54px; font-size: 24px;">
          👥
        </div>
        <div>
          <div class="stat-value">{{ subscribers.length }}</div>
          <div class="text-muted" style="font-size: 13px;">Registered Telegram Users Receiving Notifications</div>
        </div>
      </div>

      <!-- Add Subscriber Form -->
      <div class="card">
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 10px;">➕ Register New Subscriber</div>
        <div style="display: flex; gap: 10px;">
          <input 
            v-model="newChatId" 
            type="text" 
            placeholder="Enter Telegram Chat ID (e.g. 123456789)" 
            style="flex: 1;"
            @keyup.enter="addSubscriber"
          />
          <button class="btn btn-primary btn-sm" :disabled="!newChatId || isAdding" @click="addSubscriber">
            <span>{{ isAdding ? 'Adding...' : 'Add Chat' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Filter & Table Card -->
    <div class="card">
      <div class="card-header">
        <div class="flex-gap-3" style="flex: 1; max-width: 380px;">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search by Chat ID..." 
            style="width: 100%;"
          />
        </div>

        <div class="flex-gap-2">
          <button class="btn btn-secondary btn-sm" @click="exportCsv">
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <button class="btn btn-secondary btn-sm" @click="fetchSubscribers" :disabled="isLoading">
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" style="text-align: center; padding: 40px 0;">
        <div style="font-size: 24px; animation: pulse 1s infinite;">👥</div>
        <p class="text-muted" style="margin-top: 8px;">Loading subscriber list...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="subscribers.length === 0" style="text-align: center; padding: 40px 0;">
        <div style="font-size: 32px;">📭</div>
        <h3 style="margin-top: 10px; font-size: 16px;">No subscribers found</h3>
        <p class="text-muted" style="font-size: 13px; margin-top: 4px;">Users who send /start to @et_results_bot will appear here automatically.</p>
      </div>

      <!-- Table -->
      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Telegram Chat ID</th>
              <th>Status</th>
              <th>Subscription Timestamp</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sub in subscribers" :key="sub.chat_id">
              <td class="font-mono" style="font-size: 13.5px; font-weight: 600;">
                <div class="flex-gap-2">
                  <span>{{ sub.chat_id }}</span>
                  <button 
                    @click="copyChatId(sub.chat_id)" 
                    style="opacity: 0.6; cursor: pointer;" 
                    title="Copy Chat ID"
                  >
                    📋
                  </button>
                </div>
              </td>

              <td>
                <span class="badge badge-green">
                  ● Active Listener
                </span>
              </td>

              <td style="color: var(--text-muted); font-size: 12.5px;">
                {{ formatDate(sub.subscribed_at) }}
              </td>

              <td style="text-align: right;">
                <div class="flex-gap-2" style="justify-content: flex-end;">
                  <button 
                    class="btn btn-secondary btn-sm" 
                    @click="emit('directMessage', sub.chat_id)"
                    title="Compose test alert to this user"
                  >
                    Direct Message
                  </button>

                  <button 
                    class="btn btn-danger btn-sm" 
                    @click="removeSubscriber(sub.chat_id)"
                    title="Unsubscribe user"
                  >
                    🗑️ Remove
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 768px) {
  div[style*="grid-template-columns: 1fr 1fr"] {
    grid-template-columns: 1fr !important;
  }
}
</style>
