export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const password = body?.password?.trim()

  const config = useRuntimeConfig()
  const expectedPassword = config.adminPassword || 'admin12345'
  const secret = config.adminSessionSecret || 'et_results_secure_secret_2026'

  if (!password || password !== expectedPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid admin credentials'
    })
  }

  const token = generateSessionToken(password, secret)

  // Set HTTP-only session cookie for 7 days
  setCookie(event, 'et_admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/'
  })

  return {
    ok: true,
    token,
    message: 'Admin authenticated successfully'
  }
})
