import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

function cleanConnectionString(connStr: string): string {
  // Strip channel_binding=require as node-postgres warns / handles libpq differently
  return connStr.replace(/[?&]channel_binding=[^&]+/g, '')
}

export function getDbPool(): pg.Pool {
  if (pool) {
    return pool
  }

  // Nuxt runtimeConfig is available at request time, but process.env is always reliable
  let connectionString = ''
  try {
    const config = useRuntimeConfig()
    connectionString = (config.databaseUrl as string) || ''
  } catch {
    // useRuntimeConfig may not be available outside H3 context
  }

  // Always fall back to process.env directly
  if (!connectionString) {
    connectionString = process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL || ''
  }

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured in environment or runtimeConfig')
  }

  connectionString = cleanConnectionString(connectionString)

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    max: 5,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000
  })

  pool.on('error', (err) => {
    console.warn('PostgreSQL pool background client error (resetting pool):', err.message)
    // Invalidate pool so next query creates a fresh one
    pool = null
  })

  return pool
}

export function resetDbPool() {
  if (pool) {
    pool.end().catch(() => {})
    pool = null
  }
}

export async function query<T = any>(text: string, params?: any[], retries = 2): Promise<pg.QueryResult<T>> {
  let lastErr: any = null

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const p = getDbPool()
      return await p.query<T>(text, params)
    } catch (err: any) {
      lastErr = err
      const isConnectionErr = 
        err.message?.includes('Connection terminated') ||
        err.message?.includes('client has been closed') ||
        err.message?.includes('ECONNRESET') ||
        err.message?.includes('timeout') ||
        err.code === '57P01' || // admin_shutdown
        err.code === '57P02' || // crash_shutdown
        err.code === '57P03'    // cannot_connect_now

      if (isConnectionErr && attempt <= retries) {
        console.warn(`Database query attempt ${attempt} failed with connection error: ${err.message}. Retrying...`)
        resetDbPool()
        await new Promise(resolve => setTimeout(resolve, 800 * attempt))
        continue
      }

      console.error('Database query error:', { text: text.slice(0, 80), error: err.message })
      throw err
    }
  }

  throw lastErr
}

export async function testDbConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now()
  try {
    await query('SELECT NOW() as now;')
    return {
      ok: true,
      latencyMs: Date.now() - start
    }
  } catch (err: any) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err.message || 'Failed to connect to Neon database'
    }
  }
}
