import type { Context } from 'hono'
import { sql } from '../db/client.js'

export async function healthRoute(c: Context) {
  try {
    await sql`SELECT 1`
    return c.json({ status: 'ok', db: 'ok' })
  } catch {
    return c.json({ status: 'ok', db: 'error' }, 200)
  }
}
