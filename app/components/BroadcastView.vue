<script setup lang="ts">
const props = defineProps<{
  initialChatId?: string
  renderBaseUrl: string
}>()

const emit = defineEmits<{
  (e: 'toast', msg: string, type: 'success' | 'error' | 'info'): void
}>()

const target = ref<'all' | 'test'>('test')
const testChatId = ref(props.initialChatId || '')
const messageText = ref(`✈️ *ETHIOPIAN AIRLINES RESULTS ANNOUNCEMENT* ✈️\n\n` +
`📋 *Position:* JUNIOR AIRCRAFT TECHNICIAN\n` +
`📢 *Type:* CALL FOR WRITTEN EXAM\n` +
`📅 *Date & Time:* OCTOBER 15, 2026 AT 09:00 AM\n` +
`📍 *Location:* Ethiopian Aviation University\n\n` +
`Tap the button below to inspect the full list of shortlisted candidates.`)

const buttonText = ref('View Candidate Roster')
const buttonUrl = ref(`${props.renderBaseUrl}`)
const isWebApp = ref(true)

const isSending = ref(false)
const sendResult = ref<any>(null)

watch(() => props.initialChatId, (newId) => {
  if (newId) {
    target.value = 'test'
    testChatId.value = newId
  }
})

function setTemplate(type: 'exam' | 'notice' | 'interview') {
  if (type === 'exam') {
    messageText.value = `✈️ *NEW RESULT ANNOUNCEMENT* ✈️\n\n` +
      `📋 *Position:* SENIOR ACCOUNTANT\n` +
      `📢 *Type:* WRITTEN EXAM\n` +
      `📅 *Date & Time:* OCTOBER 12, 2026 AT 08:30 AM\n\n` +
      `Shortlisted candidates should report to the testing center with valid identification.`
    buttonText.value = 'View Candidates'
  } else if (type === 'interview') {
    messageText.value = `✈️ *INTERVIEW SCHEDULE RELEASED* ✈️\n\n` +
      `📋 *Position:* ASSOCIATE INSTRUCTOR\n` +
      `📢 *Type:* INTERVIEW INVITATION\n` +
      `📍 *Location:* Head Office - Building B\n\n` +
      `Check your name and allocated time slot below.`
    buttonText.value = 'Check Interview Schedule'
  } else {
    messageText.value = `ℹ️ *SYSTEM NOTICE — ET RESULTS BOT*\n\n` +
      `The bot is actively monitoring careers results every 30 seconds.\n\n` +
      `You will receive immediate alerts whenever new exam or interview results are published.`
    buttonText.value = 'Visit Careers Page'
    isWebApp.value = false
    buttonUrl.value = 'https://corporate.ethiopianairlines.com/AboutEthiopian/careers/results'
  }
}

async function sendBroadcast() {
  if (!messageText.value.trim()) {
    emit('toast', 'Please enter a message', 'error')
    return
  }

  if (target.value === 'test' && !testChatId.value.trim()) {
    emit('toast', 'Please provide a test Chat ID', 'error')
    return
  }

  if (target.value === 'all') {
    if (!confirm('Broadcast this notification to ALL subscribers on Telegram?')) {
      return
    }
  }

  isSending.value = true
  sendResult.value = null
  try {
    const res: any = await $fetch('/api/telegram/broadcast', {
      method: 'POST',
      body: {
        message: messageText.value,
        target: target.value,
        testChatId: testChatId.value,
        buttonText: buttonText.value,
        buttonUrl: buttonUrl.value,
        isWebApp: isWebApp.value
      }
    })

    sendResult.value = res
    if (res.sent > 0) {
      emit('toast', `Message sent successfully to ${res.sent} recipient(s)!`, 'success')
    } else {
      emit('toast', `Dispatch completed: 0 sent (${res.message || 'Check errors'})`, 'info')
    }
  } catch (err: any) {
    emit('toast', `Send failed: ${err.data?.statusMessage || err.message}`, 'error')
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div>
    <!-- Workspace Grid -->
    <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 24px;">
      <!-- Left: Composer -->
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">
              <span>Broadcast Composer</span>
            </h2>
            <div class="text-muted" style="font-size: 12px; margin-top: 2px;">
              Dispatch formatted alerts directly through @et_results_bot
            </div>
          </div>

          <!-- Template pills -->
          <div class="flex-gap-2">
            <button class="btn btn-secondary btn-sm" @click="setTemplate('exam')">Exam</button>
            <button class="btn btn-secondary btn-sm" @click="setTemplate('interview')">Interview</button>
            <button class="btn btn-secondary btn-sm" @click="setTemplate('notice')">Notice</button>
          </div>
        </div>

        <!-- Target Selector (TailAdmin custom segmented box) -->
        <div style="margin-bottom: 18px; padding: 14px 16px; background: var(--bg-surface-elevated); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <div style="font-weight: 600; font-size: 12.5px; color: var(--text-secondary); margin-bottom: 10px;">
            Audience Scope
          </div>
          <div class="flex-gap-3" style="flex-wrap: wrap;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;">
              <input type="radio" value="test" v-model="target" name="target" style="accent-color: var(--primary);" />
              <span>Single Chat ID (Test Mode)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;">
              <input type="radio" value="all" v-model="target" name="target" style="accent-color: var(--primary);" />
              <span style="color: var(--primary-light); font-weight: 600;">Broadcast to ALL Subscribers</span>
            </label>
          </div>

          <div v-if="target === 'test'" style="margin-top: 12px;">
            <input 
              v-model="testChatId" 
              type="text" 
              placeholder="Enter recipient Chat ID (e.g. your personal ID or test group)" 
              style="width: 100%;"
            />
          </div>
        </div>

        <!-- Message Body -->
        <div style="margin-bottom: 16px;">
          <div class="flex-between" style="margin-bottom: 6px;">
            <label style="font-weight: 600; font-size: 13px;">Message Content (Telegram Markdown)</label>
            <span class="text-muted" style="font-size: 11px;">*bold*, _italic_, [link](url)</span>
          </div>
          <textarea 
            v-model="messageText" 
            rows="10" 
            style="width: 100%; resize: vertical; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.6;"
          ></textarea>
        </div>

        <!-- Inline Keyboard Button Config -->
        <div style="padding: 16px; background: var(--bg-surface-elevated); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 20px;">
          <div style="font-weight: 600; font-size: 13px; margin-bottom: 12px; color: var(--text-primary);">
            Action Button (Optional)
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 10px; margin-bottom: 12px;">
            <div>
              <label style="font-size: 11.5px; color: var(--text-muted); display: block; margin-bottom: 4px;">Button Label</label>
              <input v-model="buttonText" type="text" placeholder="e.g. View Candidates" style="width: 100%;" />
            </div>
            <div>
              <label style="font-size: 11.5px; color: var(--text-muted); display: block; margin-bottom: 4px;">Destination URL</label>
              <input v-model="buttonUrl" type="text" placeholder="https://..." style="width: 100%;" />
            </div>
          </div>

          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12.5px;">
            <input type="checkbox" v-model="isWebApp" style="accent-color: var(--primary);" />
            <span>Open inside Telegram In-App Web Viewer</span>
          </label>
        </div>

        <!-- Send Action Footer -->
        <div class="flex-between" style="flex-wrap: wrap; gap: 12px;">
          <div class="text-muted" style="font-size: 12px;">
            Selected: <strong :style="{ color: target === 'all' ? 'var(--primary-light)' : 'var(--text-primary)' }">{{ target === 'all' ? 'All Registered Subscribers' : `Single Chat (${testChatId || 'None'})` }}</strong>
          </div>

          <button 
            :class="['btn', target === 'all' ? 'btn-primary' : 'btn-secondary']" 
            :disabled="isSending" 
            @click="sendBroadcast"
          >
            <svg v-if="!isSending" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <span>{{ isSending ? 'Transmitting...' : target === 'all' ? 'Broadcast to All' : 'Send Test Alert' }}</span>
          </button>
        </div>

        <!-- Delivery Results Report -->
        <div 
          v-if="sendResult" 
          style="margin-top: 16px; padding: 12px 16px; border-radius: var(--radius-sm); font-size: 13px; background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);"
        >
          <div style="font-weight: 600; color: var(--text-primary);">
            Delivery Result: {{ sendResult.sent }} sent / {{ sendResult.failed }} failed (Total {{ sendResult.total }})
          </div>
          <div v-if="sendResult.errors?.length > 0" style="margin-top: 6px; font-size: 11.5px; color: #f87171;">
            Failed recipients: {{ sendResult.errors.map((e: any) => `${e.chatId}: ${e.error}`).join('; ') }}
          </div>
        </div>
      </div>

      <!-- Right: Telegram Simulator Preview -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <span>Telegram App Simulator</span>
          </h2>
          <span class="badge badge-blue">Live Preview</span>
        </div>

        <div class="tg-preview-box">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
            <div style="width: 34px; height: 34px; border-radius: var(--radius-full); background: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 15px; color: #fff;">
              ✈️
            </div>
            <div>
              <div style="font-weight: 600; font-size: 13.5px; color: #fff;">ET Results Bot</div>
              <div style="font-size: 11px; color: var(--primary-light);">bot</div>
            </div>
          </div>

          <!-- Chat bubble -->
          <div class="tg-bubble">
            {{ messageText || 'No message entered yet...' }}

            <!-- Attached Button -->
            <div v-if="buttonText" class="tg-btn-container">
              <div class="tg-mock-btn">
                {{ buttonText }} {{ isWebApp ? '↗ [Web App]' : '↗' }}
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top: 18px; padding: 14px 16px; background: rgba(70, 95, 255, 0.04); border-radius: var(--radius-sm); border: 1px solid var(--primary-border); font-size: 12px;">
          <div style="font-weight: 600; color: var(--primary-light); margin-bottom: 4px;">Anti-Spam Rate Limiting</div>
          <div class="text-muted">
            The dispatcher chunks messages at ~20 messages/sec to prevent Telegram Bot API rate limits.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 960px) {
  div[style*="grid-template-columns: 1.15fr 0.85fr"] {
    grid-template-columns: 1fr !important;
  }
}
</style>
