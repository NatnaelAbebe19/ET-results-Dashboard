import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

export function getDbPool(): pg.Pool {
  if (pool) {
    return pool
  }

  const config = useRuntimeConfig()
  const connectionString = config.databaseUrl || process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured in environment or runtimeConfig')
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  })

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err)
  })

  return pool
}

export async function query<T = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const p = getDbPool()
  const start = Date.now()
  try {
    const res = await p.query<T>(text, params)
    const duration = Date.now() - start
    // Uncomment for debugging if needed:
    // console.log('executed query', { text: text.slice(0, 80), duration, rows: res.rowCount })
    return res
  } catch (err: any) {
    console.error('Database query error:', { text, error: err.message })
    throw err
  }
}

export async function testDbConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now()
  try {
    const res = await query('SELECT NOW() as now, current_database() as db;')
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
