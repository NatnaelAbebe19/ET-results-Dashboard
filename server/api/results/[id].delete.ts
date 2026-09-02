export default defineEventHandler(async (event) => {
  requireAdminAuth(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Result ID is required' })
  }

  try {
    await query('DELETE FROM announcements WHERE id = $1;', [id])
    await query('DELETE FROM tracked_results WHERE id = $1;', [id])

    return {
      ok: true,
      message: `Announcement ${id} deleted successfully from database`
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to delete announcement: ${err.message}`
    })
  }
})
