<script setup lang="ts">
const props = defineProps<{
  resultId: string | null
  renderBaseUrl: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toast', msg: string, type: 'success' | 'error' | 'info'): void
}>()

const data = ref<any>(null)
const isLoading = ref(true)
const searchQuery = ref('')

async function fetchDetails() {
  if (!props.resultId) return
  isLoading.value = true
  try {
    const res: any = await $fetch(`/api/results/${props.resultId}`)
    data.value = res.data
  } catch (err: any) {
    emit('toast', `Failed to load candidate roster: ${err.message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

watch(() => props.resultId, () => {
  searchQuery.value = ''
  if (props.resultId) {
    fetchDetails()
  }
}, { immediate: true })

const filteredCandidates = computed(() => {
  if (!data.value?.candidates) return []
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return data.value.candidates
  return data.value.candidates.filter((c: any) => 
    c.name.toLowerCase().includes(q) || String(c.no).includes(q)
  )
})

function exportCsv() {
  if (!data.value?.candidates || data.value.candidates.length === 0) return
  const headers = ['No', 'Candidate_Name', 'Position', 'Announcement', 'Location', 'Date_Time']
  const rows = data.value.candidates.map((c: any) => [
    c.no,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${(data.value.position || '').replace(/"/g, '""')}"`,
    `"${(data.value.announcement || '').replace(/"/g, '""')}"`,
    `"${(data.value.location || '').replace(/"/g, '""')}"`,
    `"${(data.value.date_time || '').replace(/"/g, '""')}"`
  ])
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `candidates_${data.value.id || 'roster'}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  emit('toast', 'Candidate roster exported to CSV', 'success')
}

function copyLink() {
  if (!data.value?.id) return
  const url = `${props.renderBaseUrl}/results/${data.value.id}`
  navigator.clipboard.writeText(url)
  emit('toast', 'Copied Render Web App URL', 'info')
}
</script>

<template>
  <div v-if="resultId" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-dialog large">
      <!-- Modal Header -->
      <div class="modal-header">
        <div>
          <h2 style="font-size: 17px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <span>🎓</span>
            <span>Candidate Roster & Announcement Details</span>
          </h2>
          <div class="text-muted" style="font-size: 12px; margin-top: 2px;">
            Fingerprint ID: <span class="font-mono text-gold">{{ resultId }}</span>
          </div>
        </div>

        <button class="btn btn-secondary btn-sm" @click="emit('close')" style="padding: 4px 8px;">
          ✕
        </button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <div v-if="isLoading" style="text-align: center; padding: 40px 0;">
          <div style="font-size: 28px; animation: pulse 1s infinite;">📄</div>
          <p class="text-muted" style="margin-top: 8px;">Loading roster from Neon PostgreSQL...</p>
        </div>

        <div v-else-if="!data" class="text-muted" style="text-align: center; padding: 40px 0;">
          Could not find details for this announcement.
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 18px;">
          <!-- Metadata Card -->
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
              <div>
                <span class="text-muted">Job Position:</span>
                <div style="font-weight: 700; color: #fff; font-size: 14px; margin-top: 2px;">
                  {{ data.position || '—' }}
                </div>
              </div>

              <div>
                <span class="text-muted">Type:</span>
                <div style="margin-top: 2px;">
                  <span class="badge badge-gold">{{ data.announcement || 'General' }}</span>
                </div>
              </div>

              <div>
                <span class="text-muted">Venue / Location:</span>
                <div style="font-weight: 500; margin-top: 2px;">{{ data.location || '—' }}</div>
              </div>

              <div>
                <span class="text-muted">Date & Time:</span>
                <div style="font-weight: 500; margin-top: 2px;">{{ data.date_time || '—' }}</div>
              </div>
            </div>

            <div v-if="data.description" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-subtle); font-size: 12.5px; color: var(--text-secondary); white-space: pre-wrap;">
              {{ data.description }}
            </div>
          </div>

          <!-- Search & Count Bar -->
          <div class="flex-between" style="flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1; max-width: 320px;">
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Search candidate name or #" 
                style="width: 100%; font-size: 12.5px;"
              />
            </div>

            <div class="flex-gap-2">
              <span class="badge badge-green">
                {{ filteredCandidates.length }} of {{ data.candidates?.length || 0 }} Candidates
              </span>
              <button class="btn btn-secondary btn-sm" @click="exportCsv">
                <span>📥</span>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <!-- Candidates Table -->
          <div style="border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); max-height: 380px; overflow-y: auto;">
            <table class="table" style="font-size: 13px;">
              <thead style="position: sticky; top: 0; background: #0c121e; z-index: 10;">
                <tr>
                  <th style="width: 60px;">No</th>
                  <th>Full Name</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredCandidates.length === 0">
                  <td colspan="2" class="text-muted" style="text-align: center; padding: 24px;">
                    No candidates found matching "{{ searchQuery }}"
                  </td>
                </tr>
                <tr v-for="cand in filteredCandidates" :key="cand.no">
                  <td class="font-mono text-muted">{{ cand.no }}</td>
                  <td style="font-weight: 600; color: #fff;">{{ cand.name }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <a 
          v-if="data?.id" 
          :href="`${renderBaseUrl}/results/${data.id}`" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="btn btn-secondary btn-sm"
        >
          <span>🌐</span>
          <span>Open in Render Viewer</span>
        </a>

        <button class="btn btn-secondary btn-sm" @click="copyLink">
          <span>📋</span>
          <span>Copy Public Link</span>
        </button>

        <button class="btn btn-primary btn-sm" @click="emit('close')">
          Close
        </button>
      </div>
    </div>
  </div>
</template>
