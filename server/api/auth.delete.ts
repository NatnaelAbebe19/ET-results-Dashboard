export default defineEventHandler((event) => {
  deleteCookie(event, 'et_admin_session', { path: '/' })
  return {
    ok: true,
    message: 'Logged out successfully'
  }
})
