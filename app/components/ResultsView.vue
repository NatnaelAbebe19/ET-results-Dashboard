<script setup lang="ts">
const props = defineProps<{
  renderBaseUrl: string
}>()

const emit = defineEmits<{
  (e: 'viewCandidates', id: string): void
  (e: 'toast', msg: string, type: 'success' | 'error' | 'info'): void
}>()

const handleUnauthorized = inject<() => void>('handleUnauthorized', () => {})

const searchQuery = ref('')
const selectedType = ref('ALL')
const page = ref(1)
const limit = 20
const total = ref(0)
const results = ref<any[]>([])
const isLoading = ref(false)

const typesList = [
  'ALL',
  'CALL FOR WRITTEN EXAM',
  'WRITTEN EXAM',
  'CALL FOR INTERVIEW',
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
    if (err.statusCode === 401 || err.status === 401) {
      handleUnauthorized()
    } else {
      emit('toast', `Failed to load results: ${err.data?.statusMessage || err.message}`, 'error')
    }
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
  }, 280)
})

watch(selectedType, () => {
  page.value = 1
  fetchResults()
})

onMounted(() => {
  fetchResults()
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))

function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p
    fetchResults()
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    goToPage(page.value + 1)
  }
}

function prevPage() {
  if (page.value > 1) {
    goToPage(page.value - 1)
  }
}

async function deleteResult(id: string, position: string) {
  if (!confirm(`Delete "${position}" (${id}) from Neon database?`)) {
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
  emit('toast', 'Copied web viewer link to clipboard!', 'info')
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
    <!-- Top Filter Toolbar (TailAdmin Style) -->
    <div class="card" style="margin-bottom: 20px; padding: 16px 20px;">
      <div class="flex-between" style="flex-wrap: wrap; gap: 14px;">
        <div class="flex-gap-3" style="flex: 1; min-width: 260px;">
          <!-- Search input -->
          <div style="position: relative; flex: 1; max-width: 380px;">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search positions, locations, exam types..." 
              style="width: 100%; padding-left: 36px;"
            />
            <svg 
              width="15" 
              height="15" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
              style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <button 
              v-if="searchQuery" 
              @click="searchQuery = ''" 
              style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); cursor: pointer;"
            >
              ✕
            </button>
          </div>

          <!-- Type filter dropdown -->
          <select v-model="selectedType" style="min-width: 190px;">
            <option v-for="t in typesList" :key="t" :value="t">
              {{ t === 'ALL' ? 'All Announcement Types' : t }}
            </option>
          </select>
        </div>

        <div class="flex-gap-2">
          <button class="btn btn-secondary btn-sm" @click="exportCsv" title="Export current view to CSV">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export CSV</span>
          </button>
          <button class="btn btn-secondary btn-sm" @click="fetchResults" :disabled="isLoading">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ 'spin-animation': isLoading }">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>

    <!-- TailAdmin Table Card -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div style="padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle);">
        <div>
          <h2 class="card-title">
            Tracked Results & Announcements
          </h2>
          <div class="text-muted" style="font-size: 12px; margin-top: 2px;">
            Showing {{ (page - 1) * limit + 1 }} to {{ Math.min(page * limit, total) }} of {{ total }} records
          </div>
        </div>

        <div class="badge badge-gray font-mono">
          Page {{ page }} of {{ totalPages }}
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" style="text-align: center; padding: 50px 0;">
        <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid rgba(70,95,255,0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p class="text-muted" style="margin-top: 12px; font-size: 13px;">Loading announcements...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="results.length === 0" style="text-align: center; padding: 60px 0;">
        <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
        <h3 style="font-size: 15px; color: var(--text-primary);">No announcements match criteria</h3>
        <p class="text-muted" style="font-size: 13px; margin-top: 4px;">
          Try adjusting your search query or selecting "All Announcement Types".
        </p>
      </div>

      <!-- Results Table -->
      <div v-else class="table-wrapper" style="border: none; border-radius: 0;">
        <table class="table">
          <thead>
            <tr>
              <th>Job Position</th>
              <th>Category Type</th>
              <th>Exam Venue / Location</th>
              <th>Candidates</th>
              <th>Schedule Date</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in results" :key="r.id">
              <!-- Position Title -->
              <td style="font-weight: 600; max-width: 280px;">
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary);">
                    {{ r.position || 'Untitled' }}
                  </span>
                  <span class="font-mono text-muted" style="font-size: 11px;">ID: {{ r.id }}</span>
                </div>
              </td>

              <!-- Type Badge -->
              <td>
                <span class="badge badge-blue">
                  {{ r.announcement || 'General' }}
                </span>
              </td>

              <!-- Location -->
              <td style="font-size: 12.5px; color: var(--text-secondary); max-width: 200px;">
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  {{ r.location || '—' }}
                </div>
              </td>

              <!-- Candidates Roster Badge -->
              <td>
                <span v-if="r.candidate_count > 0" class="badge badge-green">
                  {{ r.candidate_count }} Candidates
                </span>
                <span v-else class="badge badge-gray">
                  0 Listed
                </span>
              </td>

              <!-- Date / Time -->
              <td style="font-size: 12px; color: var(--text-muted);">
                {{ r.date_time || '—' }}
              </td>

              <!-- Actions -->
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
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </button>

                  <button 
                    class="btn btn-danger btn-sm" 
                    @click="deleteResult(r.id, r.position)"
                    title="Delete record"
                  >
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

      <!-- Taildrops Inspired Clean Pagination Footer -->
      <div style="padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-subtle); background: rgba(17, 24, 39, 0.5); flex-wrap: wrap; gap: 12px;">
        <div class="text-muted" style="font-size: 12.5px;">
          Showing <strong style="color: var(--text-primary);">{{ (page - 1) * limit + 1 }}</strong> to <strong style="color: var(--text-primary);">{{ Math.min(page * limit, total) }}</strong> of <strong style="color: var(--text-primary);">{{ total }}</strong> entries
        </div>

        <div class="flex-gap-2">
          <button class="btn btn-secondary btn-sm" :disabled="page <= 1" @click="prevPage">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>Previous</span>
          </button>

          <!-- Numbered page pill buttons -->
          <div class="flex-gap-1" style="display: flex; gap: 4px;">
            <button 
              v-for="p in Math.min(totalPages, 5)" 
              :key="p"
              :class="['btn btn-sm', page === p ? 'btn-primary' : 'btn-secondary']"
              @click="goToPage(p)"
              style="min-width: 32px; padding: 5px 8px; font-weight: 600;"
            >
              {{ p }}
            </button>
          </div>

          <button class="btn btn-secondary btn-sm" :disabled="page >= totalPages" @click="nextPage">
            <span>Next</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.spin-animation {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
