import type { H3Event } from 'h3'
import crypto from 'node:crypto'

export function generateSessionToken(password: string, secret: string): string {
  const timestamp = Date.now()
  const payload = `${password}:${timestamp}`
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64')
}

export function verifySessionToken(token: string, expectedPassword: string, secret: string): boolean {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8')
    const { payload, signature } = JSON.parse(raw)
    const [pwd, timeStr] = payload.split(':')

    if (pwd !== expectedPassword) {
      return false
    }

    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    if (signature !== expectedSig) {
      return false
    }

    // Token valid for 7 days
    const time = parseInt(timeStr, 10)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - time > sevenDaysMs) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export function requireAdminAuth(event: H3Event): boolean {
  const config = useRuntimeConfig()
  const expectedPassword = config.adminPassword || 'admin12345'
  const secret = config.adminSessionSecret || 'et_results_secure_secret_2026'

  // Check auth cookie
  const cookie = getCookie(event, 'et_admin_session')
  if (cookie && verifySessionToken(cookie, expectedPassword, secret)) {
    return true
  }

  // Check Authorization header (Bearer ...)
  const authHeader = getRequestHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token === expectedPassword || verifySessionToken(token, expectedPassword, secret)) {
      return true
    }
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized. Admin authentication required.'
  })
}
