export default defineEventHandler(async (event) => {
  requireAdminAuth(event)

  const chatId = getRouterParam(event, 'chatId')
  if (!chatId) {
    throw createError({ statusCode: 400, statusMessage: 'chatId is required' })
  }

  const config = useRuntimeConfig()
  const token = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || ''

  if (!token) {
    throw createError({ statusCode: 500, statusMessage: 'TELEGRAM_BOT_TOKEN is not configured' })
  }

  try {
    const res = await $fetch<any>(
      `https://api.telegram.org/bot${token}/getChat`,
      { query: { chat_id: chatId } }
    )

    if (!res.ok) {
      return {
        ok: false,
        chatId,
        error: res.description || 'Telegram API returned an error'
      }
    }

    const chat = res.result
    const isGroup = chat.type === 'group' || chat.type === 'supergroup' || chat.type === 'channel'

    return {
      ok: true,
      chatId,
      type: chat.type,
      // For private users
      firstName: chat.first_name || null,
      lastName: chat.last_name || null,
      username: chat.username ? `@${chat.username}` : null,
      // Full display name
      displayName: isGroup
        ? (chat.title || `Group ${chatId}`)
        : [chat.first_name, chat.last_name].filter(Boolean).join(' ') || `User ${chatId}`,
      // For groups/channels
      title: chat.title || null,
      memberCount: chat.member_count || null,
      bio: chat.bio || chat.description || null,
      // Profile photo (small thumbnail link if available)
      photoUrl: null // Telegram doesn't expose photo URLs directly without a separate getFile call
    }
  } catch (err: any) {
    // Telegram returns 400 if the bot has never interacted with the user
    const telegramMsg = err.data?.description || err.message || 'Failed to resolve chat info'
    return {
      ok: false,
      chatId,
      error: telegramMsg
    }
  }
})
