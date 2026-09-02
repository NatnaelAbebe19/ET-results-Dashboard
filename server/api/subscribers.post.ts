export default defineEventHandler(async (event) => {
  requireAdminAuth(event)

  const body = await readBody(event)
  const chatId = body?.chat_id

  if (!chatId || isNaN(Number(chatId))) {
    throw createError({ statusCode: 400, statusMessage: 'Valid numeric Chat ID is required' })
  }

  try {
    await query(`
      INSERT INTO subscribers (chat_id, subscribed_at)
      VALUES ($1, CURRENT_TIMESTAMP)
      ON CONFLICT (chat_id) DO NOTHING;
    `, [chatId])

    return {
      ok: true,
      message: `Subscriber ${chatId} added successfully`
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to add subscriber: ${err.message}`
    })
  }
})
