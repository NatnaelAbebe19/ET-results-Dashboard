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
  <div class="modal-backdrop" style="background: rgba(5, 8, 14, 0.92);">
    <div class="modal-dialog" style="max-width: 440px;">
      <div style="padding: 36px 32px; text-align: center;">
        <!-- Logo -->
        <div style="width: 58px; height: 58px; margin: 0 auto 18px; background: linear-gradient(135deg, #1c263c 0%, #0d1424 100%); border: 2px solid var(--et-gold); border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-glow);">
          <span style="font-size: 26px;">✈️</span>
        </div>

        <h2 style="font-size: 22px; font-weight: 800; color: #fff;">ET Results Admin</h2>
        <p class="text-muted" style="font-size: 13px; margin-top: 6px;">
          Enter your admin password to access the Ethiopian Airlines Results & Bot dashboard.
        </p>

        <!-- Form -->
        <form @submit.prevent="submitLogin" style="margin-top: 24px; text-align: left;">
          <div style="margin-bottom: 16px;">
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
                style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; opacity: 0.6;"
              >
                {{ showPassword ? '👁️' : '🔒' }}
              </button>
            </div>
            <div v-if="errorMessage" style="color: var(--et-red); font-size: 12px; margin-top: 6px;">
              {{ errorMessage }}
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary" 
            style="width: 100%; padding: 11px; font-size: 14px;"
            :disabled="isSubmitting"
          >
            <span>{{ isSubmitting ? 'Authenticating...' : 'Unlock Dashboard' }}</span>
          </button>
        </form>

        <div style="margin-top: 20px; font-size: 11.5px; color: var(--text-muted);">
          Protected session • Configured via <code class="font-mono" style="color: var(--et-gold);">ADMIN_PASSWORD</code> in <code class="font-mono">.env</code>
        </div>
      </div>
    </div>
  </div>
</template>
