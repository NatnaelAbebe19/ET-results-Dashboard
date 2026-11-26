import crypto from 'node:crypto'

export interface ParsedCandidate {
  no: string
  name: string
}

export interface ParsedAnnouncement {
  id?: string
  position: string
  location: string
  announcement: string
  description: string
  date_time: string
  candidates: ParsedCandidate[]
}

export function parseAnnouncementText(text: string): ParsedAnnouncement {
  const result: ParsedAnnouncement = {
    position: '',
    location: '',
    announcement: '',
    description: '',
    date_time: '',
    candidates: []
  }

  // 1. Position (Postion or Position)
  const posMatch = text.match(/Post?ion\s*:\s*(.*)/i)
  if (posMatch && posMatch[1]) {
    result.position = posMatch[1].trim()
  }

  // 2. Location
  const locMatch = text.match(/Location\s*:\s*(.*)/i)
  if (locMatch && locMatch[1]) {
    result.location = locMatch[1].trim()
  }

  // 3. Announcement type
  const annMatch = text.match(/Announcement\s*:\s*(.*)/i)
  if (annMatch && annMatch[1]) {
    result.announcement = annMatch[1].trim()
  }

  // 4. Date & Time
  const dtMatch = text.match(/DATE & TIME:\s*([\s\S]+?)(?=\n|\s+AND,?\s+IF\s+YOUR\s+NAME|\s+PLEASE\s+NOTE|\s*Candidate_List\s*:|$)/i)
  if (dtMatch && dtMatch[1]) {
    result.date_time = dtMatch[1].trim()
  }

  // 5. Description
  const descMatch = text.match(/Description\s*:([\s\S]*?)(?=Candidate_List\s*:|$)/i)
  if (descMatch && descMatch[1]) {
    result.description = descMatch[1].trim()
  }

  // 6. Candidates
  const candMatch = text.match(/Candidate_List\s*:([\s\S]*)/i)
  if (candMatch && candMatch[1]) {
    const lines = candMatch[1].split(/\r?\n/)
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue
      // Match "1 NAME" or "1. NAME" or "1\tNAME"
      const match = line.match(/^(\d+)[\.\s\t]+(.+)/)
      if (match && match[1] && match[2]) {
        // Skip header if line is "NO NAME"
        if (match[2].trim().toUpperCase() === 'NAME') continue
        result.candidates.push({
          no: match[1].trim(),
          name: match[2].trim()
        })
      }
    }
  }

  // 7. Unique ID (12-character MD5 hash)
  const idBase = `${result.position}-${result.announcement}-${result.date_time}`
  result.id = crypto.createHash('md5').update(idBase).digest('hex').slice(0, 12)

  return result
}

export default defineEventHandler(async (event) => {
  requireAdminAuth(event)

  const body = await readBody(event)
  const rawText = body?.text || ''
  const mode = body?.mode || 'publish' // 'preview' | 'publish'
  const broadcast = Boolean(body?.broadcast) // notify telegram subscribers?

  if (!rawText.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Announcement text is required' })
  }

  const parsed = parseAnnouncementText(rawText)

  if (!parsed.position) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Could not detect job Position from text. Please verify format (e.g. Position: TITLE).'
    })
  }

  if (mode === 'preview') {
    return {
      ok: true,
      mode: 'preview',
      parsed
    }
  }

  // Save to Neon PostgreSQL
  const resultId = parsed.id!
  try {
    // 1. Insert or update tracked_results
    await query(`
      INSERT INTO tracked_results (id, position, location, announcement, description, date_time, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        position = EXCLUDED.position,
        location = EXCLUDED.location,
        announcement = EXCLUDED.announcement,
        description = EXCLUDED.description,
        date_time = EXCLUDED.date_time,
        updated_at = CURRENT_TIMESTAMP;
    `, [resultId, parsed.position, parsed.location, parsed.announcement, parsed.description, parsed.date_time])

    // 2. Insert or update announcements with full JSONB
    await query(`
      INSERT INTO announcements (id, data, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = CURRENT_TIMESTAMP;
    `, [resultId, JSON.stringify(parsed)])

    // 3. Optional: Broadcast to Telegram subscribers
    let broadcastStatus = null
    if (broadcast) {
      try {
        broadcastStatus = await sendBroadcastForAnnouncement(parsed)
      } catch (bErr: any) {
        console.error('Failed to broadcast after publish:', bErr)
        broadcastStatus = { error: bErr.message }
      }
    }

    const config = useRuntimeConfig()
    const renderUrl = config.public.renderAppUrl || 'https://et-results.onrender.com'
    const viewUrl = `${renderUrl}/results/${resultId}`

    return {
      ok: true,
      message: 'Announcement published successfully to Neon PostgreSQL!',
      resultId,
      viewUrl,
      parsed,
      broadcastStatus
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Database save failed: ${err.message}`
    })
  }
})

async function sendBroadcastForAnnouncement(announcement: ParsedAnnouncement) {
  const config = useRuntimeConfig()
  const botToken = config.telegramBotToken
  if (!botToken) {
    return { skipped: true, reason: 'TELEGRAM_BOT_TOKEN not configured' }
  }

  // Fetch subscribers with role preferences
  const subsRes = await query<{ chat_id: string; role_filter?: string | null }>(
    "SELECT chat_id, COALESCE(role_filter, 'all') as role_filter FROM subscribers;"
  )
  if (subsRes.rows.length === 0) {
    return { sent: 0, total: 0, reason: 'No subscribers found' }
  }

  const checkText = `${announcement.position} ${announcement.announcement || ''} ${announcement.description || ''}`.toLowerCase()
  const nonAviationCaptainRemoved = checkText.replace(
    /\b(?:bell|banquet|restaurant|dining|service|hotel|kitchen|bar|waiter|security|team)\s+captains?\b/g,
    ''
  )
  const isPilot = (
    /\b(?:co-?)?pilots?\b(?!\s+(?:project|program|study))|\bfirst\s+officers?\b|\bcadets?\b|\bcockpit\b/.test(checkText) ||
    /\bcaptains?\b/.test(nonAviationCaptainRemoved)
  )
  const isCabin = (
    ['cabin crew', 'flight attendant', 'air hostess', 'cabin attendant', 'flight steward', 'air steward', 'cabin steward']
      .some(k => checkText.includes(k)) ||
    /\bstewardess(?:es)?\b/.test(checkText)
  )
  const isAmt = (
    [
      'a/c maintenance', 'a/c structure', 'a/c cabin maintenance', 'a/c airframe',
      'a/c avionics', 'a/c powerplant', 'aircraft mechanic', 'a/c machining', 'aircraft maintenance',
      'aviation maintenance', 'aircraft technician', 'avionics', 'powerplant technician', 'airframe technician'
    ].some(k => checkText.includes(k)) ||
    /\bamts?\b/.test(checkText)
  )

  const subscribers = subsRes.rows.filter(r => {
    const f = (r.role_filter || 'all').toLowerCase()
    if (f === 'all') return true
    if (f === 'pilot') return isPilot
    if (f === 'cabin') return isCabin
    if (f === 'amt') return isAmt
    if (f === 'aviation' || f === 'crew') return isPilot || isCabin || isAmt
    return true
  }).map(r => r.chat_id)

  if (subscribers.length === 0) {
    return { sent: 0, total: 0, reason: 'No matching subscribers found for this announcement category' }
  }

  const renderUrl = config.public.renderAppUrl || 'https://et-results.onrender.com'
  const viewerUrl = `${renderUrl}/results/${announcement.id}`

  const messageText = `✈️ *NEW RESULT ANNOUNCEMENT* ✈️\n\n` +
    `📋 *Position:*\n${announcement.position}\n\n` +
    (announcement.announcement ? `📢 *Type:*\n${announcement.announcement}\n\n` : '') +
    (announcement.date_time ? `📅 *Date & Time:*\n${announcement.date_time}\n\n` : '')

  const privateReplyMarkup = {
    inline_keyboard: [
      [
        { text: 'View Candidates', web_app: { url: viewerUrl } },
        { text: 'Visit Official Site', url: 'https://corporate.ethiopianairlines.com/AboutEthiopian/careers/results' }
      ]
    ]
  }

  // Telegram does not allow web_app buttons in channels or groups (negative chat IDs)
  const channelReplyMarkup = {
    inline_keyboard: [
      [
        { text: 'View Candidates', url: viewerUrl },
        { text: 'Visit Official Site', url: 'https://corporate.ethiopianairlines.com/AboutEthiopian/careers/results' }
      ]
    ]
  }

  let sent = 0
  for (const chatId of subscribers) {
    const isGroupOrChannel = String(chatId).trim().startsWith('-')
    try {
      await $fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        body: {
          chat_id: chatId,
          text: messageText,
          parse_mode: 'Markdown',
          reply_markup: isGroupOrChannel ? channelReplyMarkup : privateReplyMarkup,
          disable_web_page_preview: true
        }
      })
      sent++
      await new Promise(resolve => setTimeout(resolve, 50)) // Telegram rate limit guard
    } catch (e: any) {
      console.warn(`Failed to send telegram notification to ${chatId}:`, e.message)
    }
  }

  return {
    sent,
    total: subscribers.length
  }
}
