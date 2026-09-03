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

  for (const id of chatIds) {
    if (!profiles.value[id]) {
      profiles.value[id] = { loading: true, data: null, error: null }
    }
  }

  const batchSize = 5
  for (let i = 0; i < chatIds.length; i += batchSize) {
    const batch = chatIds.slice(i, i + batchSize)
    await Promise.all(batch.map(id => resolveSingleProfile(id)))
    if (i + batchSize < chatIds.length) {
      await new Promise(r => setTimeout(r, 250))
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
    emit('toast', `Chat ID ${id} registered to subscribers!`, 'success')
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
  if (!confirm(`Send this broadcast alert to ALL ${subscribers.value.length} subscribers on Telegram?`)) return

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
    emit('toast', `Broadcast dispatched: ${res.sent} sent, ${res.failed} failed`, res.failed === 0 ? 'success' : 'info')
  } catch (err: any) {
    emit('toast', `Broadcast failed: ${err.data?.statusMessage || err.message}`, 'error')
  } finally {
    isBroadcasting.value = false
  }
}

function copyChatId(chatId: string) {
  navigator.clipboard.writeText(chatId)
  emit('toast', `Copied ${chatId} to clipboard`, 'info')
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
    <!-- Top 3 Stats & Registration Grid (TailAdmin Metric Cards) -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 20px; margin-bottom: 24px;">
      <!-- Total Subscribers -->
      <div class="card stat-card">
        <div class="stat-top">
          <span class="stat-label">Active Audience</span>
          <div class="stat-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>
        <div class="stat-value">{{ subscribers.length }}</div>
        <div class="stat-sub">
          <span class="badge badge-green" style="padding: 2px 7px; font-size: 11px;">
            ● Receiving Alerts
          </span>
        </div>
      </div>

      <!-- Identities Resolved -->
      <div class="card stat-card">
        <div class="stat-top">
          <span class="stat-label">Telegram Profiles</span>
          <div class="stat-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
        <div class="stat-value">
          {{ Object.values(profiles).filter(p => p.data).length }}
          <span style="font-size: 14px; font-weight: 500; color: var(--text-muted);">/ {{ subscribers.length }}</span>
        </div>
        <div class="stat-sub">
          <span :class="isResolvingAll ? 'text-brand' : 'text-muted'">
            {{ isResolvingAll ? 'Resolving via Bot API...' : 'Names & Usernames Synced' }}
          </span>
        </div>
      </div>

      <!-- Register New Subscriber -->
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="font-weight: 600; font-size: 13.5px; color: var(--text-primary); margin-bottom: 4px;">
            Register Subscriber
          </div>
          <div class="text-muted" style="font-size: 12px; margin-bottom: 12px;">
            Manually add a Telegram user or channel Chat ID
          </div>
        </div>

        <div style="display: flex; gap: 8px;">
          <input
            v-model="newChatId"
            type="text"
            placeholder="Chat ID (e.g. 123456789)"
            style="flex: 1;"
            @keyup.enter="addSubscriber"
          />
          <button class="btn btn-primary" :disabled="!newChatId || isAdding" @click="addSubscriber">
            <span>{{ isAdding ? 'Adding...' : 'Register' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Bulk Broadcast Panel (Taildrops Clean Alert/Composer) -->
    <div class="card" style="margin-bottom: 24px; border-color: var(--primary-border); background: rgba(70, 95, 255, 0.03);">
      <div class="card-header" style="margin-bottom: 14px;">
        <div>
          <h2 class="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);">
              <path d="m3 11 18-5-5 18-4-7-9-6z"></path>
              <path d="M13 13 21 6"></path>
            </svg>
            <span>Quick Audience Broadcast</span>
          </h2>
          <div class="text-muted" style="font-size: 12px; margin-top: 2px;">
            Send an instant notification alert directly to all {{ subscribers.length }} bot subscribers
          </div>
        </div>

        <button class="btn btn-secondary btn-sm" @click="emit('navigate', 'broadcast')">
          <span>Full Studio ↗</span>
        </button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: flex-end;">
        <textarea
          v-model="bulkMessage"
          rows="3"
          placeholder="Compose notification message... Supports *bold*, _italic_, and [link](url) Telegram Markdown"
          style="width: 100%; resize: vertical;"
        />
        <button
          class="btn btn-primary"
          :disabled="isBroadcasting || !bulkMessage.trim() || subscribers.length === 0"
          @click="sendBulkMessage"
          style="padding: 12px 20px; align-self: stretch; display: flex; align-items: center; justify-content: center;"
        >
          <svg v-if="!isBroadcasting" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          <span>{{ isBroadcasting ? 'Dispatching...' : `Broadcast to All (${subscribers.length})` }}</span>
        </button>
      </div>

      <!-- Delivery report banner -->
      <div
        v-if="broadcastResult"
        style="margin-top: 14px; padding: 12px 16px; border-radius: var(--radius-sm); font-size: 12.5px; background: rgba(17, 24, 39, 0.8); border: 1px solid var(--border-subtle);"
      >
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <strong style="color: var(--text-primary);">Broadcast Status:</strong>
          <span class="badge badge-green">Delivered: {{ broadcastResult.sent }}</span>
          <span v-if="broadcastResult.failed > 0" class="badge badge-red">Failed: {{ broadcastResult.failed }}</span>
          <span class="text-muted font-mono">Total: {{ broadcastResult.total }}</span>
        </div>
      </div>
    </div>

    <!-- TailAdmin Subscribers Data Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div style="padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 14px;">
        <div class="flex-gap-3" style="flex: 1; max-width: 380px;">
          <div style="position: relative; width: 100%;">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search by Chat ID..." 
              style="width: 100%; padding-left: 36px;" 
            />
            <svg 
              width="15" 
              height="15" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2"
              style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>

        <div class="flex-gap-2">
          <button class="btn btn-secondary btn-sm" @click="exportCsv">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export CSV</span>
          </button>
          <button class="btn btn-secondary btn-sm" :disabled="isLoading" @click="fetchSubscribers">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ 'spin-animation': isLoading }">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" style="text-align: center; padding: 50px 0;">
        <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid rgba(70,95,255,0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p class="text-muted" style="margin-top: 12px; font-size: 13px;">Loading subscriber roster...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!subscribers.length" style="text-align: center; padding: 60px 0;">
        <div style="font-size: 32px; margin-bottom: 12px;">👥</div>
        <h3 style="font-size: 15px; color: var(--text-primary);">No subscribers found</h3>
        <p class="text-muted" style="font-size: 13px; margin-top: 4px;">Users who send /start to @et_results_bot will appear here automatically.</p>
      </div>

      <!-- Subscribers Table -->
      <div v-else class="table-wrapper" style="border: none; border-radius: 0;">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 44px;">#</th>
              <th>User Identity</th>
              <th>Chat ID</th>
              <th>Type</th>
              <th>Subscribed Date</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(sub, idx) in subscribers" :key="sub.chat_id">
              <!-- Number -->
              <td class="text-muted font-mono" style="font-size: 12px;">{{ idx + 1 }}</td>

              <!-- Identity with avatar initial and username -->
              <td style="min-width: 220px; max-width: 300px;">
                <!-- Loading indicator -->
                <div v-if="getProfile(sub.chat_id).loading" style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted);">
                  <div style="width: 14px; height: 14px; border: 2px solid rgba(70,95,255,0.3); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                  <span>Resolving Telegram info...</span>
                </div>

                <!-- Error fallback -->
                <div v-else-if="getProfile(sub.chat_id).error" style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 34px; height: 34px; border-radius: var(--radius-full); background: rgba(255,255,255,0.05); color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;">
                    {{ sub.chat_id.startsWith('-') ? '👥' : '👤' }}
                  </div>
                  <div>
                    <div style="font-weight: 600; font-size: 13px; color: var(--text-secondary);">
                      {{ sub.chat_id.startsWith('-') ? 'Telegram Group' : 'Telegram User' }}
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted);">
                      Not accessible via bot API
                    </div>
                  </div>
                </div>

                <!-- Resolved Group -->
                <div v-else-if="getProfile(sub.chat_id).data && isGroup(getProfile(sub.chat_id).data.type)" style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 34px; height: 34px; border-radius: var(--radius-full); background: var(--primary-subtle); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600;">
                    {{ getProfile(sub.chat_id).data.type === 'channel' ? '📢' : '👥' }}
                  </div>
                  <div>
                    <div style="font-weight: 600; font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">
                      {{ getProfile(sub.chat_id).data.title }}
                    </div>
                    <div v-if="getProfile(sub.chat_id).data.username" style="font-size: 11px; color: var(--primary-light);">
                      {{ getProfile(sub.chat_id).data.username }}
                    </div>
                    <div v-if="getProfile(sub.chat_id).data.memberCount" style="font-size: 10.5px; color: var(--text-muted);">
                      {{ getProfile(sub.chat_id).data.memberCount.toLocaleString() }} members
                    </div>
                  </div>
                </div>

                <!-- Resolved Private User -->
                <div v-else-if="getProfile(sub.chat_id).data" style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 34px; height: 34px; border-radius: var(--radius-full); background: var(--primary-subtle); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600;">
                    {{ (getProfile(sub.chat_id).data.displayName || 'U')[0].toUpperCase() }}
                  </div>
                  <div>
                    <div style="font-weight: 600; font-size: 13px; color: var(--text-primary);">
                      {{ getProfile(sub.chat_id).data.displayName }}
                    </div>
                    <div v-if="getProfile(sub.chat_id).data.username" style="font-size: 11px; color: var(--primary-light);">
                      {{ getProfile(sub.chat_id).data.username }}
                    </div>
                  </div>
                </div>

                <!-- Default fallback -->
                <div v-else class="text-muted" style="font-size: 12px;">—</div>
              </td>

              <!-- Chat ID -->
              <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="font-mono" style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary);">
                    {{ sub.chat_id }}
                  </span>
                  <button @click="copyChatId(sub.chat_id)" style="opacity: 0.5; cursor: pointer; color: var(--text-muted);" title="Copy Chat ID">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
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
                <span v-else class="badge badge-gray">
                  {{ sub.chat_id.startsWith('-100') ? 'channel' : sub.chat_id.startsWith('-') ? 'group' : 'private' }}
                </span>
              </td>

              <!-- Subscribed Date -->
              <td style="color: var(--text-muted); font-size: 12px; white-space: nowrap;">
                {{ formatDate(sub.subscribed_at) }}
              </td>

              <!-- Actions -->
              <td style="text-align: right;">
                <div class="flex-gap-2" style="justify-content: flex-end;">
                  <button class="btn btn-secondary btn-sm" @click="emit('directMessage', sub.chat_id)" title="Compose alert to this chat">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <span>Message</span>
                  </button>
                  <button class="btn btn-danger btn-sm" @click="removeSubscriber(sub.chat_id)" title="Unsubscribe">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
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
@media (max-width: 960px) {
  div[style*="grid-template-columns: 1fr 1fr 1.2fr"] {
    grid-template-columns: 1fr !important;
  }
}
</style>
