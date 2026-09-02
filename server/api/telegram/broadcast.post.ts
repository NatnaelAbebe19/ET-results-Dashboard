export default defineEventHandler(async (event) => {
  requireAdminAuth(event)

  const body = await readBody(event)
  const message = body?.message?.trim()
  const target = body?.target || 'test' // 'all' | 'test'
  const testChatId = body?.testChatId
  const buttonText = body?.buttonText?.trim()
  const buttonUrl = body?.buttonUrl?.trim()
  const isWebApp = Boolean(body?.isWebApp)

  if (!message) {
    throw createError({ statusCode: 400, statusMessage: 'Message content is required' })
  }

  const config = useRuntimeConfig()
  const token = config.telegramBotToken
  if (!token) {
    throw createError({ statusCode: 500, statusMessage: 'TELEGRAM_BOT_TOKEN is not configured' })
  }

  // Determine recipients
  let targetChatIds: string[] = []
  if (target === 'test') {
    if (!testChatId) {
      throw createError({ statusCode: 400, statusMessage: 'Test Chat ID is required when target is test' })
    }
    targetChatIds = [String(testChatId).trim()]
  } else {
    // Broadcast to all
    const subsRes = await query<{ chat_id: string }>('SELECT chat_id FROM subscribers;')
    targetChatIds = subsRes.rows.map(r => r.chat_id)
  }

  if (targetChatIds.length === 0) {
    return {
      ok: true,
      sent: 0,
      failed: 0,
      total: 0,
      message: 'No recipients found to send to'
    }
  }

  // Build inline keyboard if button requested
  let replyMarkup: any = undefined
  if (buttonText && buttonUrl) {
    if (isWebApp) {
      replyMarkup = {
        inline_keyboard: [[{ text: buttonText, web_app: { url: buttonUrl } }]]
      }
    } else {
      replyMarkup = {
        inline_keyboard: [[{ text: buttonText, url: buttonUrl }]]
      }
    }
  }

  let sent = 0
  let failed = 0
  const errors: any[] = []

  for (const chatId of targetChatIds) {
    try {
      await $fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        body: {
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup,
          disable_web_page_preview: true
        }
      })
      sent++
      if (targetChatIds.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 50)) // Telegram rate limit guard
      }
    } catch (err: any) {
      failed++
      errors.push({ chatId, error: err.data?.description || err.message })
    }
  }

  return {
    ok: true,
    sent,
    failed,
    total: targetChatIds.length,
    errors: errors.slice(0, 5) // return top 5 errors if any
  }
})
