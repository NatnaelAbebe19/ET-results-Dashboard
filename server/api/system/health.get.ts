export default defineEventHandler(async (event) => {
  requireAdminAuth(event)

  const config = useRuntimeConfig()
  const renderUrl = config.public.renderAppUrl || 'https://et-results.onrender.com'
  const botToken = config.telegramBotToken

  // 1. Neon Database Health
  const dbHealth = await testDbConnection()

  // 2. Telegram Bot Health
  let telegramHealth = { ok: false, latencyMs: 0, error: undefined as string | undefined, bot: undefined as any }
  if (botToken) {
    const tgStart = Date.now()
    try {
      const tgRes = await $fetch<any>(`https://api.telegram.org/bot${botToken}/getMe`, { timeout: 6000 })
      telegramHealth = {
        ok: tgRes.ok,
        latencyMs: Date.now() - tgStart,
        bot: tgRes.result,
        error: undefined
      }
    } catch (e: any) {
      telegramHealth = {
        ok: false,
        latencyMs: Date.now() - tgStart,
        error: e.message || 'Telegram API request failed',
        bot: undefined
      }
    }
  } else {
    telegramHealth.error = 'No token configured'
  }

  // 3. Render Web App Health
  let renderHealth = { ok: false, latencyMs: 0, status: 0, error: undefined as string | undefined }
  const renderStart = Date.now()
  try {
    const res = await fetch(renderUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'ET-Dashboard-Monitor/1.0' },
      signal: AbortSignal.timeout(10000)
    })
    renderHealth = {
      ok: res.ok || res.status === 200,
      latencyMs: Date.now() - renderStart,
      status: res.status,
      error: res.ok ? undefined : `HTTP ${res.status} ${res.statusText}`
    }
  } catch (e: any) {
    renderHealth = {
      ok: false,
      latencyMs: Date.now() - renderStart,
      status: 0,
      error: e.message || 'Render request timed out'
    }
  }

  const allOperational = dbHealth.ok && telegramHealth.ok && renderHealth.ok

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    overallStatus: allOperational ? 'operational' : 'degraded',
    services: {
      neonDatabase: {
        name: 'Neon Serverless PostgreSQL',
        status: dbHealth.ok ? 'healthy' : 'down',
        latencyMs: dbHealth.latencyMs,
        error: dbHealth.error
      },
      telegramBot: {
        name: 'Telegram Bot API (@et_results_bot)',
        status: telegramHealth.ok ? 'healthy' : 'down',
        latencyMs: telegramHealth.latencyMs,
        botName: telegramHealth.bot?.first_name,
        username: telegramHealth.bot?.username,
        error: telegramHealth.error
      },
      renderWebService: {
        name: 'Render Web Viewer & Scraper',
        url: renderUrl,
        status: renderHealth.ok ? 'healthy' : 'down',
        statusCode: renderHealth.status,
        latencyMs: renderHealth.latencyMs,
        error: renderHealth.error
      }
    }
  }
})
