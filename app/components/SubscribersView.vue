<script setup lang="ts">
const emit = defineEmits<{
  (e: 'toast', msg: string, type: 'success' | 'error' | 'info'): void
  (e: 'directMessage', chatId: string): void
  (e: 'navigate', tab: string): void
}>()

const handleUnauthorized = inject<() => void>('handleUnauthorized', () => {})

const subscribers = ref<any[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const newChatId = ref('')
const isAdding = ref(false)

// Resolved Telegram profiles (auto-loaded)
const profiles = ref<Record<string, { loading: boolean; data: any | null; error: string | null }>>({})
const isResolvingAll = ref(false)

// Quick bulk-broadcast state
const bulkMessage = ref('')
const isBroadcasting = ref(false)
const broadcastResult = ref<any>(null)

async function fetchSubscribers() {
  isLoading.value = true
  try {
    const queryParams: Record<string, any> = {}
    const q = searchQuery.value.trim()
    if (q) queryParams.q = q
    const res: any = await $fetch('/api/subscribers', { query: queryParams })
    subscribers.value = res.subscribers || []
    profiles.value = {}
    // Auto-resolve identities for all subscribers
    resolveAllProfiles()
  } catch (err: any) {
    if (err.statusCode === 401 || err.status === 401) {
      handleUnauthorized()
    } else {
      emit('toast', `Failed to load subscribers: ${err.data?.statusMessage || err.message}`, 'error')
    }
  } finally {
    isLoading.value = false
  }
}

async function resolveAllProfiles() {
  isResolvingAll.value = true
  const chatIds = subscribers.value.map((s: any) => s.chat_id)

  // Mark all as loading
  for (const id of chatIds) {
    if (!profiles.value[id]) {
      profiles.value[id] = { loading: true, data: null, error: null }
    }
  }

  // Resolve in parallel batches of 5 to avoid flooding the Telegram API
  const batchSize = 5
  for (let i = 0; i < chatIds.length; i += batchSize) {
    const batch = chatIds.slice(i, i + batchSize)
    await Promise.all(batch.map(id => resolveSingleProfile(id)))
    if (i + batchSize < chatIds.length) {
      await new Promise(r => setTimeout(r, 300)) // small pause between batches
    }
  }
  isResolvingAll.value = false
}

async function resolveSingleProfile(chatId: string) {
  try {
    const res: any = await $fetch(`/api/telegram/user/${chatId}`)
    profiles.value[chatId] = res.ok
      ? { loading: false, data: res, error: null }
      : { loading: false, data: null, error: res.error || 'Not accessible' }
  } catch (err: any) {
    profiles.value[chatId] = { loading: false, data: null, error: err.data?.statusMessage || err.message }
  }
}

// Type-safe profile accessor for template use
function getProfile(chatId: string) {
  return profiles.value[chatId] ?? { loading: false, data: null, error: null }
}

watch(searchQuery, () => fetchSubscribers())
onMounted(() => fetchSubscribers())

async function addSubscriber() {
  const id = newChatId.value.trim()
  if (!id || isNaN(Number(id))) {
    emit('toast', 'Please enter a valid numeric Telegram Chat ID', 'error')
    return
  }
  isAdding.value = true
  try {
    await $fetch('/api/subscribers', { method: 'POST', body: { chat_id: id } })
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
  if (!confirm(`Remove subscriber ${chatId}?`)) return
  try {
    await $fetch('/api/subscribers', { method: 'DELETE', body: { chat_id: chatId } })
    emit('toast', `Subscriber ${chatId} removed`, 'info')
    fetchSubscribers()
  } catch (err: any) {
    emit('toast', `Failed to remove: ${err.message}`, 'error')
  }
}

async function sendBulkMessage() {
  if (!bulkMessage.value.trim()) {
    emit('toast', 'Please enter a message to broadcast', 'error')
    return
  }
  if (!confirm(`Send this message to ALL ${subscribers.value.length} subscribers?`)) return

  isBroadcasting.value = true
  broadcastResult.value = null
  try {
    const res: any = await $fetch('/api/telegram/broadcast', {
      method: 'POST',
      body: {
        message: bulkMessage.value,
        target: 'all',
        buttonText: '',
        buttonUrl: '',
        isWebApp: false
      }
    })
    broadcastResult.value = res
    emit('toast', `Broadcast sent: ${res.sent} delivered, ${res.failed} failed`, res.failed === 0 ? 'success' : 'info')
  } catch (err: any) {
    emit('toast', `Broadcast failed: ${err.data?.statusMessage || err.message}`, 'error')
  } finally {
    isBroadcasting.value = false
  }
}

function copyChatId(chatId: string) {
  navigator.clipboard.writeText(chatId)
  emit('toast', `Copied ${chatId}`, 'info')
}

function exportCsv() {
  if (!subscribers.value.length) return
  const headers = ['Chat_ID', 'Display_Name', 'Username', 'Type', 'Subscribed_At']
  const rows = subscribers.value.map((s: any) => {
    const p = profiles.value[s.chat_id]?.data
    return [s.chat_id, `"${p?.displayName || ''}"`, p?.username || '', p?.type || '', `"${s.subscribed_at || ''}"`]
  })
  const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const link = Object.assign(document.createElement('a'), { href: encodeURI(csv), download: 'et_subscribers.csv' })
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  emit('toast', 'Exported subscribers CSV', 'success')
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return dateStr }
}

function isGroup(type: string) {
  return type === 'group' || type === 'supergroup' || type === 'channel'
}

defineExpose({ refresh: fetchSubscribers })
</script>

<template>
  <div>
    <!-- Stats Row -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 22px;">
      <!-- Count Card -->
      <div class="card" style="display: flex; align-items: center; gap: 16px; padding: 18px 20px;">
        <div class="stat-icon-wrapper" style="--accent-bg: rgba(16, 185, 129, 0.15); --accent-color: #10b981; --accent-border: rgba(16, 185, 129, 0.3); width: 48px; height: 48px; font-size: 22px;">
          👥
        </div>
        <div>
          <div class="stat-value" style="font-size: 28px;">{{ subscribers.length }}</div>
          <div class="text-muted" style="font-size: 12px;">Active Subscribers</div>
        </div>
      </div>

      <!-- Resolved count -->
      <div class="card" style="display: flex; align-items: center; gap: 16px; padding: 18px 20px;">
        <div class="stat-icon-wrapper" style="--accent-bg: rgba(56, 189, 248, 0.15); --accent-color: #38bdf8; --accent-border: rgba(56, 189, 248, 0.3); width: 48px; height: 48px; font-size: 22px;">
          🔍
        </div>
        <div>
          <div class="stat-value" style="font-size: 28px;">
            {{ Object.values(profiles).filter(p => p.data).length }}
            <span style="font-size: 13px; color: var(--text-muted);">/ {{ subscribers.length }}</span>
          </div>
          <div class="text-muted" style="font-size: 12px;">
            {{ isResolvingAll ? 'Resolving identities...' : 'Identities Resolved' }}
          </div>
        </div>
      </div>

      <!-- Add Subscriber -->
      <div class="card" style="padding: 14px 18px;">
        <div style="font-weight: 700; font-size: 12.5px; margin-bottom: 8px; color: var(--text-secondary);">➕ Add New Subscriber</div>
        <div style="display: flex; gap: 8px;">
          <input
            v-model="newChatId"
            type="text"
            placeholder="Chat ID (e.g. 123456789)"
            style="flex: 1; font-size: 12px;"
            @keyup.enter="addSubscriber"
          />
          <button class="btn btn-primary btn-sm" :disabled="!newChatId || isAdding" @click="addSubscriber">
            {{ isAdding ? '...' : 'Add' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Message Panel -->
    <div class="card" style="margin-bottom: 22px; border-color: rgba(234, 179, 8, 0.3); background: rgba(234, 179, 8, 0.04);">
      <div class="card-header" style="padding-bottom: 12px;">
        <div>
          <h2 class="card-title" style="font-size: 14px;">
            <span>📢</span>
            <span>Quick Bulk Broadcast</span>
          </h2>
          <div class="text-muted" style="font-size: 11.5px; margin-top: 2px;">
            Send a plain text or Telegram Markdown message to all {{ subscribers.length }} subscribers instantly
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" @click="emit('navigate', 'broadcast')">
          <span>Open Studio ↗</span>
        </button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: flex-end;">
        <textarea
          v-model="bulkMessage"
          rows="3"
          placeholder="Type your message here... Supports *bold*, _italic_, [link](url) Telegram Markdown"
          style="width: 100%; resize: vertical; font-size: 13px;"
        />
        <button
          class="btn btn-primary"
          :disabled="isBroadcasting || !bulkMessage.trim() || subscribers.length === 0"
          @click="sendBulkMessage"
          style="white-space: nowrap; align-self: stretch;"
        >
          <span>{{ isBroadcasting ? '⏳' : '📢' }}</span>
          <span>{{ isBroadcasting ? `Sending...` : `Send to All (${subscribers.length})` }}</span>
        </button>
      </div>

      <!-- Delivery result -->
      <div
        v-if="broadcastResult"
        style="margin-top: 10px; padding: 10px 14px; border-radius: var(--radius-sm); font-size: 12.5px;"
        :style="{ background: broadcastResult.failed > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: broadcastResult.failed > 0 ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)' }"
      >
        <strong>Delivery Report:</strong>
        ✅ {{ broadcastResult.sent }} delivered &nbsp;|&nbsp;
        ❌ {{ broadcastResult.failed }} failed &nbsp;|&nbsp;
        📨 {{ broadcastResult.total }} total
        <span v-if="broadcastResult.errors?.length" style="display: block; margin-top: 4px; color: var(--danger); font-size: 11px;">
          {{ broadcastResult.errors.map((e: any) => `${e.chatId}: ${e.error}`).join(' · ') }}
        </span>
      </div>
    </div>

    <!-- Subscriber Table Card -->
    <div class="card">
      <div class="card-header">
        <div class="flex-gap-3" style="flex: 1; max-width: 360px;">
          <input v-model="searchQuery" type="text" placeholder="Search by Chat ID..." style="width: 100%;" />
        </div>
        <div class="flex-gap-2">
          <button class="btn btn-secondary btn-sm" @click="exportCsv">📥 Export CSV</button>
          <button class="btn btn-secondary btn-sm" :disabled="isLoading" @click="fetchSubscribers">🔄 Refresh</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" style="text-align: center; padding: 40px 0;">
        <div style="font-size: 24px; animation: pulse 1s infinite;">👥</div>
        <p class="text-muted" style="margin-top: 8px;">Loading subscriber list...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!subscribers.length" style="text-align: center; padding: 40px 0;">
        <div style="font-size: 32px;">📭</div>
        <h3 style="margin-top: 10px; font-size: 16px;">No subscribers found</h3>
        <p class="text-muted" style="font-size: 13px; margin-top: 4px;">Users who send /start to @et_results_bot will appear here automatically.</p>
      </div>

      <!-- Table -->
      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Identity</th>
              <th>Chat ID</th>
              <th>Type</th>
              <th>Subscribed</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(sub, idx) in subscribers" :key="sub.chat_id">
              <!-- # -->
              <td class="text-muted" style="font-size: 12px; width: 36px;">{{ idx + 1 }}</td>

              <!-- Identity -->
              <td style="min-width: 180px; max-width: 240px;">
                <!-- Loading -->
                <div v-if="getProfile(sub.chat_id).loading" style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted);">
                  <span style="animation: pulse 1s infinite;">⏳</span>
                  <span>Resolving...</span>
                </div>
                <!-- Error: show chat id type indicator -->
                <div v-else-if="getProfile(sub.chat_id).error" style="font-size: 12px;">
                  <div style="font-weight: 600; color: var(--text-secondary);">
                    {{ sub.chat_id.startsWith('-') ? '👥 Group/Channel' : '👤 Private User' }}
                  </div>
                  <div style="font-size: 10.5px; color: var(--text-muted);">
                    Not accessible via bot API
                  </div>
                </div>
                <!-- Resolved: group -->
                <div v-else-if="getProfile(sub.chat_id).data && isGroup(getProfile(sub.chat_id).data.type)">
                  <div style="font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;">
                    {{ getProfile(sub.chat_id).data.type === 'channel' ? '📢' : '👥' }}
                    {{ getProfile(sub.chat_id).data.title }}
                  </div>
                  <div style="font-size: 11px; color: #38bdf8;" v-if="getProfile(sub.chat_id).data.username">
                    {{ getProfile(sub.chat_id).data.username }}
                  </div>
                  <div style="font-size: 10.5px; color: var(--text-muted);" v-if="getProfile(sub.chat_id).data.memberCount">
                    {{ getProfile(sub.chat_id).data.memberCount.toLocaleString() }} members
                  </div>
                </div>
                <!-- Resolved: private user -->
                <div v-else-if="getProfile(sub.chat_id).data">
                  <div style="font-weight: 600; font-size: 13px;">
                    👤 {{ getProfile(sub.chat_id).data.displayName }}
                  </div>
                  <div style="font-size: 11px; color: #38bdf8;" v-if="getProfile(sub.chat_id).data.username">
                    {{ getProfile(sub.chat_id).data.username }}
                  </div>
                </div>
                <!-- Not yet loaded -->
                <div v-else class="text-muted" style="font-size: 12px;">—</div>
              </td>

              <!-- Chat ID -->
              <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="font-mono" style="font-size: 12px; font-weight: 600;">{{ sub.chat_id }}</span>
                  <button @click="copyChatId(sub.chat_id)" style="opacity: 0.5; cursor: pointer; font-size: 11px;" title="Copy">📋</button>
                </div>
              </td>

              <!-- Type Badge -->
              <td>
                <span v-if="getProfile(sub.chat_id).data" class="badge" :class="{
                  'badge-blue': getProfile(sub.chat_id).data.type === 'private',
                  'badge-green': getProfile(sub.chat_id).data.type === 'group' || getProfile(sub.chat_id).data.type === 'supergroup',
                  'badge-yellow': getProfile(sub.chat_id).data.type === 'channel'
                }">
                  {{ getProfile(sub.chat_id).data.type }}
                </span>
                <span v-else class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted);">
                  {{ sub.chat_id.startsWith('-100') ? 'channel?' : sub.chat_id.startsWith('-') ? 'group?' : 'private?' }}
                </span>
              </td>

              <!-- Date -->
              <td style="color: var(--text-muted); font-size: 11.5px; white-space: nowrap;">
                {{ formatDate(sub.subscribed_at) }}
              </td>

              <!-- Actions -->
              <td style="text-align: right;">
                <div class="flex-gap-2" style="justify-content: flex-end;">
                  <button class="btn btn-secondary btn-sm" @click="emit('directMessage', sub.chat_id)" title="Open broadcast studio for this user">
                    ✉️ Message
                  </button>
                  <button class="btn btn-danger btn-sm" @click="removeSubscriber(sub.chat_id)" title="Remove subscriber">
                    🗑️
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
.badge-yellow {
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.3);
}
@media (max-width: 900px) {
  div[style*="grid-template-columns: repeat(3, 1fr)"] {
    grid-template-columns: 1fr !important;
  }
}
</style>
