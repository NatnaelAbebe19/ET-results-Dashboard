export default defineEventHandler(async (event) => {
  requireAdminAuth(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Result ID is required' })
  }

  try {
    // 1. Check announcements table first for full details & candidates
    const annRes = await query('SELECT id, data, updated_at FROM announcements WHERE id = $1;', [id])
    if (annRes.rows.length > 0) {
      return {
        ok: true,
        source: 'announcements',
        data: annRes.rows[0].data,
        updated_at: annRes.rows[0].updated_at
      }
    }

    // 2. Fallback to tracked_results table
    const trRes = await query('SELECT id, position, location, announcement, description, date_time, updated_at FROM tracked_results WHERE id = $1;', [id])
    if (trRes.rows.length > 0) {
      const row = trRes.rows[0]
      return {
        ok: true,
        source: 'tracked_results',
        data: {
          id: row.id,
          position: row.position,
          location: row.location,
          announcement: row.announcement,
          description: row.description,
          date_time: row.date_time,
          candidates: []
        },
        updated_at: row.updated_at
      }
    }

    throw createError({ statusCode: 404, statusMessage: 'Announcement not found' })
  } catch (err: any) {
    if (err.statusCode === 404) throw err
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to retrieve result: ${err.message}`
    })
  }
})
