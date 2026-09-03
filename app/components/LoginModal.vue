<script setup lang="ts">
const emit = defineEmits<{
  (e: 'authenticated'): void
  (e: 'toast', msg: string, type: 'success' | 'error' | 'info'): void
}>()

const password = ref('')
const isSubmitting = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

async function submitLogin() {
  if (!password.value.trim()) {
    errorMessage.value = 'Password cannot be empty'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const res: any = await $fetch('/api/auth', {
      method: 'POST',
      body: { password: password.value.trim() }
    })

    if (res.ok) {
      emit('toast', 'Welcome back, Admin!', 'success')
      emit('authenticated')
    }
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Invalid admin credentials'
    emit('toast', 'Authentication failed', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="modal-backdrop" style="background: rgba(11, 15, 25, 0.88);">
    <div class="modal-card" style="max-width: 420px; border-color: var(--border-medium);">
      <div style="padding: 36px 32px; text-align: center;">
        <!-- TailAdmin Brand Badge -->
        <div style="width: 52px; height: 52px; margin: 0 auto 18px; background: var(--primary-subtle); border: 1px solid var(--primary-border); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--primary);">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
          ET Results Dashboard
        </h2>
        <p class="text-muted" style="font-size: 13px; margin-top: 6px;">
          Enter your admin password to manage results, announcements, and telegram broadcasts.
        </p>

        <!-- Form -->
        <form @submit.prevent="submitLogin" style="margin-top: 24px; text-align: left;">
          <div style="margin-bottom: 18px;">
            <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 6px;">
              Admin Password
            </label>
            <div style="position: relative;">
              <input 
                v-model="password" 
                :type="showPassword ? 'text' : 'password'" 
                placeholder="Enter password..." 
                style="width: 100%; padding-right: 40px; font-size: 14px;"
                autofocus
              />
              <button 
                type="button" 
                @click="showPassword = !showPassword" 
                style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); cursor: pointer;"
              >
                <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
            <div v-if="errorMessage" style="color: #f87171; font-size: 12px; margin-top: 6px;">
              {{ errorMessage }}
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary" 
            style="width: 100%; padding: 11px; font-size: 13.5px;"
            :disabled="isSubmitting"
          >
            <span>{{ isSubmitting ? 'Authenticating...' : 'Unlock Dashboard' }}</span>
          </button>
        </form>

        <div style="margin-top: 20px; font-size: 11.5px; color: var(--text-muted);">
          Protected session • Configured in <code class="font-mono" style="color: var(--primary-light);">.env</code>
        </div>
      </div>
    </div>
  </div>
</template>
