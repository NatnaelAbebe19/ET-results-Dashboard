export default defineEventHandler(async (event) => {
  requireAdminAuth(event)

  const body = await readBody(event)
  const chatId = body?.chat_id

  if (!chatId) {
    throw createError({ statusCode: 400, statusMessage: 'Chat ID is required' })
  }

  try {
    await query('DELETE FROM subscribers WHERE chat_id = $1;', [chatId])
    return {
      ok: true,
      message: `Subscriber ${chatId} removed successfully`
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to remove subscriber: ${err.message}`
    })
  }
})
