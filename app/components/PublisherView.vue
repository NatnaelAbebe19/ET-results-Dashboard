<script setup lang="ts">
const props = defineProps<{
  renderBaseUrl: string
}>()

const emit = defineEmits<{
  (e: 'toast', msg: string, type: 'success' | 'error' | 'info'): void
  (e: 'published', id: string): void
}>()

const rawText = ref('')
const shouldBroadcast = ref(false)
const isParsing = ref(false)
const isPublishing = ref(false)
const parsedPreview = ref<any>(null)
const publishedResult = ref<any>(null)

const sampleAnnouncement = `Postion :   SENIOR SOFTWARE ENGINEER
Location :    ETHIOPIAN AVIATION UNIVERSITY, AUDITORIUM
Announcement :    WRITTEN EXAM
DATE & TIME:    SEPTEMBER 15, 2026 AT 09:00 AM
Description :
          CALL FOR WRITTEN EXAM    

          (SENIOR SOFTWARE ENGINEER)
Candidate_List :
NO	NAME
1	ABEBE BIKILA KEBEDE
2	ALMAZ AYANA DERESE
3	HAILE GEBRESELASSIE TULU
4	DERARTU TULU BENTI
5	KENENISA BEKELE GIZAW`

function loadSample() {
  rawText.value = sampleAnnouncement
  runPreview()
}

function clearForm() {
  rawText.value = ''
  parsedPreview.value = null
  publishedResult.value = null
}

async function runPreview() {
  if (!rawText.value.trim()) {
    parsedPreview.value = null
    return
  }

  isParsing.value = true
  try {
    const res: any = await $fetch('/api/publish', {
      method: 'POST',
      body: {
        text: rawText.value,
        mode: 'preview'
      }
    })
    parsedPreview.value = res.parsed
  } catch (err: any) {
    emit('toast', err.data?.statusMessage || err.message, 'error')
  } finally {
    isParsing.value = false
  }
}

async function publishAnnouncement() {
  if (!rawText.value.trim()) {
    emit('toast', 'Please enter announcement text first', 'error')
    return
  }

  isPublishing.value = true
  try {
    const res: any = await $fetch('/api/publish', {
      method: 'POST',
      body: {
        text: rawText.value,
        mode: 'publish',
        broadcast: shouldBroadcast.value
      }
    })

    publishedResult.value = res
    emit('toast', 'Announcement published successfully to Neon database!', 'success')
    emit('published', res.resultId)
  } catch (err: any) {
    emit('toast', `Publish failed: ${err.data?.statusMessage || err.message}`, 'error')
  } finally {
    isPublishing.value = false
  }
}

function copyLink(url: string) {
  navigator.clipboard.writeText(url)
  emit('toast', 'Link copied to clipboard!', 'info')
}
</script>

<template>
  <div>
    <!-- Success Banner if Published (Taildrops Clean Alert) -->
    <div 
      v-if="publishedResult" 
      class="card" 
      style="margin-bottom: 24px; border-color: var(--success-border); background: var(--success-light);"
    >
      <div class="flex-between" style="flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="font-size: 15px; font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Successfully Published to Neon Database!</span>
          </div>
          <div class="text-secondary" style="font-size: 13px; margin-top: 4px;">
            Position: <strong style="color: #fff;">{{ publishedResult.parsed?.position }}</strong> (ID: {{ publishedResult.resultId }})
          </div>
          <div v-if="publishedResult.broadcastStatus?.sent !== undefined" class="text-brand" style="font-size: 12.5px; margin-top: 2px;">
            📢 Telegram Broadcast: Dispatched to {{ publishedResult.broadcastStatus.sent }} subscribers.
          </div>
        </div>

        <div class="flex-gap-2">
          <a :href="publishedResult.viewUrl" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            <span>Open in Web Viewer</span>
            <span>↗</span>
          </a>
          <button class="btn btn-secondary btn-sm" @click="copyLink(publishedResult.viewUrl)">
            <span>Copy Link</span>
          </button>
          <button class="btn btn-secondary btn-sm" @click="clearForm">
            <span>Publish Another</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Workspace Grid -->
    <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 24px;">
      <!-- Left: Raw Text Editor -->
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">
              <span>Raw Announcement Text</span>
            </h2>
            <div class="text-muted" style="font-size: 12px; margin-top: 2px;">
              Input text with fields: Postion, Location, Announcement, Candidate_List
            </div>
          </div>

          <div class="flex-gap-2">
            <button class="btn btn-secondary btn-sm" @click="loadSample">
              <span>Load Sample</span>
            </button>
            <button v-if="rawText" class="btn btn-secondary btn-sm" @click="clearForm">
              Clear
            </button>
          </div>
        </div>

        <textarea 
          v-model="rawText" 
          placeholder="Paste announcement text here... Example:&#10;&#10;Postion :   AIRCRAFT TECHNICIAN&#10;Location :    ETHIOPIAN AVIATION UNIVERSITY&#10;Announcement :    WRITTEN EXAM&#10;DATE & TIME:    OCTOBER 10, 2026 AT 09:00 AM&#10;Candidate_List :&#10;NO    NAME&#10;1     ABEBE BIKILA&#10;2     ALMAZ AYANA" 
          rows="17" 
          style="width: 100%; resize: vertical; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; line-height: 1.6;"
          @input="runPreview"
        ></textarea>

        <div style="margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--border-subtle);">
          <!-- Telegram notify checkbox -->
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin-bottom: 16px; user-select: none;">
            <input 
              v-model="shouldBroadcast" 
              type="checkbox" 
              style="width: 17px; height: 17px; accent-color: var(--primary);" 
            />
            <div>
              <div style="font-weight: 600; font-size: 13.5px; color: var(--text-primary);">Broadcast alert to Telegram subscribers</div>
              <div class="text-muted" style="font-size: 12px;">Sends automated alert with candidate roster button to all registered bot users</div>
            </div>
          </label>

          <div class="flex-between">
            <button class="btn btn-secondary" :disabled="!rawText || isParsing" @click="runPreview">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Test Parse</span>
            </button>

            <button 
              class="btn btn-primary" 
              :disabled="!rawText || isPublishing" 
              @click="publishAnnouncement"
            >
              <svg v-if="!isPublishing" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              <span>{{ isPublishing ? 'Publishing...' : 'Publish Announcement' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Real-Time Parser Preview -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <span>Parser Live Preview</span>
          </h2>
          <span v-if="parsedPreview" class="badge badge-blue">
            {{ parsedPreview.candidates.length }} Candidates Detected
          </span>
        </div>

        <div v-if="!parsedPreview" class="text-muted" style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 32px; opacity: 0.4; margin-bottom: 12px;">📄</div>
          <div style="font-weight: 600; color: var(--text-secondary);">No content parsed yet</div>
          <div style="font-size: 12.5px; margin-top: 4px;">
            Paste text on the left or click "Load Sample" to see how the parser automatically structures your data.
          </div>
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Metadata Card -->
          <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 16px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--primary-light); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 10px;">
              Extracted Parameters
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
              <div>
                <span class="text-muted">Position:</span> 
                <strong style="margin-left: 6px; color: var(--text-primary);">{{ parsedPreview.position || '—' }}</strong>
              </div>
              <div>
                <span class="text-muted">Type:</span> 
                <span class="badge badge-blue" style="margin-left: 6px;">
                  {{ parsedPreview.announcement || 'General' }}
                </span>
              </div>
              <div>
                <span class="text-muted">Venue / Location:</span> 
                <span style="margin-left: 6px; color: var(--text-secondary);">{{ parsedPreview.location || '—' }}</span>
              </div>
              <div>
                <span class="text-muted">Exam Date:</span> 
                <span style="margin-left: 6px; color: var(--text-secondary);">{{ parsedPreview.date_time || '—' }}</span>
              </div>
              <div v-if="parsedPreview.id" class="font-mono text-muted" style="font-size: 11px; margin-top: 4px;">
                Unique Hash: {{ parsedPreview.id }}
              </div>
            </div>
          </div>

          <!-- Candidates Preview List -->
          <div>
            <div class="flex-between" style="margin-bottom: 8px;">
              <span style="font-weight: 600; font-size: 13px;">Parsed Candidate Names</span>
              <span class="font-mono text-muted" style="font-size: 12px;">Count: {{ parsedPreview.candidates.length }}</span>
            </div>

            <div 
              v-if="parsedPreview.candidates.length === 0" 
              class="text-muted" 
              style="padding: 20px; background: var(--bg-surface-elevated); border-radius: var(--radius-sm); text-align: center; font-size: 12.5px;"
            >
              No candidate names detected after "Candidate_List :".
            </div>

            <div 
              v-else 
              style="max-height: 280px; overflow-y: auto; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--bg-surface-elevated);"
            >
              <table class="table" style="font-size: 12.5px;">
                <thead>
                  <tr>
                    <th style="width: 50px;">No</th>
                    <th>Full Candidate Name</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="cand in parsedPreview.candidates" :key="cand.no">
                    <td class="font-mono text-muted">{{ cand.no }}</td>
                    <td style="font-weight: 500; color: var(--text-primary);">{{ cand.name }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 960px) {
  div[style*="grid-template-columns: 1.1fr 0.9fr"] {
    grid-template-columns: 1fr !important;
  }
}
</style>
