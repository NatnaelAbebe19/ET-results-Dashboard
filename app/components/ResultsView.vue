<script setup lang="ts">
const props = defineProps<{
  renderBaseUrl: string
}>()

const emit = defineEmits<{
  (e: 'viewCandidates', id: string): void
  (e: 'toast', msg: string, type: 'success' | 'error' | 'info'): void
}>()

const searchQuery = ref('')
const selectedType = ref('ALL')
const page = ref(1)
const limit = 20
const total = ref(0)
const results = ref<any[]>([])
const isLoading = ref(false)

const typesList = [
  'ALL',
  'WRITTEN EXAM',
  'CALL FOR WRITTEN EXAM',
  'INTERVIEW',
  'PRACTICAL EXAM',
  'MEDICAL EXAMINATION'
]

async function fetchResults() {
  isLoading.value = true
  try {
    const offset = (page.value - 1) * limit
    const queryParams: Record<string, any> = {
      type: selectedType.value,
      limit,
      offset
    }
    const q = searchQuery.value.trim()
    if (q) {
      queryParams.q = q
    }
    const res: any = await $fetch('/api/results', {
      query: queryParams
    })
    results.value = res.results || []
    total.value = res.total || 0
  } catch (err: any) {
    emit('toast', `Failed to load results: ${err.message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

// Debounced search
let searchTimer: any = null
watch(searchQuery, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    fetchResults()
  }, 350)
})

watch(selectedType, () => {
  page.value = 1
  fetchResults()
})

onMounted(() => {
  fetchResults()
})

const totalPages = computed(() => Math.ceil(total.value / limit) || 1)

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
    fetchResults()
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    fetchResults()
  }
}

async function deleteResult(id: string, position: string) {
  if (!confirm(`Are you sure you want to delete "${position}" (${id}) from Neon database?`)) {
    return
  }

  try {
    await $fetch(`/api/results/${id}`, { method: 'DELETE' })
    emit('toast', 'Announcement deleted successfully', 'success')
    fetchResults()
  } catch (err: any) {
    emit('toast', `Delete failed: ${err.message}`, 'error')
  }
}

function copyRenderLink(id: string) {
  const url = `${props.renderBaseUrl}/results/${id}`
  navigator.clipboard.writeText(url)
  emit('toast', 'Copied Render Web Viewer link to clipboard!', 'info')
}

function exportCsv() {
  if (results.value.length === 0) return
  const headers = ['ID', 'Position', 'Type', 'Location', 'Date_Time', 'Candidate_Count', 'Updated_At']
  const rows = results.value.map(r => [
    `"${r.id}"`,
    `"${(r.position || '').replace(/"/g, '""')}"`,
    `"${(r.announcement || '').replace(/"/g, '""')}"`,
    `"${(r.location || '').replace(/"/g, '""')}"`,
    `"${(r.date_time || '').replace(/"/g, '""')}"`,
    r.candidate_count || 0,
    `"${r.updated_at || ''}"`
  ])
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `et_results_page_${page.value}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  emit('toast', 'Downloaded results CSV', 'success')
}

defineExpose({ refresh: fetchResults })
</script>

<template>
  <div>
    <!-- Top Filter Bar -->
    <div class="card" style="margin-bottom: 20px; padding: 18px 20px;">
      <div class="flex-between" style="flex-wrap: wrap; gap: 14px;">
        <div class="flex-gap-3" style="flex: 1; min-width: 260px;">
          <!-- Search input -->
          <div style="position: relative; flex: 1; max-width: 420px;">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search by position, venue, type..." 
              style="width: 100%; padding-left: 36px;"
            />
            <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);">
              🔍
            </span>
            <button 
              v-if="searchQuery" 
              @click="searchQuery = ''" 
              style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"
            >
              ✕
            </button>
          </div>

          <!-- Type filter dropdown -->
          <select v-model="selectedType" style="min-width: 170px;">
            <option v-for="t in typesList" :key="t" :value="t">
              {{ t === 'ALL' ? 'All Announcement Types' : t }}
            </option>
          </select>
        </div>

        <div class="flex-gap-2">
          <button class="btn btn-secondary btn-sm" @click="exportCsv" title="Export current view to CSV">
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <button class="btn btn-secondary btn-sm" @click="fetchResults" :disabled="isLoading">
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">
            <span>📋</span>
            <span>Tracked Results & Candidate Rosters</span>
          </h2>
          <div class="text-muted" style="font-size: 12.5px; margin-top: 3px;">
            Showing {{ results.length }} of {{ total }} announcements from Neon DB
          </div>
        </div>

        <!-- Pagination summary -->
        <div class="flex-gap-2" style="font-size: 13px;">
          <button class="btn btn-secondary btn-sm" :disabled="page <= 1" @click="prevPage">
            ◀ Prev
          </button>
          <span class="font-mono text-muted" style="padding: 0 4px;">
            Page {{ page }} of {{ totalPages }}
          </span>
          <button class="btn btn-secondary btn-sm" :disabled="page >= totalPages" @click="nextPage">
            Next ▶
          </button>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" style="text-align: center; padding: 40px 0;">
        <div style="font-size: 24px; animation: pulse 1s infinite;">🔍</div>
        <p class="text-muted" style="margin-top: 8px;">Loading announcements...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="results.length === 0" style="text-align: center; padding: 50px 0;">
        <div style="font-size: 32px;">📭</div>
        <h3 style="margin-top: 10px; font-size: 16px;">No announcements match criteria</h3>
        <p class="text-muted" style="font-size: 13px; margin-top: 4px;">
          Try adjusting your search query or category filter.
        </p>
      </div>

      <!-- Results Table -->
      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Position Title</th>
              <th>Type</th>
              <th>Location</th>
              <th>Candidates</th>
              <th>Date & Time</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in results" :key="r.id">
              <td style="font-weight: 600; max-width: 280px;">
                <div style="display: flex; flex-direction: column;">
                  <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    {{ r.position || 'Untitled' }}
                  </span>
                  <span class="font-mono text-muted" style="font-size: 11px;">ID: {{ r.id }}</span>
                </div>
              </td>

              <td>
                <span :class="['badge', r.announcement?.includes('WRITTEN') ? 'badge-gold' : r.announcement?.includes('INTERVIEW') ? 'badge-blue' : 'badge-muted']">
                  {{ r.announcement || 'General' }}
                </span>
              </td>

              <td style="font-size: 12px; color: var(--text-secondary); max-width: 180px;">
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  {{ r.location || '—' }}
                </div>
              </td>

              <td>
                <span v-if="r.candidate_count > 0" class="badge badge-green">
                  🎓 {{ r.candidate_count }} Listed
                </span>
                <span v-else class="badge badge-muted">
                  0 Listed
                </span>
              </td>

              <td style="font-size: 12px; color: var(--text-muted);">
                {{ r.date_time || '—' }}
              </td>

              <td style="text-align: right;">
                <div class="flex-gap-2" style="justify-content: flex-end;">
                  <button 
                    class="btn btn-primary btn-sm" 
                    @click="emit('viewCandidates', r.id)"
                    title="Inspect candidates list"
                  >
                    View Roster
                  </button>

                  <button 
                    class="btn btn-secondary btn-sm" 
                    @click="copyRenderLink(r.id)"
                    title="Copy Render Web App link"
                  >
                    🔗 Link
                  </button>

                  <button 
                    class="btn btn-danger btn-sm" 
                    @click="deleteResult(r.id, r.position)"
                    title="Delete record"
                  >
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
