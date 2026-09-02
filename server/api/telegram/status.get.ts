export default defineEventHandler(async (event) => {
  requireAdminAuth(event)

  const config = useRuntimeConfig()
  const token = config.telegramBotToken

  if (!token) {
    return {
      configured: false,
      error: 'TELEGRAM_BOT_TOKEN not configured'
    }
  }

  try {
    const [meRes, webhookRes] = await Promise.all([
      $fetch<any>(`https://api.telegram.org/bot${token}/getMe`),
      $fetch<any>(`https://api.telegram.org/bot${token}/getWebhookInfo`).catch(() => ({ ok: false }))
    ])

    return {
      configured: true,
      ok: meRes.ok,
      bot: meRes.result,
      webhook: webhookRes.ok ? webhookRes.result : null
    }
  } catch (err: any) {
    return {
      configured: true,
      ok: false,
      error: err.message || 'Failed to communicate with Telegram Bot API'
    }
  }
})
