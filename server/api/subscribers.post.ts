export default defineEventHandler(async (event) => {
  requireAdminAuth(event)

  const body = await readBody(event)
  const chatId = body?.chat_id
  const roleFilter = (body?.role_filter || 'all').toLowerCase()

  if (!chatId || isNaN(Number(chatId))) {
    throw createError({ statusCode: 400, statusMessage: 'Valid numeric Chat ID is required' })
  }

  try {
    await query(`
      INSERT INTO subscribers (chat_id, role_filter, subscribed_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (chat_id) DO UPDATE SET role_filter = EXCLUDED.role_filter;
    `, [chatId, roleFilter])

    return {
      ok: true,
      message: `Subscriber ${chatId} saved with role preference: ${roleFilter}`
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to save subscriber: ${err.message}`
    })
  }
})
