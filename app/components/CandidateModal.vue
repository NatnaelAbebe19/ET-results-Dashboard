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
  emit('toast', 'Copied web viewer link', 'info')
}
</script>

<template>
  <div v-if="resultId" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card" style="max-width: 720px;">
      <!-- Modal Header -->
      <div class="modal-header">
        <div>
          <h2 style="font-size: 16px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary);">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Candidate Roster & Announcement Details</span>
          </h2>
          <div class="text-muted" style="font-size: 11.5px; margin-top: 2px;">
            Record Hash: <span class="font-mono" style="color: var(--primary-light);">{{ resultId }}</span>
          </div>
        </div>

        <button class="btn btn-secondary btn-sm" @click="emit('close')" style="padding: 5px 9px;">
          ✕
        </button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <div v-if="isLoading" style="text-align: center; padding: 40px 0;">
          <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid rgba(70,95,255,0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <p class="text-muted" style="margin-top: 10px; font-size: 13px;">Retrieving roster from database...</p>
        </div>

        <div v-else-if="!data" class="text-muted" style="text-align: center; padding: 40px 0;">
          Could not find details for this announcement.
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 18px;">
          <!-- Metadata Card -->
          <div style="background: #0f172a; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 16px;">
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
                  <span class="badge badge-blue">{{ data.announcement || 'General' }}</span>
                </div>
              </div>

              <div>
                <span class="text-muted">Venue / Location:</span>
                <div style="font-weight: 500; margin-top: 2px; color: var(--text-secondary);">{{ data.location || '—' }}</div>
              </div>

              <div>
                <span class="text-muted">Exam Schedule:</span>
                <div style="font-weight: 500; margin-top: 2px; color: var(--text-secondary);">{{ data.date_time || '—' }}</div>
              </div>
            </div>

            <div v-if="data.description" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-subtle); font-size: 12.5px; color: var(--text-secondary); white-space: pre-wrap; line-height: 1.5;">
              {{ data.description }}
            </div>
          </div>

          <!-- Search & Count Bar -->
          <div class="flex-between" style="flex-wrap: wrap; gap: 12px;">
            <div style="position: relative; flex: 1; max-width: 320px;">
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Search candidates by name or #..." 
                style="width: 100%; font-size: 12.5px; padding-left: 32px;"
              />
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>

            <div class="flex-gap-2">
              <span class="badge badge-green">
                {{ filteredCandidates.length }} of {{ data.candidates?.length || 0 }} Candidates
              </span>
              <button class="btn btn-secondary btn-sm" @click="exportCsv">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <!-- Candidates Table -->
          <div style="border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); max-height: 380px; overflow-y: auto; background: #0f172a;">
            <table class="table" style="font-size: 13px;">
              <thead style="position: sticky; top: 0; background: #111827; z-index: 10;">
                <tr>
                  <th style="width: 60px;">No</th>
                  <th>Full Candidate Name</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredCandidates.length === 0">
                  <td colspan="2" class="text-muted" style="text-align: center; padding: 28px;">
                    No candidates found matching "{{ searchQuery }}"
                  </td>
                </tr>
                <tr v-for="cand in filteredCandidates" :key="cand.no">
                  <td class="font-mono text-muted">{{ cand.no }}</td>
                  <td style="font-weight: 500; color: #ffffff;">{{ cand.name }}</td>
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
          <span>Open in Web Viewer</span>
          <span>↗</span>
        </a>

        <button class="btn btn-secondary btn-sm" @click="copyLink">
          <span>Copy Public Link</span>
        </button>

        <button class="btn btn-primary btn-sm" @click="emit('close')">
          Done
        </button>
      </div>
    </div>
  </div>
</template>
