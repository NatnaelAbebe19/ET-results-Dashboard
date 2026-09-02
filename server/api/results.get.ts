export default defineEventHandler(async (event) => {
  requireAdminAuth(event)

  const urlQuery = getQuery(event)
  const rawQ = urlQuery.q
  const search = typeof rawQ === 'string' ? rawQ.trim() : ''
  const rawType = urlQuery.type
  const typeFilter = typeof rawType === 'string' ? rawType.trim() : ''

  const rawLimit = typeof urlQuery.limit === 'string' ? parseInt(urlQuery.limit, 10) : 20
  const limit = Math.min(Math.max(isNaN(rawLimit) ? 20 : rawLimit, 1), 200)

  const rawOffset = typeof urlQuery.offset === 'string' ? parseInt(urlQuery.offset, 10) : 0
  const offset = Math.max(isNaN(rawOffset) ? 0 : rawOffset, 0)

  try {
    let whereClauses: string[] = []
    let params: any[] = []

    if (search) {
      params.push(`%${search}%`)
      const idx = params.length
      whereClauses.push(`(
        tr.position ILIKE $${idx} OR 
        tr.location ILIKE $${idx} OR 
        tr.announcement ILIKE $${idx} OR 
        tr.description ILIKE $${idx} OR
        tr.id ILIKE $${idx}
      )`)
    }

    if (typeFilter && typeFilter !== 'ALL') {
      params.push(typeFilter)
      whereClauses.push(`tr.announcement = $${params.length}`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    // Count query
    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM tracked_results tr ${whereSql};`,
      params
    )
    const total = parseInt(countRes.rows[0]?.count || '0', 10)

    // Data query with candidate count from announcements
    const dataParams = [...params, limit, offset]
    const limitIdx = dataParams.length - 1
    const offsetIdx = dataParams.length

    const resultsRes = await query(`
      SELECT 
        tr.id,
        tr.position,
        tr.location,
        tr.announcement,
        tr.description,
        tr.date_time,
        tr.updated_at,
        CASE WHEN a.id IS NOT NULL THEN true ELSE false END as has_announcement,
        COALESCE(
          CASE 
            WHEN jsonb_typeof(a.data->'candidates') = 'array' THEN jsonb_array_length(a.data->'candidates')
            ELSE 0 
          END, 
          0
        ) as candidate_count
      FROM tracked_results tr
      LEFT JOIN announcements a ON tr.id = a.id
      ${whereSql}
      ORDER BY tr.updated_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `, dataParams)

    return {
      ok: true,
      total,
      limit,
      offset,
      results: resultsRes.rows
    }
  } catch (err: any) {
    console.error('Error in /api/results:', err)
    throw createError({
      statusCode: 500,
      statusMessage: `Database error: ${err.message}`
    })
  }
})
