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
    <!-- Loading State -->
    <div v-if="isLoading && !data" style="text-align: center; padding: 60px 0;">
      <div style="font-size: 32px; animation: pulse 1s infinite;">✈️</div>
      <p class="text-muted" style="margin-top: 12px;">Querying Neon PostgreSQL database...</p>
    </div>

    <div v-else-if="data">
      <!-- 4 Top Stat Cards -->
      <div class="stats-grid">
        <!-- Subscribers -->
        <div class="card stat-card" style="--accent-glow: rgba(16, 185, 129, 0.15);">
          <div class="stat-top">
            <span class="stat-label">Bot Subscribers</span>
            <div class="stat-icon-wrapper" style="--accent-bg: rgba(16, 185, 129, 0.12); --accent-color: #10b981; --accent-border: rgba(16, 185, 129, 0.3);">
              👥
            </div>
          </div>
          <div class="stat-value">{{ data.stats.totalSubscribers.toLocaleString() }}</div>
          <div class="stat-sub">
            <span class="text-green">● Active</span>
            <span>Registered Telegram chats</span>
          </div>
        </div>

        <!-- Tracked Results -->
        <div class="card stat-card" style="--accent-glow: rgba(229, 168, 35, 0.15);">
          <div class="stat-top">
            <span class="stat-label">Tracked Positions</span>
            <div class="stat-icon-wrapper" style="--accent-bg: rgba(229, 168, 35, 0.12); --accent-color: #e5a823; --accent-border: rgba(229, 168, 35, 0.3);">
              ✈️
            </div>
          </div>
          <div class="stat-value">{{ data.stats.totalTrackedResults.toLocaleString() }}</div>
          <div class="stat-sub">
            <span class="text-gold">● Synchronized</span>
            <span>Scraped careers announcements</span>
          </div>
        </div>

        <!-- Full Announcements -->
        <div class="card stat-card" style="--accent-glow: rgba(56, 189, 248, 0.15);">
          <div class="stat-top">
            <span class="stat-label">Candidate Rosters</span>
            <div class="stat-icon-wrapper" style="--accent-bg: rgba(56, 189, 248, 0.12); --accent-color: #38bdf8; --accent-border: rgba(56, 189, 248, 0.3);">
              📄
            </div>
          </div>
          <div class="stat-value">{{ data.stats.totalAnnouncements.toLocaleString() }}</div>
          <div class="stat-sub">
            <span>Detailed parsed records</span>
          </div>
        </div>

        <!-- Total Candidates -->
        <div class="card stat-card" style="--accent-glow: rgba(168, 85, 247, 0.15);">
          <div class="stat-top">
            <span class="stat-label">Candidates Indexed</span>
            <div class="stat-icon-wrapper" style="--accent-bg: rgba(168, 85, 247, 0.12); --accent-color: #c084fc; --accent-border: rgba(168, 85, 247, 0.3);">
              🎓
            </div>
          </div>
          <div class="stat-value">{{ data.stats.totalCandidates.toLocaleString() }}</div>
          <div class="stat-sub">
            <span>Total names across announcements</span>
          </div>
        </div>
      </div>

      <!-- Quick Action Shortcuts Bar -->
      <div class="card" style="margin-bottom: 26px; padding: 16px 20px; background: linear-gradient(90deg, rgba(229, 168, 35, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%);">
        <div class="flex-between" style="flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="font-weight: 700; font-size: 14.5px;">⚡ Quick Management Actions</div>
            <div class="text-muted" style="font-size: 12.5px;">Perform common administrative workflows in one click</div>
          </div>
          <div class="flex-gap-2" style="flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" @click="emit('navigate', 'publisher')">
              <span>✍️</span>
              <span>Publish Announcement</span>
            </button>
            <button class="btn btn-secondary btn-sm" @click="emit('navigate', 'broadcast')">
              <span>📣</span>
              <span>Send Broadcast</span>
            </button>
            <button class="btn btn-secondary btn-sm" @click="emit('navigate', 'results')">
              <span>🔍</span>
              <span>Search Results</span>
            </button>
            <button class="btn btn-secondary btn-sm" @click="emit('navigate', 'subscribers')">
              <span>👥</span>
              <span>Manage Subscribers</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Two Column Grid: Breakdown & Activity -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 26px;">
        <!-- Announcement Categories -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <span>📊</span>
              <span>Announcement Categories</span>
            </h3>
            <span class="badge badge-muted">{{ data.typesBreakdown.length }} Types</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div 
              v-for="item in data.typesBreakdown" 
              :key="item.type"
              style="display: flex; flex-direction: column; gap: 4px;"
            >
              <div class="flex-between" style="font-size: 12.5px;">
                <span style="font-weight: 600;">{{ item.type }}</span>
                <span class="font-mono text-muted">{{ item.count }}</span>
              </div>
              <div style="height: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 3px; overflow: hidden;">
                <div 
                  :style="{ 
                    height: '100%', 
                    width: `${Math.min(100, Math.round((item.count / data.stats.totalTrackedResults) * 100))}%`,
                    background: 'linear-gradient(90deg, #e5a823 0%, #10b981 100%)' 
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
              <span>👥</span>
              <span>Recent Subscribers</span>
            </h3>
            <button class="btn btn-secondary btn-sm" @click="emit('navigate', 'subscribers')">
              View All
            </button>
          </div>

          <div v-if="data.recentSubscribers.length === 0" class="text-muted" style="padding: 20px 0; text-align: center;">
            No subscribers recorded yet
          </div>
          <div v-else style="display: flex; flex-direction: column; gap: 10px;">
            <div 
              v-for="sub in data.recentSubscribers" 
              :key="sub.chat_id"
              class="flex-between"
              style="padding: 10px 12px; background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);"
            >
              <div class="flex-gap-2">
                <span style="color: #38bdf8;">✈️</span>
                <div>
                  <div class="font-mono" style="font-size: 13px; font-weight: 600;">Chat ID: {{ sub.chat_id }}</div>
                  <div class="text-muted" style="font-size: 11px;">Joined: {{ formatDate(sub.subscribed_at) }}</div>
                </div>
              </div>
              <span class="badge badge-green">Subscribed</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Tracked Results Table -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <span>🕒</span>
            <span>Latest Tracked Announcements</span>
          </h3>
          <button class="btn btn-secondary btn-sm" @click="emit('navigate', 'results')">
            Explore All Results ({{ data.stats.totalTrackedResults }})
          </button>
        </div>

        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Job Position</th>
                <th>Type</th>
                <th>Location</th>
                <th>Exam Date/Time</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="res in data.recentResults" :key="res.id">
                <td style="font-weight: 600; max-width: 260px;">
                  <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    {{ res.position || 'Untitled Position' }}
                  </div>
                </td>
                <td>
                  <span :class="['badge', res.announcement?.includes('WRITTEN') ? 'badge-gold' : res.announcement?.includes('INTERVIEW') ? 'badge-blue' : 'badge-muted']">
                    {{ res.announcement || 'General' }}
                  </span>
                </td>
                <td style="color: var(--text-secondary); font-size: 12px; max-width: 180px;">
                  <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    {{ res.location || '—' }}
                  </div>
                </td>
                <td style="font-size: 12px; color: var(--text-muted);">
                  {{ res.date_time || '—' }}
                </td>
                <td style="font-size: 12px; color: var(--text-muted);" class="font-mono">
                  {{ formatDate(res.updated_at) }}
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" @click="emit('viewResult', res.id)">
                    View Details
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
@media (max-width: 880px) {
  div[style*="grid-template-columns: 1fr 1fr"] {
    grid-template-columns: 1fr !important;
  }
}
</style>
