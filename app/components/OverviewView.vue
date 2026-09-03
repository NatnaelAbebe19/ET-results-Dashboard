<script setup lang="ts">
interface OverviewData {
  stats: {
    totalSubscribers: number
    totalTrackedResults: number
    totalAnnouncements: number
    totalCandidates: number
  }
  typesBreakdown: Array<{ type: string; count: number }>
  recentResults: Array<any>
  recentSubscribers: Array<any>
}

defineProps<{
  data: OverviewData | null
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'navigate', tab: string): void
  (e: 'viewResult', id: string): void
  (e: 'testBroadcast'): void
}>()

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div>
    <!-- Loading State (Taildrops Skeleton Feel) -->
    <div v-if="isLoading && !data" style="text-align: center; padding: 60px 0;">
      <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid rgba(70,95,255,0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p class="text-muted" style="margin-top: 14px; font-size: 13px;">Synchronizing telemetry from Neon PostgreSQL...</p>
    </div>

    <div v-else-if="data">
      <!-- 4 TailAdmin Top Metric Cards -->
      <div class="stats-grid">
        <!-- 1. Bot Subscribers -->
        <div class="card stat-card">
          <div class="stat-top">
            <span class="stat-label">Bot Subscribers</span>
            <div class="stat-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <div class="stat-value">{{ data.stats.totalSubscribers.toLocaleString() }}</div>
          <div class="stat-sub">
            <span class="badge badge-green" style="padding: 2px 7px; font-size: 11px;">
              ● Active Listeners
            </span>
          </div>
        </div>

        <!-- 2. Tracked Positions -->
        <div class="card stat-card">
          <div class="stat-top">
            <span class="stat-label">Tracked Positions</span>
            <div class="stat-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
          </div>
          <div class="stat-value">{{ data.stats.totalTrackedResults.toLocaleString() }}</div>
          <div class="stat-sub">
            <span class="badge badge-blue" style="padding: 2px 7px; font-size: 11px;">
              Career Results
            </span>
          </div>
        </div>

        <!-- 3. Parsed Announcements -->
        <div class="card stat-card">
          <div class="stat-top">
            <span class="stat-label">Candidate Rosters</span>
            <div class="stat-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
            </div>
          </div>
          <div class="stat-value">{{ data.stats.totalAnnouncements.toLocaleString() }}</div>
          <div class="stat-sub">
            <span class="text-muted">Structured records</span>
          </div>
        </div>

        <!-- 4. Total Candidates -->
        <div class="card stat-card">
          <div class="stat-top">
            <span class="stat-label">Indexed Candidates</span>
            <div class="stat-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
          </div>
          <div class="stat-value">{{ data.stats.totalCandidates.toLocaleString() }}</div>
          <div class="stat-sub">
            <span class="text-muted">Extracted names</span>
          </div>
        </div>
      </div>

      <!-- Quick Action Shortcuts Bar (Taildrops clean banner) -->
      <div class="card" style="margin-bottom: 24px; padding: 18px 24px; background: rgba(70, 95, 255, 0.04); border-color: var(--primary-border);">
        <div class="flex-between" style="flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">⚡ Quick Administrative Actions</div>
            <div class="text-muted" style="font-size: 12px; margin-top: 2px;">Manage announcements, compose notifications, and review subscribers</div>
          </div>
          <div class="flex-gap-2" style="flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" @click="emit('navigate', 'publisher')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Publish Result</span>
            </button>
            <button class="btn btn-secondary btn-sm" @click="emit('navigate', 'broadcast')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m3 11 18-5-5 18-4-7-9-6z"/>
              </svg>
              <span>Dispatch Alert</span>
            </button>
            <button class="btn btn-secondary btn-sm" @click="emit('navigate', 'results')">
              <span>View Results</span>
            </button>
            <button class="btn btn-secondary btn-sm" @click="emit('navigate', 'subscribers')">
              <span>Subscribers</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Two Column Grid: Breakdown & Recent Subscribers -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
        <!-- Announcement Categories -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <span>Announcement Categories</span>
            </h3>
            <span class="badge badge-gray">{{ data.typesBreakdown.length }} Types</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div 
              v-for="item in data.typesBreakdown" 
              :key="item.type"
              style="display: flex; flex-direction: column; gap: 6px;"
            >
              <div class="flex-between" style="font-size: 12.5px;">
                <span style="font-weight: 500; color: var(--text-primary);">{{ item.type }}</span>
                <span class="font-mono text-muted" style="font-size: 12px;">{{ item.count }} ({{ Math.round((item.count / (data.stats.totalTrackedResults || 1)) * 100) }}%)</span>
              </div>
              <div style="height: 6px; background: rgba(255, 255, 255, 0.05); border-radius: var(--radius-full); overflow: hidden;">
                <div 
                  :style="{ 
                    height: '100%', 
                    width: `${Math.min(100, Math.round((item.count / (data.stats.totalTrackedResults || 1)) * 100))}%`,
                    background: 'var(--primary)',
                    borderRadius: 'var(--radius-full)'
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Subscribers -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <span>Recent Subscribers</span>
            </h3>
            <button class="btn btn-secondary btn-sm" @click="emit('navigate', 'subscribers')">
              View All ({{ data.stats.totalSubscribers }})
            </button>
          </div>

          <div v-if="data.recentSubscribers.length === 0" class="text-muted" style="padding: 24px 0; text-align: center;">
            No subscribers recorded yet
          </div>
          <div v-else style="display: flex; flex-direction: column; gap: 8px;">
            <div 
              v-for="sub in data.recentSubscribers" 
              :key="sub.chat_id"
              class="flex-between"
              style="padding: 10px 14px; background: #0f172a; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);"
            >
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; border-radius: var(--radius-full); background: var(--primary-subtle); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;">
                  {{ sub.chat_id.startsWith('-') ? '👥' : '👤' }}
                </div>
                <div>
                  <div class="font-mono" style="font-size: 12.5px; font-weight: 600;">{{ sub.chat_id }}</div>
                  <div class="text-muted" style="font-size: 11px;">Subscribed {{ formatDate(sub.subscribed_at) }}</div>
                </div>
              </div>
              <span class="badge badge-green">Active</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Tracked Results Table (TailAdmin Data Table Style) -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <span>Latest Tracked Announcements</span>
          </h3>
          <button class="btn btn-secondary btn-sm" @click="emit('navigate', 'results')">
            Explore All Results ({{ data.stats.totalTrackedResults }}) ↗
          </button>
        </div>

        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Job Position</th>
                <th>Announcement Type</th>
                <th>Location</th>
                <th>Date / Time</th>
                <th>Synchronized</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="res in data.recentResults" :key="res.id">
                <td style="font-weight: 600; max-width: 280px;">
                  <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary);">
                    {{ res.position || 'Untitled Position' }}
                  </div>
                </td>
                <td>
                  <span class="badge badge-blue">
                    {{ res.announcement || 'General' }}
                  </span>
                </td>
                <td style="color: var(--text-secondary); font-size: 12px; max-width: 200px;">
                  <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    {{ res.location || 'Head Office' }}
                  </div>
                </td>
                <td style="font-size: 12px; color: var(--text-muted);">
                  {{ res.date_time || '—' }}
                </td>
                <td style="font-size: 12px; color: var(--text-muted);" class="font-mono">
                  {{ formatDate(res.updated_at) }}
                </td>
                <td style="text-align: right;">
                  <button class="btn btn-secondary btn-sm" @click="emit('viewResult', res.id)">
                    Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 880px) {
  div[style*="grid-template-columns: 1fr 1fr"] {
    grid-template-columns: 1fr !important;
  }
}
</style>
