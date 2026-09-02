export default defineEventHandler(async (event) => {
  requireAdminAuth(event)

  try {
    // 1. Counts
    const [subCountRes, resultsCountRes, annCountRes] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*)::text as count FROM subscribers;'),
      query<{ count: string }>('SELECT COUNT(*)::text as count FROM tracked_results;'),
      query<{ count: string }>('SELECT COUNT(*)::text as count FROM announcements;')
    ])

    const totalSubscribers = parseInt(subCountRes.rows[0]?.count || '0', 10)
    const totalTrackedResults = parseInt(resultsCountRes.rows[0]?.count || '0', 10)
    const totalAnnouncements = parseInt(annCountRes.rows[0]?.count || '0', 10)

    // 2. Count total candidates across all announcements
    let totalCandidates = 0
    try {
      const candidatesRes = await query<{ sum: string }>(`
        SELECT COALESCE(SUM(jsonb_array_length(data->'candidates')), 0)::text as sum 
        FROM announcements 
        WHERE data->'candidates' IS NOT NULL;
      `)
      totalCandidates = parseInt(candidatesRes.rows[0]?.sum || '0', 10)
    } catch (e) {
      console.warn('Could not calculate candidate count via JSON query:', e)
    }

    // 3. Types breakdown
    const typesRes = await query<{ announcement: string; count: string }>(`
      SELECT COALESCE(NULLIF(TRIM(announcement), ''), 'UNSPECIFIED') as announcement, COUNT(*)::text as count
      FROM tracked_results
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 8;
    `)

    // 4. Recent results
    const recentResultsRes = await query(`
      SELECT id, position, location, announcement, description, date_time, updated_at
      FROM tracked_results
      ORDER BY updated_at DESC
      LIMIT 6;
    `)

    // 5. Recent subscribers
    const recentSubsRes = await query(`
      SELECT chat_id::text, subscribed_at
      FROM subscribers
      ORDER BY subscribed_at DESC
      LIMIT 5;
    `)

    return {
      ok: true,
      stats: {
        totalSubscribers,
        totalTrackedResults,
        totalAnnouncements,
        totalCandidates
      },
      typesBreakdown: typesRes.rows.map(r => ({
        type: r.announcement,
        count: parseInt(r.count, 10)
      })),
      recentResults: recentResultsRes.rows,
      recentSubscribers: recentSubsRes.rows
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Database error in overview: ${err.message}`
    })
  }
})
