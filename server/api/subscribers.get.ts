export default defineEventHandler(async (event) => {
  requireAdminAuth(event)

  const urlQuery = getQuery(event)
  const search = (urlQuery.q as string)?.trim() || ''

  try {
    let whereClause = ''
    let params: any[] = []
    if (search) {
      params.push(`%${search}%`)
      whereClause = `WHERE chat_id::text ILIKE $1`
    }

    const res = await query(`
      SELECT chat_id::text, subscribed_at
      FROM subscribers
      ${whereClause}
      ORDER BY subscribed_at DESC;
    `, params)

    return {
      ok: true,
      count: res.rows.length,
      subscribers: res.rows
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch subscribers: ${err.message}`
    })
  }
})
