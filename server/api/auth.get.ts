export default defineEventHandler(async (event) => {
  try {
    requireAdminAuth(event)
    return {
      authenticated: true,
      timestamp: new Date().toISOString()
    }
  } catch {
    return {
      authenticated: false
    }
  }
})
