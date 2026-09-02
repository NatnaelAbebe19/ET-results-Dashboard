export default defineEventHandler(async (event) => {
  requireAdminAuth(event)

  const urlQuery = getQuery(event)
  const search = (urlQuery.q as string)?.trim() || ''
  const typeFilter = (urlQuery.type as string)?.trim() || ''
  const limit = Math.min(Math.max(parseInt((urlQuery.limit as string) || '50', 10), 1), 200)
  const offset = Math.max(parseInt((urlQuery.offset as string) || '0', 10), 0)

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
        COALESCE(jsonb_array_length(a.data->'candidates'), 0) as candidate_count
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
    throw createError({
      statusCode: 500,
      statusMessage: `Database error: ${err.message}`
    })
  }
})
